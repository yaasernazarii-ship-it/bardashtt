import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { zibalRequest, isZibalConfigured } from '@/lib/zibal';

// شروعِ پرداختِ آنلاین توسط هنرجو (هم خریدِ دورهٔ آنلاین و هم شهریه/پرداخت‌های دستیِ ادمین).
// تراکنش در زیبال ساخته و آدرسِ درگاه برای انتقال کاربر برگردانده می‌شود.
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.userId !== user.id) {
    return Response.json({ ok: false, error: 'پرداخت یافت نشد.' }, { status: 404 });
  }
  if (payment.status === 'paid') {
    return Response.json({ ok: false, error: 'این مبلغ قبلاً پرداخت شده است.' }, { status: 400 });
  }
  if (payment.status === 'canceled') {
    return Response.json({ ok: false, error: 'این پرداخت لغو شده است.' }, { status: 400 });
  }

  if (!isZibalConfigured()) {
    return Response.json({
      ok: false,
      pendingGateway: true,
      error: 'درگاه پرداخت آنلاین هنوز فعال نشده است. لطفاً کمی بعد دوباره تلاش کنید یا با پشتیبانی هماهنگ کنید.',
    });
  }

  const owner = await prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } });
  const r = await zibalRequest({
    amountToman: payment.amount,
    orderId: payment.id,
    description: payment.title,
    mobile: owner?.phone,
  });
  if (!r.ok) {
    return Response.json({ ok: false, error: r.error || 'اتصال به درگاه پرداخت ناموفق بود.' }, { status: 502 });
  }

  // trackId را روی فاکتور ذخیره می‌کنیم تا در callback همین رکورد پیدا شود.
  await prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayTrackId: r.trackId, method: 'online' },
  });

  return Response.json({ ok: true, redirectUrl: r.startUrl });
}
