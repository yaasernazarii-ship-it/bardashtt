import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

function serialize(p) {
  return {
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body,
    coverImage: p.coverImage, aparatUrl: p.aparatUrl, published: p.published,
    createdAt: p.createdAt.toISOString(),
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
      if (!t) return Response.json({ ok: false, error: 'عنوان الزامی است.' }, { status: 400 });
      data.title = t;
    }
    if (typeof b.body === 'string') {
      const v = b.body.trim().slice(0, 20000);
      if (!v) return Response.json({ ok: false, error: 'متن مطلب الزامی است.' }, { status: 400 });
      data.body = v;
    }
    if ('excerpt' in b) data.excerpt = b.excerpt ? String(b.excerpt).trim().slice(0, 300) : null;
    if ('coverImage' in b) data.coverImage = b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null;
    if ('aparatUrl' in b) data.aparatUrl = b.aparatUrl ? String(b.aparatUrl).trim().slice(0, 500) : null;
    if ('published' in b) data.published = Boolean(b.published);

    const post = await prisma.post.update({ where: { id }, data });
    return Response.json({ ok: true, post: serialize(post) });
  } catch {
    return Response.json({ ok: false, error: 'مطلب یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;
  try {
    await prisma.post.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'مطلب یافت نشد.' }, { status: 400 });
  }
}
