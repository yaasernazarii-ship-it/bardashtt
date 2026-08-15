import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { notifyUsers } from '@/lib/notifications';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import { CATEGORIES, LIMITS, cleanText, displayNameOf, resolveTarget, serializeReport } from '@/lib/staffReports';

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

const withComments = { comments: { orderBy: { createdAt: 'asc' } } };

// ویرایش متن گزارش فقط برای نویسندهٔ همان گزارش؛ اما «انجام شد / بازگشایی» را هر مدیری می‌تواند بزند،
// چون ممکن است کار را همکار دیگری تمام کرده باشد. اجازه‌ها اینجا (سرور) تعیین می‌شود، نه در مرورگر.
export async function PATCH(request, { params }) {
  const { user, error } = await guard();
  if (error) return error;
  const { id } = await params;

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

  const report = await prisma.staffReport.findUnique({ where: { id } });
  if (!report) return Response.json({ ok: false, error: 'گزارش پیدا نشد.' }, { status: 404 });

  const data = {};

  if (b.status === 'open' || b.status === 'done') {
    data.status = b.status;
    data.doneById = b.status === 'done' ? user.id : null;
    data.doneByName = b.status === 'done' ? displayNameOf(user) : null;
    data.doneAt = b.status === 'done' ? new Date() : null;
  }

  const editing = typeof b.title === 'string' || typeof b.body === 'string' || typeof b.category === 'string'
    || typeof b.targetId === 'string';
  if (editing) {
    if (report.authorId !== user.id) {
      return Response.json({ ok: false, error: 'فقط نویسندهٔ گزارش می‌تواند متن آن را ویرایش کند.' }, { status: 403 });
    }
    if (typeof b.title === 'string') {
      const title = cleanText(b.title, LIMITS.title);
      if (title.length < 3) return Response.json({ ok: false, error: 'عنوان گزارش را بنویسید (حداقل ۳ نویسه).' }, { status: 400 });
      data.title = title;
    }
    if (typeof b.body === 'string') {
      const text = cleanText(b.body, LIMITS.body);
      if (!text) return Response.json({ ok: false, error: 'متن گزارش خالی است.' }, { status: 400 });
      data.body = text;
    }
    if (typeof b.category === 'string' && Object.keys(CATEGORIES).includes(b.category)) data.category = b.category;
    if (typeof b.targetId === 'string') {
      const { targetId, targetName } = await resolveTarget(b.targetId, user.id);
      data.targetId = targetId;
      data.targetName = targetName;
    }
  }

  if (Object.keys(data).length === 0) return Response.json({ ok: false, error: 'تغییری ارسال نشد.' }, { status: 400 });

  const updated = await prisma.staffReport.update({ where: { id }, data, include: withComments });
  await logAction(user, {
    action: 'staffReport.update',
    targetType: 'staffReport',
    targetId: id,
    summary: data.status ? `تغییر وضعیت گزارش «${report.title}» به ${data.status === 'done' ? 'انجام‌شده' : 'باز'}` : `ویرایش گزارش «${report.title}»`,
  });

  return Response.json({ ok: true, report: serializeReport(updated, user) });
}

// افزودن پاسخ به یک گزارش (همهٔ مدیران می‌توانند پاسخ بدهند — همین حلقهٔ گزارش‌دادن به هم است).
export async function POST(request, { params }) {
  const { user, error } = await guard();
  if (error) return error;
  const { id } = await params;

  const rateKey = `staffComment:${user.id}`;
  if (isLocked(rateKey, { max: 60 })) {
    return Response.json({ ok: false, error: 'تعداد پاسخ در چند دقیقهٔ اخیر زیاد بود. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }
  const text = cleanText(b.body, LIMITS.comment);
  if (!text) return Response.json({ ok: false, error: 'متن پاسخ خالی است.' }, { status: 400 });

  const report = await prisma.staffReport.findUnique({ where: { id }, select: { id: true, title: true, authorId: true, targetId: true } });
  if (!report) return Response.json({ ok: false, error: 'گزارش پیدا نشد.' }, { status: 404 });

  recordFailure(rateKey, { max: 60 });
  const name = displayNameOf(user);
  await prisma.staffReportComment.create({
    data: { reportId: id, authorId: user.id, authorName: name, authorRole: user.role, body: text },
  });

  // نویسندهٔ گزارش و گیرندهٔ آن (هرکدام که خودش پاسخ نداده) باید بدانند گفت‌وگو ادامه پیدا کرده است.
  const listeners = [report.authorId, report.targetId].filter((uid) => uid && uid !== user.id);
  if (listeners.length > 0) {
    await notifyUsers(listeners, {
      title: `${name} به گزارش پاسخ داد`,
      body: report.title,
      href: '/dashboard/admin/reports',
      kind: 'system',
    });
  }

  const updated = await prisma.staffReport.findUnique({ where: { id }, include: withComments });
  return Response.json({ ok: true, report: serializeReport(updated, user) });
}

// حذف گزارش: نویسنده یا ادمین. حذف یک پاسخ با ?comment=<شناسه> انجام می‌شود (نویسندهٔ پاسخ یا ادمین).
export async function DELETE(request, { params }) {
  const { user, error } = await guard();
  if (error) return error;
  const { id } = await params;
  const commentId = new URL(request.url).searchParams.get('comment');

  if (commentId) {
    const comment = await prisma.staffReportComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.reportId !== id) return Response.json({ ok: false, error: 'پاسخ پیدا نشد.' }, { status: 404 });
    if (comment.authorId !== user.id && user.role !== 'admin') {
      return Response.json({ ok: false, error: 'فقط نویسندهٔ پاسخ یا مدیر می‌تواند آن را حذف کند.' }, { status: 403 });
    }
    await prisma.staffReportComment.delete({ where: { id: commentId } });
    const updated = await prisma.staffReport.findUnique({ where: { id }, include: withComments });
    return Response.json({ ok: true, report: updated ? serializeReport(updated, user) : null });
  }

  const report = await prisma.staffReport.findUnique({ where: { id }, select: { id: true, title: true, authorId: true } });
  if (!report) return Response.json({ ok: false, error: 'گزارش پیدا نشد.' }, { status: 404 });
  if (report.authorId !== user.id && user.role !== 'admin') {
    return Response.json({ ok: false, error: 'فقط نویسندهٔ گزارش یا مدیر می‌تواند آن را حذف کند.' }, { status: 403 });
  }

  await prisma.staffReport.delete({ where: { id } });
  await logAction(user, { action: 'staffReport.delete', targetType: 'staffReport', targetId: id, summary: `حذف گزارش کار «${report.title}»` });
  return Response.json({ ok: true });
}
