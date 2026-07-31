import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { slugify } from '@/lib/slug';
import { SECTION_VALUES } from '@/lib/sections';
import { randomBytes } from 'crypto';

function serialize(p) {
  return {
    id: p.id, title: p.title, slug: p.slug, section: p.section, excerpt: p.excerpt, body: p.body,
    coverImage: p.coverImage, aparatUrl: p.aparatUrl, published: p.published,
    publishAt: p.publishAt ? p.publishAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

// تبدیل ورودیِ زمان انتشار به Date معتبر یا null (خالی = فوری).
function parsePublishAt(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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
    const hasMedia = Boolean((b.coverImage && String(b.coverImage).trim()) || (b.aparatUrl && String(b.aparatUrl).trim()));
    if (!title) return Response.json({ ok: false, error: 'عنوان الزامی است.' }, { status: 400 });
    // برای مطالب متنی (اخبار/وبلاگ) متن الزامی است؛ برای محتوای رسانه‌ای (عکس/ویدیو) کافی است عکس یا ویدیو باشد.
    if (!body && !hasMedia) return Response.json({ ok: false, error: 'یا متن مطلب را بنویسید یا عکس/ویدیو اضافه کنید.' }, { status: 400 });

    const section = SECTION_VALUES.includes(b.section) ? b.section : 'news';
    const post = await prisma.post.create({
      data: {
        title,
        slug: await uniqueSlug(title),
        section,
        excerpt: b.excerpt ? String(b.excerpt).trim().slice(0, 300) : null,
        body,
        coverImage: b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null,
        aparatUrl: b.aparatUrl ? String(b.aparatUrl).trim().slice(0, 500) : null,
        published: b.published !== false,
        publishAt: parsePublishAt(b.publishAt),
        createdById: user.id,
      },
    });
    return Response.json({ ok: true, post: serialize(post) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
