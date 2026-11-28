import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

function serialize(o) {
  return {
    id: o.id, bookId: o.bookId, name: o.name, phone: o.phone, address: o.address, postalCode: o.postalCode,
    quantity: o.quantity, note: o.note, status: o.status, adminNote: o.adminNote,
    // اطلاعات مالی: بدونِ این‌ها معلوم نیست چقدر و کِی و با چه کد پیگیری‌ای پرداخت شده.
    amount: o.amount, method: o.method,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    gatewayTrackId: o.gatewayTrackId, gatewayRefId: o.gatewayRefId,
    userId: o.userId,
    createdAt: o.createdAt.toISOString(),
  };
}

// فهرست سفارش‌های یک کتاب (برای ادمین).
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });
  const { id } = await params;

  const orders = await prisma.bookOrder.findMany({
    where: { bookId: id },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json({ ok: true, orders: orders.map(serialize) });
}
