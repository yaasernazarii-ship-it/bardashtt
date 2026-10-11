import { prisma } from '@/lib/prisma';
import { getSessionUser, normalizePhone } from '@/lib/auth';
import { zibalRequest, isZibalConfigured } from '@/lib/zibal';
import { decodeSlug } from '@/lib/slug';

// ارقام فارسی/عربی را به لاتین تبدیل می‌کند تا کد پستیِ تایپ‌شده با کیبورد فارسی هم پذیرفته شود.
function toLatinDigits(input) {
  return String(input || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

// ثبت سفارش کتاب (کتابِ چاپی با ارسال پستی). برای همه باز است؛ اگر کاربر وارد باشد به سفارش وصل می‌شود.
// اگر کتاب قیمت داشته باشد و درگاه فعال باشد، کاربر مستقیم به درگاه پرداخت منتقل می‌شود.
export async function POST(request, { params }) {
  const { slug } = await params;
  try {
    const book = await prisma.book.findFirst({
      where: { slug: decodeSlug(slug), published: true },
      select: { id: true, title: true, price: true },
    });
    if (!book) return Response.json({ ok: false, error: 'کتاب یافت نشد.' }, { status: 404 });

    const b = await request.json();
    const name = String(b.name || '').trim().slice(0, 120);
    const phone = normalizePhone(b.phone);
    const address = b.address ? String(b.address).trim().slice(0, 500) : '';
    const postalCode = toLatinDigits(b.postalCode).replace(/[^\d]/g, '');
    if (!name) return Response.json({ ok: false, error: 'نام و نام خانوادگی را وارد کنید.' }, { status: 400 });
    if (!phone) return Response.json({ ok: false, error: 'شمارهٔ موبایل معتبر وارد کنید.' }, { status: 400 });
    if (address.length < 15) {
      return Response.json({ ok: false, error: 'نشانی پستی را کامل بنویسید (شهر، خیابان، کوچه، پلاک و واحد).' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(postalCode)) {
      return Response.json({ ok: false, error: 'کد پستی باید دقیقاً ۱۰ رقم باشد.' }, { status: 400 });
    }

    let quantity = parseInt(b.quantity, 10);
    if (Number.isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > 100) quantity = 100;

    const user = await getSessionUser();
    const amount = book.price > 0 ? book.price * quantity : null;

    const order = await prisma.bookOrder.create({
      data: {
        bookId: book.id,
        userId: user ? user.id : null,
        name,
        phone,
        address,
        postalCode,
        quantity,
        note: b.note ? String(b.note).trim().slice(0, 1000) : null,
        amount,
        status: 'new',
      },
    });

    // پرداختِ آنلاین فقط وقتی قیمت مشخص است و درگاه فعال است.
    if (amount && isZibalConfigured()) {
      const r = await zibalRequest({
        amountToman: amount,
        orderId: order.id,
        description: `خرید کتاب ${book.title}`,
        mobile: phone,
      });
      if (r.ok) {
        await prisma.bookOrder.update({
          where: { id: order.id },
          data: { gatewayTrackId: r.trackId, method: 'online' },
        });
        return Response.json({ ok: true, redirectUrl: r.startUrl });
      }
      // اگر اتصال به درگاه ناموفق بود، سفارش ثبت شده و به‌صورت دستی پیگیری می‌شود.
      return Response.json({
        ok: true,
        message: 'سفارش شما ثبت شد؛ اتصال به درگاه پرداخت در این لحظه ممکن نشد. همکاران ما برای هماهنگیِ پرداخت با شما تماس می‌گیرند.',
      });
    }

    return Response.json({ ok: true, message: 'سفارش شما ثبت شد. همکاران ما برای هماهنگی و پرداخت با شما تماس می‌گیرند.' });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
