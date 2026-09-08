import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { notifyUsers } from '@/lib/notifications';
import { enqueueSmsForUsers, processSmsQueue } from '@/lib/smsQueue';
import { normalizeEmbedUrl } from '@/lib/embed';

const sessionDateFmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Tehran' });

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.classSession.findUnique({ where: { id }, include: { group: true } });
  if (!existing) return Response.json({ ok: false, error: 'جلسه یافت نشد.' }, { status: 404 });

  try {
    const b = await request.json();
    const data = {};
    if (typeof b.title === 'string') data.title = b.title.trim().slice(0, 120);
    if (b.startsAt) {
      const d = new Date(b.startsAt);
      if (Number.isNaN(d.getTime())) return Response.json({ ok: false, error: 'تاریخ نامعتبر است.' }, { status: 400 });
      data.startsAt = d;
    }
    if (b.chartDescription !== undefined) data.chartDescription = b.chartDescription ? String(b.chartDescription).trim().slice(0, 2000) : null;
    if (b.tools !== undefined) data.tools = b.tools ? String(b.tools).trim().slice(0, 1000) : null;
    if (b.homework !== undefined) data.homework = b.homework ? String(b.homework).trim().slice(0, 2000) : null;
    if (b.liveUrl !== undefined) {
      const rawLiveUrl = String(b.liveUrl || '').trim();
      data.liveUrl = rawLiveUrl ? normalizeEmbedUrl(rawLiveUrl) : null;
      if (rawLiveUrl && !data.liveUrl) {
        return Response.json({ ok: false, error: 'لینک کلاس باید یک نشانی عمومی و امن HTTPS یا کد iframe معتبر باشد.' }, { status: 400 });
      }
    }
    // ویدیوی ضبط‌شدهٔ این جلسه (فقط برای جلسهٔ پایان‌یافته در پنل هنرجو نمایش داده می‌شود)
    if (b.recordingUrl !== undefined) {
      const rawRecordingUrl = String(b.recordingUrl || '').trim();
      data.recordingUrl = rawRecordingUrl ? normalizeEmbedUrl(rawRecordingUrl) : null;
      if (rawRecordingUrl && !data.recordingUrl) {
        return Response.json({ ok: false, error: 'لینک ویدیوی ضبط‌شده باید HTTPS عمومی یا کد iframe معتبر باشد.' }, { status: 400 });
      }
    }

    const timeChanged = data.startsAt !== undefined;
    const { session, members, smsQueued } = await prisma.$transaction(async (tx) => {
      const updated = await tx.classSession.update({ where: { id }, data });
      await tx.classGroup.update({ where: { id: existing.groupId }, data: { updatedAt: new Date() } });

      if (!timeChanged) return { session: updated, members: [], smsQueued: 0 };
      const classMembers = await tx.user.findMany({
        where: { classGroupId: existing.groupId, role: 'student', active: true, deletedAt: null },
        select: { id: true },
      });
      const queued = await enqueueSmsForUsers(classMembers.map((member) => member.id), {
        kind: 'class_session',
        dedupePrefix: `class-session-update:${updated.id}:${updated.updatedAt.getTime()}`,
        body: existing.groupId,
      }, tx);
      return { session: updated, members: classMembers, smsQueued: queued };
    });

    if (timeChanged) {
      await processSmsQueue().catch((error) => console.error('class session update sms queue failed:', error));
      await notifyUsers(members.map((member) => member.id), {
        title: 'زمان کلاس تغییر کرد',
        body: `${session.title} — ${sessionDateFmt.format(session.startsAt)}`,
        href: '/dashboard/schedule',
        kind: 'class',
      });
    }

    return Response.json({ ok: true, session, memberCount: members.length, smsQueued, timeChanged });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    const existing = await prisma.classSession.findUnique({ where: { id } });
    if (existing) {
      await prisma.classSession.delete({ where: { id } });
      await prisma.classGroup.update({ where: { id: existing.groupId }, data: { updatedAt: new Date() } });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
