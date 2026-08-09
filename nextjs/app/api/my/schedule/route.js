import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  if (!user.classGroupId) {
    return Response.json({ ok: true, group: null, sessions: [], progress: 0 });
  }

  const group = await prisma.classGroup.findUnique({
    where: { id: user.classGroupId },
    include: { sessions: { orderBy: { startsAt: 'asc' } } },
  });

  if (!group) {
    return Response.json({ ok: true, group: null, sessions: [], progress: 0 });
  }

  const now = Date.now();
  const total = group.sessions.length;
  const passed = group.sessions.filter((s) => s.startsAt.getTime() < now).length;

  // حضور/غیابِ خودِ هنرجو در جلسات این کلاس
  const attendances = await prisma.attendance.findMany({ where: { userId: user.id, session: { groupId: group.id } } });
  const attendanceBySession = Object.fromEntries(attendances.map((a) => [a.sessionId, a.status]));
  const presentCount = attendances.filter((a) => a.status === 'present').length;

  // پیشرفت: بر پایه‌ی حضورِ هنرجو از تعداد کل جلسات دوره (پیش‌فرض ۸ جلسه)؛
  // اگر ادمین/ادیتور درصد پیشرفت را دستی تعیین کرده باشد، همان مقدار جایگزین محاسبه‌ی خودکار می‌شود.
  const totalSessions = group.totalSessions || 8;
  const computedProgress = totalSessions ? Math.min(100, Math.round((presentCount / totalSessions) * 100)) : 0;
  const progress = user.progressOverride !== null && user.progressOverride !== undefined ? user.progressOverride : computedProgress;

  // نوتیفیکیشن: اگر برنامه بعد از آخرین بازدید هنرجو تغییر کرده باشد
  const hasUpdate = !user.scheduleSeenAt || group.updatedAt.getTime() > new Date(user.scheduleSeenAt).getTime();

  // علامت‌گذاری اینکه هنرجو برنامه را دید (برای نوتیفیکیشن)
  await prisma.user.update({ where: { id: user.id }, data: { scheduleSeenAt: new Date() } });

  return Response.json({
    ok: true,
    group: {
      id: group.id,
      name: group.name,
      branch: group.branch,
      courseTitle: group.courseTitle || user.courseTitle || null,
      coverImage: group.coverImage,
    },
    progress,
    presentCount,
    totalSessions,
    passed,
    total,
    hasUpdate,
    sessions: group.sessions.map((s) => ({
      id: s.id,
      title: s.title,
      startsAt: s.startsAt.toISOString(),
      chartDescription: s.chartDescription,
      tools: s.tools,
      homework: s.homework,
      past: s.startsAt.getTime() < now,
      attendance: attendanceBySession[s.id] || null,
    })),
  });
}
