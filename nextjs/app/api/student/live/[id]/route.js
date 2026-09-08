import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessLiveSession, getLiveEmbedSrc } from '@/lib/liveClass';
import { embedSrc } from '@/lib/embed';

// مسیر حیاتیِ امنیتی: تنها جایی که آدرس امبد پخش زنده به فرانت‌اند داده می‌شود.
// همهٔ شرط‌های دسترسی (احراز هویت، نقش، عضویت در کلاس، وضعیت جلسه) اینجا و فقط اینجا بررسی می‌شود؛
// اگر مجاز نباشد، embedSrc اصلاً در پاسخ وجود نخواهد داشت.
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const { id } = await params;
  const session = await prisma.classSession.findUnique({
    where: { id },
    include: { group: { select: { id: true, name: true, branch: true, teacherName: true } } },
  });
  if (!session) return Response.json({ ok: false, error: 'جلسه یافت نشد.' }, { status: 404 });

  if (!canAccessLiveSession(user, session)) {
    return Response.json({ ok: false, error: 'شما به این کلاس دسترسی ندارید.' }, { status: 403 });
  }

  return Response.json({
    ok: true,
    group: {
      id: session.group.id,
      name: session.group.name,
      branch: session.group.branch,
      teacherName: session.group.teacherName,
    },
    session: {
      id: session.id,
      title: session.title,
      startsAt: session.startsAt.toISOString(),
      liveStatus: session.liveStatus,
      liveStartedAt: session.liveStartedAt ? session.liveStartedAt.toISOString() : null,
      liveFinishedAt: session.liveFinishedAt ? session.liveFinishedAt.toISOString() : null,
      chartDescription: session.chartDescription,
      tools: session.tools,
      homework: session.homework,
      recordingSrc: session.liveStatus === 'finished' ? embedSrc(session.recordingUrl) : null,
    },
    // فقط دقیقاً وقتی جلسه LIVE است آدرس پخش برمی‌گردد.
    embedSrc: session.liveStatus === 'live' ? getLiveEmbedSrc(session.liveUrl) : null,
  });
}
