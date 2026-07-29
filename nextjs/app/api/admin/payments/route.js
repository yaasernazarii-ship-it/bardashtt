import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { courseByKey } from '@/lib/courses';

function serialize(p) {
  return {
    ...p,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, displayName: true, phone: true, username: true, courseTitle: true } } },
  });

  // هنرجویانی که می‌توان برایشان پرداخت تعریف کرد.
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true, displayName: true, phone: true, username: true, branch: true, courseTitle: true, graduated: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({ ok: true, payments: payments.map(serialize), students });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const userId = String(b.userId || '').trim();
    const title = String(b.title || '').trim().slice(0, 160);
    const amount = parseInt(b.amount, 10);

    if (!userId) return Response.json({ ok: false, error: 'هنرجو را انتخاب کنید.' }, { status: 400 });
    if (!title) return Response.json({ ok: false, error: 'بابتِ پرداخت (دلیل) را بنویسید.' }, { status: 400 });
    if (Number.isNaN(amount) || amount < 1000 || amount > 1_000_000_000) {
      return Response.json({ ok: false, error: 'مبلغ نامعتبر است (به تومان وارد کنید).' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target || target.role !== 'student') {
      return Response.json({ ok: false, error: 'هنرجوی معتبری انتخاب نشده است.' }, { status: 400 });
    }

    // اگر به یکی از ۵ دوره وصل باشد؛ در غیر این صورت پرداختِ جدا (افیش/متفرقه).
    const course = b.courseKey ? courseByKey(String(b.courseKey)) : null;

    const payment = await prisma.payment.create({
      data: {
        userId,
        title,
        amount,
        courseKey: course ? course.key : null,
        courseTitle: course ? course.title : null,
        createdById: user.id,
      },
    });

    // ارتقای هنرجو: دورهٔ فعلیِ او را به این دوره به‌روزرسانی می‌کنیم (فقط وقتی به دوره وصل و ارتقا خواسته شده باشد).
    if (course && b.promote) {
      await prisma.user.update({ where: { id: userId }, data: { courseTitle: course.title } });
    }

    return Response.json({ ok: true, payment: serialize(payment) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
