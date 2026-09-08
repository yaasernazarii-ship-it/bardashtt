import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { normalizeEmbedUrl } from '@/lib/embed';

function serialize(c) {
  return {
    id: c.id, title: c.title, slug: c.slug, description: c.description,
    price: c.price, coverImage: c.coverImage, teaserUrl: c.teaserUrl,
    published: c.published, order: c.order,
    lessons: (c.lessons || []).map((l) => ({ id: l.id, title: l.title, videoUrl: l.videoUrl, order: l.order })),
    lessonCount: c.lessons ? c.lessons.length : 0,
    buyerCount: c._count ? c._count.accesses : 0,
    createdAt: c.createdAt.toISOString(),
  };
}

function cleanLessons(input) {
  if (!Array.isArray(input)) return null;
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
      if (!t) return Response.json({ ok: false, error: 'عنوان دوره الزامی است.' }, { status: 400 });
      data.title = t;
    }
    if ('description' in b) data.description = b.description ? String(b.description).trim().slice(0, 5000) : null;
    if ('price' in b) {
      const price = parseInt(b.price, 10);
      if (Number.isNaN(price) || price < 0 || price > 1_000_000_000) {
        return Response.json({ ok: false, error: 'قیمت نامعتبر است.' }, { status: 400 });
      }
      data.price = price;
    }
    if ('coverImage' in b) data.coverImage = b.coverImage ? String(b.coverImage).trim().slice(0, 500) : null;
    if ('teaserUrl' in b) {
      const rawTeaserUrl = String(b.teaserUrl || '').trim();
      data.teaserUrl = rawTeaserUrl ? normalizeEmbedUrl(rawTeaserUrl) : null;
      if (rawTeaserUrl && !data.teaserUrl) {
        return Response.json({ ok: false, error: 'لینک تیزر باید یک نشانی عمومی و امن HTTPS یا کد iframe معتبر باشد.' }, { status: 400 });
      }
    }
    if ('published' in b) data.published = Boolean(b.published);
    if (Number.isInteger(b.order)) data.order = b.order;

    // ویدیوها به‌صورت یکجا جایگزین می‌شوند (حذف قبلی‌ها + ساخت لیست جدید) در یک تراکنش.
    const lessons = cleanLessons(b.lessons);

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.course.update({ where: { id }, data });
      if (lessons) {
        await tx.courseLesson.deleteMany({ where: { courseId: id } });
        if (lessons.length) {
          await tx.courseLesson.createMany({ data: lessons.map((l) => ({ ...l, courseId: id })) });
        }
      }
    });

    const course = await prisma.course.findUnique({
      where: { id },
      include: { lessons: { orderBy: { order: 'asc' } }, _count: { select: { accesses: true } } },
    });
    if (!course) return Response.json({ ok: false, error: 'دوره یافت نشد.' }, { status: 404 });
    return Response.json({ ok: true, course: serialize(course) });
  } catch (error) {
    if (error?.message === 'invalid_embed') {
      return Response.json({ ok: false, error: 'لینک هر ویدیو باید HTTPS عمومی یا کد iframe معتبر باشد.' }, { status: 400 });
    }
    return Response.json({ ok: false, error: 'دوره یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;
  try {
    await prisma.course.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'دوره یافت نشد.' }, { status: 400 });
  }
}
