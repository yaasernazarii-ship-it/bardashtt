import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// شروعِ پرداختِ آنلاین توسط هنرجو.
// این نقطه، محلِ اتصالِ درگاه (زیبال/زرین‌پال با اسنپ‌پی و دیجی‌پی) در فاز بعد است.
// فعلاً درگاه متصل نیست؛ زیرساخت آماده است و فقط باید ساختِ تراکنش و redirect اینجا اضافه شود.
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

  // TODO(فاز ۲): ساختِ تراکنش در درگاه و برگرداندنِ redirectUrl.
  return Response.json({
    ok: false,
    pendingGateway: true,
    error: 'درگاه پرداخت آنلاین هنوز متصل نشده است و به‌زودی فعال می‌شود. لطفاً برای هماهنگیِ پرداخت با پشتیبانی در تماس باشید.',
  });
}
