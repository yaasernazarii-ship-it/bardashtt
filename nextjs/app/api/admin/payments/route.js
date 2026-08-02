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
    // پشتیبانی از انتخابِ چند هنرجو (userIds) و نیز حالتِ تکیِ قدیمی (userId).
    const rawIds = Array.isArray(b.userIds) ? b.userIds : (b.userId ? [b.userId] : []);
    const userIds = [...new Set(rawIds.map((x) => String(x || '').trim()).filter(Boolean))];
    const title = String(b.title || '').trim().slice(0, 160);
    const amount = parseInt(b.amount, 10);

    if (userIds.length === 0) return Response.json({ ok: false, error: 'حداقل یک هنرجو را انتخاب کنید.' }, { status: 400 });
    if (!title) return Response.json({ ok: false, error: 'بابتِ پرداخت (دلیل) را بنویسید.' }, { status: 400 });
    if (Number.isNaN(amount) || amount < 1000 || amount > 1_000_000_000) {
      return Response.json({ ok: false, error: 'مبلغ نامعتبر است (به تومان وارد کنید).' }, { status: 400 });
    }

    // فقط هنرجویانِ معتبر را نگه می‌داریم.
    const targets = await prisma.user.findMany({
      where: { id: { in: userIds }, role: 'student' },
      select: { id: true },
    });
    if (targets.length === 0) {
      return Response.json({ ok: false, error: 'هنرجوی معتبری انتخاب نشده است.' }, { status: 400 });
    }

    // اگر به یکی از ۵ دوره وصل باشد؛ در غیر این صورت پرداختِ جدا (افیش/متفرقه).
    const course = b.courseKey ? courseByKey(String(b.courseKey)) : null;

    // یک فاکتور برای هر هنرجوی انتخاب‌شده، به‌صورت یک‌جا.
    const ops = targets.map((t) => prisma.payment.create({
      data: {
        userId: t.id,
        title,
        amount,
        courseKey: course ? course.key : null,
        courseTitle: course ? course.title : null,
        createdById: user.id,
      },
    }));
    // ارتقای هنرجویانِ انتخاب‌شده به همین دوره (فقط وقتی به دوره وصل و ارتقا خواسته شده باشد).
    if (course && b.promote) {
      ops.push(...targets.map((t) => prisma.user.update({ where: { id: t.id }, data: { courseTitle: course.title } })));
    }
    await prisma.$transaction(ops);

    return Response.json({ ok: true, count: targets.length });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
