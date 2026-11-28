import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { embedSrc } from '@/lib/embed';

function value(input, limit) {
  if (typeof input !== 'string') return null;
  return input.trim().slice(0, limit) || null;
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user) || !['admin', 'editor'].includes(user.role)) return Response.json({ ok: false, error: 'دسترسی بررسی نمونه‌کار فقط برای مدیر و ادیتور است.' }, { status: 403 });
  const { id: resumeId, itemId } = await params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }

  const item = await prisma.actorPortfolioItem.findFirst({ where: { id: itemId, resumeId }, include: { resume: { select: { fullName: true } } } });
  if (!item) return Response.json({ ok: false, error: 'نمونه‌کار یافت نشد.' }, { status: 404 });

  const data = {};
  if (body.title !== undefined) data.title = value(body.title, 150);
  if (body.description !== undefined) data.description = value(body.description, 1500);
  if (body.status !== undefined) {
    if (!['approved', 'rejected'].includes(body.status)) return Response.json({ ok: false, error: 'وضعیت بررسی معتبر نیست.' }, { status: 400 });
    if (item.type === 'video' && body.status === 'approved') {
      const aparatUrl = value(body.aparatUrl, 1000);
      if (!aparatUrl || !embedSrc(aparatUrl)) return Response.json({ ok: false, error: 'برای انتشار ویدئو، لینک معتبر آپارات را ثبت کنید.' }, { status: 400 });
      data.aparatUrl = aparatUrl;
    }
    data.status = body.status;
    data.reviewedAt = new Date();
  }
  if (item.type === 'video' && body.aparatUrl !== undefined && data.aparatUrl === undefined) {
    const aparatUrl = value(body.aparatUrl, 1000);
    if (aparatUrl && !embedSrc(aparatUrl)) return Response.json({ ok: false, error: 'لینک ویدئو معتبر نیست.' }, { status: 400 });
    data.aparatUrl = aparatUrl;
  }
  if (!Object.keys(data).length) return Response.json({ ok: false, error: 'تغییری برای ذخیره ارسال نشده است.' }, { status: 400 });

  const updated = await prisma.actorPortfolioItem.update({ where: { id: item.id }, data });
  await logAction(user, { action: 'portfolio.review', targetType: 'actorPortfolio', targetId: item.id, summary: `نمونه‌کار ${item.type === 'image' ? 'عکس' : 'ویدئوی'} «${item.resume.fullName}» ${updated.status === 'approved' ? 'تأیید شد' : updated.status === 'rejected' ? 'رد شد' : 'ویرایش شد'}.` });
  return Response.json({ ok: true, item: updated });
}
