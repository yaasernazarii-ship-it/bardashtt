import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { slugify } from '@/lib/slug';
import { notifyAll } from '@/lib/notifications';
import { randomBytes } from 'crypto';
import { normalizeEmbedUrl } from '@/lib/embed';

function serialize(c) {
  return {
    id: c.id, title: c.title, slug: c.slug, description: c.description,
    price: c.price, coverImage: c.coverImage, teaserUrl: c.teaserUrl,
    published: c.published, order: c.order,
    lessons: (c.lessons || []).map((l) => ({ id: l.id, title: l.title, videoUrl: l.videoUrl, order: l.order })),
    lessonCount: c._count ? c._count.lessons : (c.lessons ? c.lessons.length : 0),
    buyerCount: c._count ? c._count.accesses : 0,
    createdAt: c.createdAt.toISOString(),
  };
}

async function uniqueSlug(title) {
  const base = slugify(title);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.course.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${randomBytes(2).toString('hex')}`;
  }
  return `${base}-${Date.now()}`;
}

// پاک‌سازیِ آرایهٔ ویدیوها از ورودی: هر آیتم باید عنوان و لینک/امبد داشته باشد.
function cleanLessons(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((l, i) => {
      const title = String(l?.title || '').trim().slice(0, 200);
      const rawUrl = String(l?.videoUrl || '').trim();
      const videoUrl = rawUrl ? normalizeEmbedUrl(rawUrl) : null;
      if (title && rawUrl && !videoUrl) throw new Error('invalid_embed');
      return { title, videoUrl, order: i };
    })
    .filter((l) => l.title && l.videoUrl);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const courses = await prisma.course.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { lessons: { orderBy: { order: 'asc' } }, _count: { select: { accesses: true } } },
  });
  return Response.json({ ok: true, courses: courses.map(serialize) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const title = String(b.title || '').trim().slice(0, 200);
    if (!title) return Response.json({ ok: false, error: 'عنوان دوره الزامی است.' }, { status: 400 });

    const price = parseInt(b.price, 10);
    if (Number.isNaN(price) || price < 0 || price > 1_000_000_000) {
      return Response.json({ ok: false, error: 'قیمت نامعتبر است (به تومان وارد کنید).' }, { status: 400 });
    }

    const lessons = cleanLessons(b.lessons);
    const rawTeaserUrl = String(b.teaserUrl || '').trim();
    const teaserUrl = rawTeaserUrl ? normalizeEmbedUrl(rawTeaserUrl) : null;
    if (rawTeaserUrl && !teaserUrl) {
      return Response.json({ ok: false, error: 'لینک تیزر باید یک نشانی عمومی و امن HTTPS یا کد iframe معتبر باشد.' }, { status: 400 });
    }
    const course = await prisma.course.create({
      data: {
        title,
        slug: await uniqueSlug(title),
        description: b.description ? String(b.description).trim().slice(0, 5000) : null,
        price,
        coverImage: b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null,
        teaserUrl,
        published: b.published !== false,
        order: Number.isInteger(b.order) ? b.order : 0,
        createdById: user.id,
        lessons: { create: lessons },
      },
      include: { lessons: { orderBy: { order: 'asc' } }, _count: { select: { accesses: true } } },
    });
    if (course.published) {
      await notifyAll({ title: 'دورهٔ آنلاین جدید', body: course.title, href: '/online-learning', kind: 'content' });
    }

    return Response.json({ ok: true, course: serialize(course) });
  } catch (error) {
    if (error?.message === 'invalid_embed') {
      return Response.json({ ok: false, error: 'لینک هر ویدیو باید HTTPS عمومی یا کد iframe معتبر باشد.' }, { status: 400 });
    }
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
