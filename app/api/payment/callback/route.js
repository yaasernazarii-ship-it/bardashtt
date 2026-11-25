import { prisma } from '@/lib/prisma';
import { zibalVerify, siteUrl } from '@/lib/zibal';
import { grantCourseAccess } from '@/lib/onlineCourses';
import { notifyPayment } from '@/lib/paymentNotify';
import { sendPurchaseSms } from '@/lib/purchaseSms';
import { sendMessage, isBaleConfigured } from '@/lib/bale';

export const dynamic = 'force-dynamic';

// بازگشت از درگاه زیبال. زیبال با پارامترهای query برمی‌گردد: trackId, success, status, orderId.
// امنیت: پارامترهای callback امضا ندارند و قابل جعل‌اند؛ پس «تنها منبعِ حقیقت» فراخوانیِ verify است.
export async function GET(request) {
  const site = siteUrl();
  const back = (status, ref) =>
    Response.redirect(`${site}/payment/result?status=${status}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`, 302);

  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');
  const success = searchParams.get('success');
  if (!trackId) return back('failed');

  // رکوردِ مرتبط را بر اساس trackId پیدا کن (اول فاکتورهای پرداخت، سپس سفارش کتاب).
  const payment = await prisma.payment.findFirst({ where: { gatewayTrackId: trackId } });
  const order = payment
    ? null
    : await prisma.bookOrder.findFirst({
        where: { gatewayTrackId: trackId },
        include: { book: { select: { title: true } } },
      });
  if (!payment && !order) return back('failed');

  // اگر کاربر پرداخت را لغو کرد یا ناموفق بود.
  if (success !== '1') return back('canceled');

  // تأیید نهایی از سمت درگاه.
  const v = await zibalVerify({ trackId });
  if (!v.ok) return back('failed');

  if (payment) {
    // idempotent: اگر قبلاً پرداخت‌شده ثبت شده، دوباره اعطا/اطلاع نده.
    if (payment.status !== 'paid') {
      const expectedRial = Math.round(payment.amount * 10);
      if (v.amountRial && v.amountRial !== expectedRial) return back('failed'); // محافظت در برابر دستکاریِ مبلغ
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'paid', method: 'online', paidAt: new Date(), gatewayRefId: v.refNumber },
      });
      // خریدِ دورهٔ آنلاین → اعطای خودکارِ دسترسی.
      if (updated.courseId) {
        await grantCourseAccess(updated.userId, updated.courseId, { source: 'gateway' });
      }
      const student = await prisma.user.findUnique({
        where: { id: updated.userId },
        select: { displayName: true, phone: true },
      });
      await notifyPayment(updated, student);
      // پیامک تأیید خرید برای خودِ خریدار
      await sendPurchaseSms({
        kind: 'course',
        phone: student?.phone,
        name: student?.displayName,
        title: updated.courseTitle || updated.title,
        amount: updated.amount,
        refId: v.refNumber,
      });
    }
    return back('success', v.refNumber);
  }

  // سفارشِ کتاب
  if (order.status !== 'paid') {
    if (order.amount && v.amountRial && v.amountRial !== Math.round(order.amount * 10)) return back('failed');
    await prisma.bookOrder.update({
      where: { id: order.id },
      data: { status: 'paid', method: 'online', paidAt: new Date(), gatewayRefId: v.refNumber },
    });
    try {
      if (isBaleConfigured()) {
        const money = Number(order.amount || 0).toLocaleString('fa-IR');
        await sendMessage(
          ['📚 سفارش کتاب پرداخت شد', `نام: ${order.name}`, `تلفن: ${order.phone}`, `تعداد: ${order.quantity}`, `مبلغ: ${money} تومان`].join('\n'),
        );
      }
    } catch {
      /* اطلاع‌رسانی نباید مسیر پرداخت را مختل کند */
    }
    // پیامک تأیید خرید برای خودِ خریدار
    await sendPurchaseSms({
      kind: 'book',
      phone: order.phone,
      name: order.name,
      title: order.book?.title,
      amount: order.amount,
      quantity: order.quantity,
      refId: v.refNumber,
    });
  }
  return back('success', v.refNumber);
}
