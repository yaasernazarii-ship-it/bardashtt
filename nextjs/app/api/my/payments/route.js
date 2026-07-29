import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const rows = await prisma.payment.findMany({
    where: { userId: user.id, status: { not: 'canceled' } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, title: true, courseTitle: true, amount: true,
      status: true, method: true, paidAt: true, createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    payments: rows.map((p) => ({
      ...p,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
