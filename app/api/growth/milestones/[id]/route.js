import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum, cleanPercent, cleanDate } from '@/lib/growthApi';
import { recalculateGoalProgress } from '@/lib/growth';

const STATUSES = ['pending', 'in_progress', 'done'];

// مالکیت از طریق Goal بررسی می‌شود (Milestone خودش userId ندارد؛ به Goal متصل است)
async function findOwned(id, userId) {
  return prisma.goalMilestone.findFirst({ where: { id, goal: { userId } } });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await findOwned(id, user.id);
  if (!existing) return fail('گام یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const data = {};
  if ('title' in b) {
    const title = cleanTitle(b.title);
    if (!title) return fail('عنوان گام نمی‌تواند خالی باشد.', 400);
    data.title = title;
  }
  if ('description' in b) data.description = cleanText(b.description);
  if ('dueDate' in b) data.dueDate = cleanDate(b.dueDate);
  if ('status' in b) data.status = cleanEnum(b.status, STATUSES, existing.status);
  if ('progress' in b) data.progress = cleanPercent(b.progress, existing.progress);
  if (Number.isInteger(b.order)) data.order = b.order;

  const milestone = await prisma.goalMilestone.update({ where: { id }, data });
  await recalculateGoalProgress(existing.goalId);

  return ok({
    milestone: {
      id: milestone.id, title: milestone.title, description: milestone.description,
      dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null,
      status: milestone.status, progress: milestone.progress, order: milestone.order,
    },
  });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await findOwned(id, user.id);
  if (!existing) return fail('گام یافت نشد.', 404);

  await prisma.goalMilestone.delete({ where: { id } });
  await recalculateGoalProgress(existing.goalId);
  return ok({ deleted: true });
}
