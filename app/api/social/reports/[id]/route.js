import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';

// بستنِ یک گزارش تخلف («بررسی شد؛ مشکلی نداشت»). خودِ محتوا دست‌نخورده می‌ماند.
export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const report = await prisma.socialReport.findUnique({ where: { id }, select: { id: true, postId: true } });
  if (!report) return Response.json({ ok: false, error: 'گزارش یافت نشد.' }, { status: 404 });

  await prisma.socialReport.delete({ where: { id } });
  if (report.postId) {
    await prisma.socialPost.update({ where: { id: report.postId }, data: { reportCount: { decrement: 1 } } }).catch(() => {});
  }
  await logAction(user, {
    action: 'social.report.close',
    targetType: 'socialReport',
    targetId: id,
    summary: 'بستن گزارش تخلف در شبکهٔ اجتماعی',
  });

  return Response.json({ ok: true });
}
