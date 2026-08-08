import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { SECTION_VALUES } from '@/lib/sections';
import { BLOG_CATEGORY_VALUES } from '@/lib/blogCategories';

function serialize(p) {
  return {
    id: p.id, title: p.title, slug: p.slug, section: p.section, category: p.category, excerpt: p.excerpt, body: p.body,
    coverImage: p.coverImage, sourceUrl: p.sourceUrl, aparatUrl: p.aparatUrl, audioUrl: p.audioUrl, published: p.published,
    publishAt: p.publishAt ? p.publishAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

// فقط نشانی کاملِ http/https پذیرفته می‌شود تا لینک خروجیِ کارت مطلب امن بماند.
function externalUrl(value) {
  const v = String(value || '').trim().slice(0, 500);
  return /^https?:\/\//i.test(v) ? v : null;
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
      // برای محتوای رسانه‌ای (عکس/ویدیو/صوت) متن الزامی نیست؛ کافی است رسانه باشد.
      const hasMedia = Boolean((b.coverImage && String(b.coverImage).trim()) || (b.aparatUrl && String(b.aparatUrl).trim()) || (b.audioUrl && String(b.audioUrl).trim()));
      if (!v && !hasMedia) return Response.json({ ok: false, error: 'یا متن مطلب را بنویسید یا عکس/ویدیو/صوت اضافه کنید.' }, { status: 400 });
      data.body = v;
    }
    if ('excerpt' in b) data.excerpt = b.excerpt ? String(b.excerpt).trim().slice(0, 300) : null;
    if ('coverImage' in b) data.coverImage = b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null;
    if ('sourceUrl' in b) data.sourceUrl = externalUrl(b.sourceUrl);
    if ('aparatUrl' in b) data.aparatUrl = b.aparatUrl ? String(b.aparatUrl).trim().slice(0, 500) : null;
    if ('audioUrl' in b) data.audioUrl = b.audioUrl ? String(b.audioUrl).trim().slice(0, 500) : null;
    if ('published' in b) data.published = Boolean(b.published);
    if ('section' in b && SECTION_VALUES.includes(b.section)) data.section = b.section;
    if ('category' in b || 'section' in b) {
      const finalSection = data.section || (await prisma.post.findUnique({ where: { id }, select: { section: true } }))?.section;
      data.category = finalSection === 'blog' && BLOG_CATEGORY_VALUES.includes(b.category) ? b.category : null;
    }
    if ('publishAt' in b) {
      const d = b.publishAt ? new Date(b.publishAt) : null;
      data.publishAt = d && !Number.isNaN(d.getTime()) ? d : null;
    }

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
