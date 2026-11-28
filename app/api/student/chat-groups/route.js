import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { GROUP_LIMITS, groupRowFor, isStudentUser } from '@/lib/chatGroups';

// فهرست گروه‌هایی که این هنرجو عضوشان است. هیچ گروه دیگری — حتی نامش — برنمی‌گردد.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isStudentUser(user)) return Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 });

  const memberships = await prisma.chatGroupMember.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const ids = memberships.map((m) => m.groupId);

  const groups = ids.length
    ? await prisma.chatGroup.findMany({
        where: { id: { in: ids } },
        orderBy: { lastMessageAt: 'desc' },
        include: { _count: { select: { members: true } } },
      })
    : [];

  const rows = await Promise.all(groups.map((g) => groupRowFor(g, user.id)));

  return Response.json({
    ok: true,
    me: { id: user.id, name: user.displayName || user.username || 'هنرجو' },
    limits: { message: GROUP_LIMITS.message },
    groups: rows,
    unread: rows.reduce((sum, r) => sum + r.unread, 0),
  });
}
