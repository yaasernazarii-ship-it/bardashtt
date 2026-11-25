import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum, cleanDate } from '@/lib/growthApi';
import { GOAL_PRIORITIES, TASK_STATUSES } from '@/lib/growthConfig';
import { recalculateGoalProgress } from '@/lib/growth';

function serialize(t) {
  return {
    id: t.id, title: t.title, description: t.description,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null, dueTime: t.dueTime,
    priority: t.priority, status: t.status, goalId: t.goalId,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
  };
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.growthTask.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('کار یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const data = {};
  if ('title' in b) {
    const title = cleanTitle(b.title);
    if (!title) return fail('عنوان کار نمی‌تواند خالی باشد.', 400);
    data.title = title;
  }
  if ('description' in b) data.description = cleanText(b.description);
  if ('dueDate' in b) data.dueDate = cleanDate(b.dueDate);
  if ('dueTime' in b) {
    data.dueTime = b.dueTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(b.dueTime)) ? String(b.dueTime) : null;
  }
  if ('priority' in b) data.priority = cleanEnum(b.priority, GOAL_PRIORITIES, existing.priority);
  if ('status' in b) {
    data.status = cleanEnum(b.status, TASK_STATUSES, existing.status);
    data.completedAt = data.status === 'done' ? new Date() : null;
  }

  let newGoalId = existing.goalId;
  if ('goalId' in b) {
    if (b.goalId) {
      const goal = await prisma.growthGoal.findFirst({ where: { id: b.goalId, userId: user.id } });
      if (!goal) return fail('هدف انتخاب‌شده یافت نشد.', 404);
      newGoalId = goal.id;
    } else {
      newGoalId = null;
    }
    data.goalId = newGoalId;
  }

  const task = await prisma.growthTask.update({ where: { id }, data });

  if (existing.goalId) await recalculateGoalProgress(existing.goalId);
  if (newGoalId && newGoalId !== existing.goalId) await recalculateGoalProgress(newGoalId);

  return ok({ task: serialize(task) });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.growthTask.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('کار یافت نشد.', 404);

  await prisma.growthTask.delete({ where: { id } });
  if (existing.goalId) await recalculateGoalProgress(existing.goalId);
  return ok({ deleted: true });
}
