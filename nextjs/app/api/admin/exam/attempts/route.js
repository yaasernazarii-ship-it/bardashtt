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
