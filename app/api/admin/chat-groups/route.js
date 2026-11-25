import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit';
import { GROUP_LIMITS, cleanBody, groupRowFor, requireManager, serializeGroup } from '@/lib/chatGroups';

// ساخت و مدیریت گروه‌های گفت‌وگوی هنرجویان — فقط ادمین و ادیتور.
export async function GET() {
  const { user, error } = await requireManager();
  if (error) return error;

  const groups = await prisma.chatGroup.findMany({
    orderBy: { lastMessageAt: 'desc' },
    include: { _count: { select: { members: true, messages: true } } },
  });

  const rows = await Promise.all(groups.map(async (g) => ({
    ...(await groupRowFor(g, user.id)),
    messageCount: g._count.messages,
  })));

  return Response.json({ ok: true, me: { id: user.id, role: user.role }, limits: { message: GROUP_LIMITS.message }, groups: rows });
}

// ساخت گروه تازه؛ اعضا در همین درخواست یا بعداً از صفحهٔ گروه اضافه می‌شوند.
export async function POST(request) {
  const { user, error } = await requireManager();
  if (error) return error;

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

  const name = cleanBody(b.name, GROUP_LIMITS.name);
  if (!name) return Response.json({ ok: false, error: 'نام گروه را بنویسید.' }, { status: 400 });

  const description = cleanBody(b.description, GROUP_LIMITS.description) || null;
  const photoUrl = typeof b.photoUrl === 'string' && b.photoUrl.startsWith('/media/') ? b.photoUrl : null;

  const group = await prisma.chatGroup.create({
    data: { name, description, photoUrl, createdById: user.id },
  });

  await logAction(user, {
    action: 'chat-group.create',
    targetType: 'ChatGroup',
    targetId: group.id,
    summary: `ساخت گروه گفت‌وگوی «${name}»`,
  });

  return Response.json({ ok: true, group: serializeGroup(group, 0) });
}
