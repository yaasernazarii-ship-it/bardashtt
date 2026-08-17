import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { normalizeUploadUrl } from '@/lib/uploadUrl';
import { aparatEmbedUrl } from '@/lib/aparat';
import { notifyUsers } from '@/lib/notifications';
import {
  AUTHOR_SELECT,
  DAILY_POST_LIMIT,
  MAX_CAPTION,
  STORY_TTL_MS,
  authorCard,
  canUseSocial,
  needsReview,
  scheduleCleanup,
  serializePost,
  visibleWhere,
} from '@/lib/social';

export const dynamic = 'force-dynamic';

const PAGE = 12;

// شناسه‌های پستی که کاربر جاری لایک کرده (برای پر کردن قلبِ قرمز).
async function likedSet(viewer, ids) {
  if (!viewer || ids.length === 0) return new Set();
  const rows = await prisma.socialLike.findMany({
    where: { userId: viewer.id, postId: { in: ids } },
    select: { postId: true },
  });
  return new Set(rows.map((r) => r.postId));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'feed';
  const viewer = await getSessionUser();
  const canModerate = isManager(viewer);
  scheduleCleanup();

  // «نوشته‌های من»: همهٔ حالت‌ها (در انتظار بررسی، منتشرشده، ردشده) فقط برای خودِ نویسنده.
  if (scope === 'mine') {
    if (!viewer) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
    const items = await prisma.socialPost.findMany({
      where: { authorId: viewer.id },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: { author: { select: AUTHOR_SELECT } },
    });
    return Response.json({
      ok: true,
      canPost: canUseSocial(viewer),
      needsReview: needsReview(viewer),
      items: items.map((p) => serializePost(p, { isOwner: true, canModerate })),
    });
  }

  // نوار استوری: استوری‌های زندهٔ همه، گروه‌بندی‌شده بر اساس نویسنده.
  if (scope === 'stories') {
    const rows = await prisma.socialPost.findMany({
      where: { kind: 'story', ...visibleWhere() },
      orderBy: { publishedAt: 'asc' },
      take: 200,
      include: { author: { select: AUTHOR_SELECT } },
    });
    const byAuthor = new Map();
    for (const s of rows) {
      const card = authorCard(s.author);
      if (!byAuthor.has(s.authorId)) byAuthor.set(s.authorId, { author: card, items: [] });
      byAuthor.get(s.authorId).items.push({
        id: s.id,
        imageUrl: s.imageUrl,
        caption: s.caption,
        publishedAt: s.publishedAt,
        expiresAt: s.expiresAt,
        canDelete: canModerate || s.authorId === viewer?.id,
      });
    }
    return Response.json({ ok: true, groups: [...byAuthor.values()] });
  }

  // فید عمومی (یا پست‌های یک کاربر مشخص).
  const where = { kind: 'post', ...visibleWhere() };
  if (scope === 'user') {
    const handle = (searchParams.get('handle') || '').trim();
    const author = await prisma.user.findFirst({
      where: { OR: [{ username: handle }, { id: handle }] },
      select: { id: true },
    });
    if (!author) return Response.json({ ok: true, items: [], nextCursor: null });
    where.authorId = author.id;
  }

  const cursor = searchParams.get('cursor');
  const rows = await prisma.socialPost.findMany({
    where,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { author: { select: AUTHOR_SELECT } },
  });
  const hasMore = rows.length > PAGE;
  const items = hasMore ? rows.slice(0, PAGE) : rows;
  const liked = await likedSet(viewer, items.map((p) => p.id));

  return Response.json({
    ok: true,
    canPost: canUseSocial(viewer),
    canModerate,
    me: viewer ? authorCard(viewer) : null,
    items: items.map((p) =>
      serializePost(p, { viewerLiked: liked.has(p.id), canModerate, isOwner: p.authorId === viewer?.id }),
    ),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!canUseSocial(user)) {
    return Response.json({ ok: false, error: 'انتشار در شبکهٔ اجتماعی فقط برای هنرجویان و فیلم‌سازان است.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const kind = body.kind === 'story' ? 'story' : 'post';
  const imageUrl = normalizeUploadUrl(body.imageUrl);
  if (imageUrl === false) {
    return Response.json({ ok: false, error: 'عکس معتبر نیست؛ دوباره آپلود کنید.' }, { status: 400 });
  }
  // فقط لینک آپارات پذیرفته می‌شود: ویدیو روی سرور ما ذخیره نمی‌شود و کد امبدِ دلخواه هم اجرا نمی‌گردد.
  const rawVideo = String(body.aparatUrl || '').trim();
  const aparatUrl = rawVideo ? (aparatEmbedUrl(rawVideo) ? rawVideo.slice(0, 300) : null) : null;
  if (rawVideo && !aparatUrl) {
    return Response.json({ ok: false, error: 'لینک آپارات معتبر نیست. نشانی صفحهٔ ویدیو در آپارات را بگذارید.' }, { status: 400 });
  }
  const caption = String(body.caption || '').trim().slice(0, MAX_CAPTION) || null;

  if (kind === 'story' && !imageUrl) {
    return Response.json({ ok: false, error: 'برای استوری باید یک عکس انتخاب کنید.' }, { status: 400 });
  }
  if (kind === 'post' && !imageUrl && !aparatUrl) {
    return Response.json({ ok: false, error: 'برای پست حداقل یک عکس یا لینک ویدیوی آپارات لازم است.' }, { status: 400 });
  }

  // سقف روزانه: جلوی اسپم و پر شدن دیسک را می‌گیرد.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayCount = await prisma.socialPost.count({ where: { authorId: user.id, createdAt: { gte: since } } });
  if (todayCount >= DAILY_POST_LIMIT) {
    return Response.json({ ok: false, error: `در هر ۲۴ ساعت حداکثر ${DAILY_POST_LIMIT} مطلب می‌توانید بفرستید.` }, { status: 429 });
  }

  const review = needsReview(user);
  const now = new Date();
  const post = await prisma.socialPost.create({
    data: {
      authorId: user.id,
      kind,
      imageUrl,
      aparatUrl,
      caption,
      status: review ? 'pending' : 'published',
      ...(review
        ? {}
        : {
            publishedAt: now,
            expiresAt: kind === 'story' ? new Date(now.getTime() + STORY_TTL_MS) : null,
          }),
    },
    include: { author: { select: AUTHOR_SELECT } },
  });

  // مدیرها در همان زنگولهٔ اعلانِ پنل خبردار می‌شوند که چیزی منتظر بررسی است.
  if (review) {
    const managers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'editor'] }, active: true },
      select: { id: true },
    });
    await notifyUsers(managers.map((m) => m.id), {
      title: 'محتوای تازه در شبکهٔ اجتماعی',
      body: `${user.displayName || user.username || 'یک کاربر'} یک ${kind === 'story' ? 'استوری' : 'پست'} فرستاده و منتظر بررسی است.`,
      href: '/dashboard/admin/social',
      kind: 'system',
    });
  }

  return Response.json({ ok: true, review, item: serializePost(post, { isOwner: true }) });
}
