import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  // درخواست‌های ثبت‌نام این کاربر را بر اساس شماره موبایل او پیدا می‌کنیم.
  const rows = await prisma.enrollment.findMany({
    where: { phone: user.phone },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, courseTitle: true, status: true, actorType: true,
      aiAnalysis: true, adminNote: true, createdAt: true, updatedAt: true,
    },
  });

  return Response.json({
    ok: true,
    enrollments: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}
