import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { slugify } from '@/lib/slug';
import { notifyAll } from '@/lib/notifications';
import { randomBytes } from 'crypto';

function serialize(b, stats) {
  return {
    id: b.id, title: b.title, slug: b.slug, author: b.author, description: b.description,
    price: b.price, coverImage: b.coverImage, aparatUrl: b.aparatUrl, audioUrl: b.audioUrl,
    published: b.published, order: b.order,
    orderCount: b._count ? b._count.orders : 0,
    // آمار فروشِ واقعی (فقط سفارش‌های پرداخت‌شده/ارسال‌شده)
    paidCount: stats?.paidCount || 0,
    paidQuantity: stats?.paidQuantity || 0,
    paidAmount: stats?.paidAmount || 0,
    createdAt: b.createdAt.toISOString(),
  };
}

async function uniqueSlug(title) {
  const base = slugify(title);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.book.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${randomBytes(2).toString('hex')}`;
  }
  return `${base}-${Date.now()}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const books = await prisma.book.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { orders: true } } },
  });

  // جمعِ فروشِ پرداخت‌شدهٔ هر کتاب در یک کوئری.
  const sold = await prisma.bookOrder.groupBy({
    by: ['bookId'],
    where: { status: { in: ['paid', 'shipped'] } },
    _count: { _all: true },
    _sum: { amount: true, quantity: true },
  });
  const stats = new Map(sold.map((s) => [s.bookId, {
    paidCount: s._count._all,
    paidQuantity: s._sum.quantity || 0,
    paidAmount: s._sum.amount || 0,
  }]));

  return Response.json({ ok: true, books: books.map((b) => serialize(b, stats.get(b.id))) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const title = String(b.title || '').trim().slice(0, 200);
    if (!title) return Response.json({ ok: false, error: 'عنوان کتاب الزامی است.' }, { status: 400 });
    const price = parseInt(b.price, 10);
    if (Number.isNaN(price) || price < 0) return Response.json({ ok: false, error: 'قیمت را به تومان وارد کنید (برای رایگان: صفر).' }, { status: 400 });

    const book = await prisma.book.create({
      data: {
        title,
        slug: await uniqueSlug(title),
        author: b.author ? String(b.author).trim().slice(0, 120) : null,
        description: b.description ? String(b.description).trim().slice(0, 5000) : null,
        price,
        coverImage: b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null,
        aparatUrl: b.aparatUrl ? String(b.aparatUrl).trim().slice(0, 500) : null,
        audioUrl: b.audioUrl ? String(b.audioUrl).trim().slice(0, 500) : null,
        published: b.published !== false,
        order: Number.isInteger(b.order) ? b.order : 0,
        createdById: user.id,
      },
      include: { _count: { select: { orders: true } } },
    });
    if (book.published) {
      await notifyAll({ title: 'کتاب جدید', body: book.title, href: '/social-responsibility', kind: 'content' });
    }

    return Response.json({ ok: true, book: serialize(book) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
