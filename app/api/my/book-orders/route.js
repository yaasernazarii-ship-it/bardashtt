import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// سفارش‌های کتابِ خودِ کاربر. سفارش‌هایی که پیش از ورود و فقط با شمارهٔ موبایل ثبت شده‌اند هم دیده می‌شوند.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const or = [{ userId: user.id }];
  if (user.phone) or.push({ phone: user.phone });

  const rows = await prisma.bookOrder.findMany({
    where: { OR: or },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, quantity: true, amount: true, status: true, method: true,
      paidAt: true, gatewayRefId: true, createdAt: true,
      address: true, postalCode: true,
      book: { select: { title: true, coverImage: true } },
    },
  });

  return Response.json({
    ok: true,
    orders: rows.map((o) => ({
      id: o.id,
      title: o.book?.title || 'کتاب',
      coverImage: o.book?.coverImage || null,
      quantity: o.quantity,
      amount: o.amount,
      status: o.status,
      method: o.method,
      paidAt: o.paidAt ? o.paidAt.toISOString() : null,
      refId: o.gatewayRefId,
      address: o.address,
      postalCode: o.postalCode,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
