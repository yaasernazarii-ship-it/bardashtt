import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user || !['admin', 'editor'].includes(user.role)) {
    return Response.json({ ok: false, error: 'بررسی عکس فقط برای مدیر و ادیتور مجاز است.' }, { status: 403 });
  }

  const { id, photoId } = await params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }
  if (!['approved', 'rejected'].includes(body.approvalStatus)) {
    return Response.json({ ok: false, error: 'تصمیم بررسی معتبر نیست.' }, { status: 400 });
  }

  const resume = await prisma.actorResume.findUnique({ where: { id }, select: { userId: true, fullName: true } });
  if (!resume?.userId) return Response.json({ ok: false, error: 'معرفی هنرجو یافت نشد.' }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${resume.userId} FOR UPDATE`;
    const result = await tx.resumePhoto.updateMany({
      where: { id: photoId, resumeId: id, approvalStatus: 'pending' },
      data: { approvalStatus: body.approvalStatus },
    });
    return result.count === 1;
  });
  if (!updated) return Response.json({ ok: false, error: 'عکس قبلاً بررسی شده یا دیگر وجود ندارد؛ صفحه را دوباره بارگذاری کنید.' }, { status: 409 });

  await logAction(user, {
    action: 'resume.photo.review',
    targetType: 'resume',
    targetId: id,
    summary: `عکس معرفی «${resume.fullName}» ${body.approvalStatus === 'approved' ? 'تأیید' : 'رد'} شد.`,
  });
  return Response.json({ ok: true, approvalStatus: body.approvalStatus });
}
