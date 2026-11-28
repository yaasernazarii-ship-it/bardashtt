import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// فهرست جلسات کلاسِ خودِ هنرجو، برای کارت‌های «کلاس‌های آنلاین من».
// این مسیر عمداً embedSrc برنمی‌گرداند؛ آدرس پخش فقط از /api/student/live/[id] و فقط هنگام LIVE داده می‌شود.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  if (user.role !== 'student' || user.graduated || !user.classGroupId) {
    return Response.json({ ok: true, group: null, sessions: [] });
  }

  const group = await prisma.classGroup.findUnique({
    where: { id: user.classGroupId },
    select: {
      id: true,
      name: true,
      branch: true,
      teacherName: true,
      sessions: {
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          startsAt: true,
          liveStatus: true,
          liveStartedAt: true,
          liveFinishedAt: true,
          recordingUrl: true,
        },
      },
    },
  });
  if (!group) return Response.json({ ok: true, group: null, sessions: [] });

  return Response.json({
    ok: true,
    group: { id: group.id, name: group.name, branch: group.branch, teacherName: group.teacherName },
    sessions: group.sessions.map((s) => ({
      id: s.id,
      title: s.title,
      startsAt: s.startsAt.toISOString(),
      liveStatus: s.liveStatus,
      liveStartedAt: s.liveStartedAt ? s.liveStartedAt.toISOString() : null,
      liveFinishedAt: s.liveFinishedAt ? s.liveFinishedAt.toISOString() : null,
      hasRecording: !!s.recordingUrl,
    })),
  });
}
