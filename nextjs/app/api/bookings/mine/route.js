import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// درخواست‌های ست تایمِ خودِ کاربر واردشده (فیلمساز).
// یادداشت خصوصیِ ادمین (adminNote) عمداً برگردانده نمی‌شود؛ فقط «reply» که برای فیلمساز نوشته شده.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const rows = await prisma.bookingRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      actorId: true,
      actorName: true,
      message: true,
      status: true,
      reply: true,
      replyAt: true,
      createdAt: true,
    },
  });

  const counts = rows.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {},
  );

  return Response.json({ ok: true, bookings: rows, counts });
}
