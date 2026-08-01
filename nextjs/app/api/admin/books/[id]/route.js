import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

function serialize(b) {
  return {
    id: b.id, title: b.title, slug: b.slug, author: b.author, description: b.description,
    price: b.price, coverImage: b.coverImage, published: b.published, order: b.order,
    orderCount: b._count ? b._count.orders : 0,
    createdAt: b.createdAt.toISOString(),
  };
}

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function PATCH(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;

  try {
    const b = await request.json();
    const data = {};
    if (typeof b.title === 'string') {
      const t = b.title.trim().slice(0, 200);
      if (!t) return Response.json({ ok: false, error: 'عنوان کتاب الزامی است.' }, { status: 400 });
      data.title = t;
    }
    if ('author' in b) data.author = b.author ? String(b.author).trim().slice(0, 120) : null;
    if ('description' in b) data.description = b.description ? String(b.description).trim().slice(0, 5000) : null;
    if ('coverImage' in b) data.coverImage = b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null;
    if ('price' in b) {
      const price = parseInt(b.price, 10);
      if (Number.isNaN(price) || price < 0) return Response.json({ ok: false, error: 'قیمت نامعتبر است.' }, { status: 400 });
      data.price = price;
    }
    if ('published' in b) data.published = Boolean(b.published);
    if ('order' in b && Number.isInteger(b.order)) data.order = b.order;

    const book = await prisma.book.update({
      where: { id }, data,
      include: { _count: { select: { orders: true } } },
    });
    return Response.json({ ok: true, book: serialize(book) });
  } catch {
    return Response.json({ ok: false, error: 'کتاب یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;
  try {
    await prisma.book.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'کتاب یافت نشد.' }, { status: 400 });
  }
}
