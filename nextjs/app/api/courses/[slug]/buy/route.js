import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// شروعِ خریدِ دوره توسط کاربرِ واردشده.
// چون درگاهِ پرداختِ آنلاین هنوز وصل نیست، این نقطه یک «فاکتورِ در انتظار پرداخت» می‌سازد
// که در «پرداخت‌های من» کاربر و پنلِ پرداخت‌های ادمین دیده می‌شود.
// با paid شدنِ این فاکتور (تأییدِ دستیِ ادمین یا درگاه در فاز بعد)، دسترسیِ دوره خودکار داده می‌شود.
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'برای خرید ابتدا وارد حساب کاربری شوید.' }, { status: 401 });

  const { slug } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    select: { id: true, title: true, price: true },
  });
  if (!course) return Response.json({ ok: false, error: 'دوره یافت نشد.' }, { status: 404 });

  // اگر از قبل دسترسی دارد، خرید لازم نیست.
  const access = await prisma.courseAccess.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true },
  });
  if (access) {
    return Response.json({ ok: true, alreadyOwned: true, message: 'شما از قبل به این دوره دسترسی دارید.' });
  }

  // اگر فاکتورِ در انتظارِ پرداختِ همین دوره از قبل ساخته شده، تکراری نساز.
  const existing = await prisma.payment.findFirst({
    where: { userId: user.id, courseId: course.id, status: 'pending' },
    select: { id: true },
  });
  const payment = existing || await prisma.payment.create({
    data: {
      userId: user.id,
      title: `خرید دورهٔ ${course.title}`,
      courseId: course.id,
      courseTitle: course.title,
      amount: course.price,
    },
    select: { id: true },
  });

  return Response.json({
    ok: true,
    pending: true,
    paymentId: payment.id,
    message: 'درخواستِ خرید ثبت شد. برای تکمیلِ پرداخت و باز شدنِ ویدیوها با پشتیبانی هماهنگ کنید؛ به‌محضِ تأیید، دسترسیِ شما فعال می‌شود.',
  });
}
