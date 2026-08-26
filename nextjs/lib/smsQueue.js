import { normalizePhone } from './auth';
import { prisma } from './prisma';
import { sendGroupNotificationSms, sendTextSms } from './sms';

const RETRY_DELAY_MS = 2 * 60 * 1000;
const STALE_SENDING_MS = 10 * 60 * 1000;

export async function enqueueSmsForUsers(userIds, { kind, body, dedupePrefix }, db = prisma) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  const text = String(body || '').trim();
  if (ids.length === 0 || !text || !dedupePrefix) return 0;

  const users = await db.user.findMany({
    where: { id: { in: ids }, role: 'student', active: true, deletedAt: null },
    select: { id: true, phone: true },
  });
  const rows = users.map((user) => ({
    userId: user.id,
    phone: normalizePhone(user.phone),
    kind,
    body: text,
    dedupeKey: `${dedupePrefix}:${user.id}`,
  })).filter((row) => row.phone);
  if (rows.length === 0) return 0;

  const result = await db.smsNotificationQueue.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

async function deliver(item) {
  const claimed = await prisma.smsNotificationQueue.updateMany({
    where: { id: item.id, status: 'pending' },
    data: { status: 'sending' },
  });
  if (claimed.count !== 1) return false;

  const result = item.kind === 'group_message'
    ? await sendGroupNotificationSms(item.phone, item.body)
    : await sendTextSms(item.phone, item.body);
  if (result.delivered) {
    await prisma.smsNotificationQueue.update({
      where: { id: item.id },
      data: {
        status: 'sent',
        attempts: { increment: 1 },
        sentAt: new Date(),
        providerId: String(result.packId || result.messageId || ''),
        lastError: null,
      },
    });
    return true;
  }

  const detail = [result.reason, result.detail].filter(Boolean).join(': ').slice(0, 500);
  await prisma.smsNotificationQueue.update({
    where: { id: item.id },
    data: {
      status: 'pending',
      attempts: { increment: 1 },
      nextAttemptAt: new Date(Date.now() + RETRY_DELAY_MS),
      lastError: detail || 'unknown_error',
    },
  });
  return false;
}

export async function processSmsQueue({ limit = 30 } = {}) {
  const now = new Date();
  await prisma.smsNotificationQueue.updateMany({
    where: { status: 'sending', updatedAt: { lt: new Date(now.getTime() - STALE_SENDING_MS) } },
    data: { status: 'pending', nextAttemptAt: now, lastError: 'recovered_stale_job' },
  });

  const items = await prisma.smsNotificationQueue.findMany({
    where: { status: 'pending', nextAttemptAt: { lte: now } },
    orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    take: Math.max(1, Math.min(Number(limit) || 30, 100)),
  });

  const results = [];
  for (let index = 0; index < items.length; index += 5) {
    results.push(...await Promise.all(items.slice(index, index + 5).map((item) => deliver(item))));
  }
  return {
    processed: items.length,
    sent: results.filter(Boolean).length,
    pending: results.filter((sent) => !sent).length,
  };
}
