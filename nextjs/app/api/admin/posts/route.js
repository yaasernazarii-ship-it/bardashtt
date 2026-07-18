import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { slugify } from '@/lib/slug';
import { randomBytes } from 'crypto';

function serialize(p) {
  return {
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body,
    coverImage: p.coverImage, aparatUrl: p.aparatUrl, published: p.published,
    createdAt: p.createdAt.toISOString(),
  };
}

async function uniqueSlug(title) {
  let base = slugify(title);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.post.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${randomBytes(2).toString('hex')}`;
  }
  return `${base}-${Date.now()}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json({ ok: true, posts: posts.map(serialize) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const title = String(b.title || '').trim().slice(0, 200);
    const body = String(b.body || '').trim().slice(0, 20000);
    if (!title) return Response.json({ ok: false, error: 'عنوان الزامی است.' }, { status: 400 });
    if (!body) return Response.json({ ok: false, error: 'متن مطلب الزامی است.' }, { status: 400 });

    const post = await prisma.post.create({
      data: {
        title,
        slug: await uniqueSlug(title),
        excerpt: b.excerpt ? String(b.excerpt).trim().slice(0, 300) : null,
        body,
        coverImage: b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null,
        aparatUrl: b.aparatUrl ? String(b.aparatUrl).trim().slice(0, 500) : null,
        published: b.published !== false,
        createdById: user.id,
      },
    });
    return Response.json({ ok: true, post: serialize(post) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
