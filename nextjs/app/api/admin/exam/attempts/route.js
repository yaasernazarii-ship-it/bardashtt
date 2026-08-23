import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

// کارنامهٔ آزمون‌های ثبت‌شده برای مدیر.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const attempts = await prisma.examAttempt.findMany({
    orderBy: { startedAt: 'desc' },
    take: 300,
    include: {
      user: { select: { id: true, displayName: true, username: true, phone: true, branch: true, courseTitle: true } },
      certificate: { select: { serial: true, revoked: true } },
    },
  });

  return Response.json({
    ok: true,
    items: attempts.map((a) => ({
      id: a.id,
      user: a.user,
      total: a.total,
      score: a.score,
      percent: a.percent,
      classScore: a.classScore,
      finalPercent: a.finalPercent,
      passed: a.passed,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      certificate: a.certificate,
    })),
  });
}

export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ ok: false, error: 'آزمون مشخص نشده است.' }, { status: 400 });

  const attempt = await prisma.examAttempt.findUnique({
    where: { id },
    select: { id: true, certificate: { select: { serial: true } } },
  });
  if (!attempt) return Response.json({ ok: false, error: 'آزمون یافت نشد.' }, { status: 404 });
  if (attempt.certificate) {
    return Response.json({
      ok: false,
      error: `ابتدا گواهی ${attempt.certificate.serial} را از بخش گواهی‌نامه‌ها حذف کنید.`,
    }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.examPermit.deleteMany({ where: { attemptId: id } }),
    prisma.examAttempt.delete({ where: { id } }),
  ]);
  return Response.json({ ok: true });
}
