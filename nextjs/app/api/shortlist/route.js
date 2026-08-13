import { prisma } from '@/lib/prisma';
import { getSessionUser, isFilmmakerOrManager } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// «لیست کوتاه» فیلمساز — بازیگرانی که برای بررسی بعدی نشان کرده است.
// مثل بانک بازیگران، فقط فیلمساز و ادمین/ادیتور دسترسی دارند.
async function requireFilmmaker() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isFilmmakerOrManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const { user, error } = await requireFilmmaker();
  if (error) return error;

  const rows = await prisma.actorShortlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  // رزومه‌ها را جدا می‌گیریم؛ اگر رزومه‌ای حذف یا غیرعمومی شده باشد از فهرست کنار می‌رود.
  const actors = rows.length
    ? await prisma.actorResume.findMany({
        where: { id: { in: rows.map((r) => r.actorId) }, isPublic: true },
        select: { id: true, fullName: true, headline: true, city: true, photoUrl: true },
      })
    : [];
  const byId = new Map(actors.map((a) => [a.id, a]));

  const items = rows
    .filter((r) => byId.has(r.actorId))
    .map((r) => ({ ...byId.get(r.actorId), note: r.note, addedAt: r.createdAt }));

  return Response.json({ ok: true, items });
}

export async function POST(request) {
  const { user, error } = await requireFilmmaker();
  if (error) return error;

  try {
    const b = await request.json();
    const actorId = String(b.actorId || '').trim();
    if (!actorId) return Response.json({ ok: false, error: 'بازیگر مشخص نیست.' }, { status: 400 });

    const actor = await prisma.actorResume.findFirst({ where: { id: actorId, isPublic: true }, select: { id: true } });
    if (!actor) return Response.json({ ok: false, error: 'بازیگر یافت نشد.' }, { status: 404 });

    const note = typeof b.note === 'string' ? b.note.trim().slice(0, 500) || null : undefined;

    await prisma.actorShortlist.upsert({
      where: { userId_actorId: { userId: user.id, actorId } },
      update: note === undefined ? {} : { note },
      create: { userId: user.id, actorId, note: note ?? null },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const { user, error } = await requireFilmmaker();
  if (error) return error;

  const actorId = new URL(request.url).searchParams.get('actorId');
  if (!actorId) return Response.json({ ok: false, error: 'بازیگر مشخص نیست.' }, { status: 400 });

  await prisma.actorShortlist.deleteMany({ where: { userId: user.id, actorId } });
  return Response.json({ ok: true });
}
