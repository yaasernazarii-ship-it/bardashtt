import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const rows = await prisma.enrollment.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, courseTitle: true, fullName: true, phone: true, status: true,
      actorType: true, aiAnalysis: true, videoUrl: true, adminNote: true,
      answers: true, createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    enrollments: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
}
