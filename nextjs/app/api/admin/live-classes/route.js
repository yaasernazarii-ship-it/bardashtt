import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const sessions = await prisma.classSession.findMany({
    orderBy: { startsAt: 'desc' },
    include: {
      group: { select: { id: true, name: true, branch: true, teacherName: true, _count: { select: { members: true } } } },
    },
  });

  return Response.json({
    ok: true,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      startsAt: s.startsAt.toISOString(),
      liveStatus: s.liveStatus,
      liveStartedAt: s.liveStartedAt ? s.liveStartedAt.toISOString() : null,
      liveFinishedAt: s.liveFinishedAt ? s.liveFinishedAt.toISOString() : null,
      liveStartedByName: s.liveStartedByName,
      liveFinishedByName: s.liveFinishedByName,
      recordingUrl: s.recordingUrl,
      group: {
        id: s.group.id,
        name: s.group.name,
        branch: s.group.branch,
        teacherName: s.group.teacherName,
        memberCount: s.group._count.members,
      },
    })),
  });
}
