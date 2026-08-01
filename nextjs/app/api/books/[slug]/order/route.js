import { prisma } from '@/lib/prisma';
import { getSessionUser, normalizePhone } from '@/lib/auth';

// ثبت سفارش کتاب. برای همه (حتی بدون ورود) باز است؛ اگر کاربر وارد باشد، به سفارش وصل می‌شود.
export async function POST(request, { params }) {
  const { slug } = await params;
  try {
    const book = await prisma.book.findFirst({ where: { slug, published: true }, select: { id: true } });
    if (!book) return Response.json({ ok: false, error: 'کتاب یافت نشد.' }, { status: 404 });

    const b = await request.json();
    const name = String(b.name || '').trim().slice(0, 120);
    const phone = normalizePhone(b.phone);
    if (!name) return Response.json({ ok: false, error: 'نام و نام خانوادگی را وارد کنید.' }, { status: 400 });
    if (!phone) return Response.json({ ok: false, error: 'شمارهٔ موبایل معتبر وارد کنید.' }, { status: 400 });

    let quantity = parseInt(b.quantity, 10);
    if (Number.isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > 100) quantity = 100;

    const user = await getSessionUser();

    await prisma.bookOrder.create({
      data: {
        bookId: book.id,
        userId: user ? user.id : null,
        name,
        phone,
        address: b.address ? String(b.address).trim().slice(0, 500) : null,
        quantity,
        note: b.note ? String(b.note).trim().slice(0, 1000) : null,
        status: 'new',
      },
    });
    return Response.json({ ok: true, message: 'سفارش شما ثبت شد. همکاران ما برای هماهنگی و پرداخت با شما تماس می‌گیرند.' });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
