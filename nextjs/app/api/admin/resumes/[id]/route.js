import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { removeLocalUploads } from '@/lib/uploadCleanup';
import { parseResumeBody, serializeResume, resumeLocalUrls, INTRO_PHOTO_LIMIT, INTRO_LOOKS, INTRO_POSES } from '@/lib/resume';

const WITH_MEDIA = {
  user: { select: { photoUrl: true } },
  photos: { orderBy: { sortOrder: 'asc' } },
  videos: { orderBy: { sortOrder: 'asc' } },
};

async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function GET(request, { params }) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const resume = await prisma.actorResume.findUnique({ where: { id }, include: WITH_MEDIA });
  if (!resume) return Response.json({ ok: false, error: 'رزومه یافت نشد.' }, { status: 404 });

  return Response.json({ ok: true, resume: serializeResume(resume) });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  // انتشار/عدم انتشار از فهرست، بدون فرستادن دوبارهٔ کل فرم
  if (body.setPublic !== undefined) {
    const target = await prisma.actorResume.findUnique({ where: { id }, select: { id: true } });
    if (!target) return Response.json({ ok: false, error: 'رزومه یافت نشد.' }, { status: 404 });
    const updated = await prisma.actorResume.update({
      where: { id },
      data: { isPublic: !!body.setPublic },
      select: { id: true, fullName: true, isPublic: true },
    });
    await logAction(user, {
      action: 'resume.publish',
      targetType: 'resume',
      targetId: id,
      summary: `رزومهٔ «${updated.fullName}» ${updated.isPublic ? 'در بانک بازیگران منتشر شد' : 'از بانک بازیگران خارج شد'}.`,
    });
    return Response.json({ ok: true, resume: updated });
  }

  const [current, fieldDefs] = await Promise.all([
    prisma.actorResume.findUnique({ where: { id }, include: WITH_MEDIA }),
    prisma.resumeFieldDef.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);
  if (!current) return Response.json({ ok: false, error: 'رزومه یافت نشد.' }, { status: 404 });
  if (current.userId && !['admin', 'editor'].includes(user.role)) return Response.json({ ok: false, error: 'ویرایش معرفی هنرجو فقط برای مدیر و ادیتور مجاز است.' }, { status: 403 });

  const parsed = parseResumeBody(body, fieldDefs, current.userId ? Math.max(20, current.photos.length + INTRO_PHOTO_LIMIT) : undefined);
  if (parsed.error) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  if (current.userId) {
    parsed.photos = parsed.photos.map((photo, index) => ({
      ...photo,
      approvalStatus: current.photos.find((previous) => previous.id === parsed.photoIds[index])?.approvalStatus || 'approved',
    }));
  }
  if (current.userId && (parsed.photos.filter((photo) => photo.approvalStatus !== 'rejected').length > INTRO_PHOTO_LIMIT || parsed.photos.some((photo) => !INTRO_LOOKS[parsed.data.gender]?.includes(photo.look) || !INTRO_POSES.includes(photo.pose)))) {
    return Response.json({ ok: false, error: 'عکس‌های معرفی باید حداکثر ۱۵ عدد و دارای حالت چهره و زاویهٔ معتبر باشند.' }, { status: 400 });
  }

  // عکس‌ها و ویدیوها همیشه با فهرست تازهٔ فرم جایگزین می‌شوند تا ترتیب و حذف‌ها دقیقاً اعمال شود.
  const result = await prisma.$transaction(async (tx) => {
    if (current.userId) {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${current.userId} FOR UPDATE`;
      const existing = await tx.resumePhoto.findMany({ where: { resumeId: id }, select: { id: true, approvalStatus: true } });
      if (existing.length !== current.photos.length || existing.some((photo) => !current.photos.some((previous) => previous.id === photo.id && previous.approvalStatus === photo.approvalStatus))) {
        return { error: 'عکس‌های معرفی تغییر کرده‌اند؛ صفحه را دوباره بارگذاری کنید.' };
      }
    }
    await tx.resumePhoto.deleteMany({ where: { resumeId: id } });
    await tx.resumeVideo.deleteMany({ where: { resumeId: id } });
    return { resume: await tx.actorResume.update({
      where: { id },
      data: {
        ...parsed.data,
        photos: { create: parsed.photos },
        videos: { create: parsed.videos },
      },
      include: WITH_MEDIA,
    }) };
  });
  if (result.error) return Response.json({ ok: false, error: result.error }, { status: 409 });
  const resume = result.resume;

  // فایل‌های محلی‌ای که دیگر در رزومه نیستند از دیسک پاک می‌شوند.
  const keep = new Set(resumeLocalUrls(resume));
  await removeLocalUploads(resumeLocalUrls(current).filter((url) => url && !keep.has(url)));

  await logAction(user, {
    action: 'resume.update',
    targetType: 'resume',
    targetId: id,
    summary: `رزومهٔ «${resume.fullName}» ویرایش شد.`,
  });

  return Response.json({ ok: true, resume: serializeResume(resume) });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const current = await prisma.actorResume.findUnique({ where: { id }, include: WITH_MEDIA });
  if (!current) return Response.json({ ok: false, error: 'رزومه یافت نشد.' }, { status: 404 });
  if (current.userId && !['admin', 'editor'].includes(user.role)) return Response.json({ ok: false, error: 'حذف معرفی هنرجو فقط برای مدیر و ادیتور مجاز است.' }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    // لیست کوتاهِ فیلم‌سازان به شناسهٔ رزومه اشاره می‌کند و رابطهٔ پایگاه‌داده ندارد.
    await tx.actorShortlist.deleteMany({ where: { actorId: id } });
    await tx.actorResume.delete({ where: { id } });
  });

  await removeLocalUploads(resumeLocalUrls(current));

  await logAction(user, {
    action: 'resume.delete',
    targetType: 'resume',
    targetId: id,
    summary: `رزومهٔ «${current.fullName}» حذف شد.`,
  });

  return Response.json({ ok: true });
}
