import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum, cleanPercent, cleanDate } from '@/lib/growthApi';
import { GOAL_PRIORITIES, GOAL_STATUSES } from '@/lib/growthConfig';
import { recalculateGoalProgress } from '@/lib/growth';

function serialize(g) {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    startDate: g.startDate ? g.startDate.toISOString() : null,
    endDate: g.endDate ? g.endDate.toISOString() : null,
    priority: g.priority,
    status: g.status,
    progress: g.progress,
    manualProgress: g.manualProgress,
    courseId: g.courseId,
    milestones: (g.milestones || []).map((m) => ({
      id: m.id, title: m.title, description: m.description,
      dueDate: m.dueDate ? m.dueDate.toISOString() : null,
      status: m.status, progress: m.progress, order: m.order,
    })),
    tasks: (g.tasks || []).map((t) => ({
      id: t.id, title: t.title, status: t.status, dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    })),
    habits: (g.habits || []).map((h) => ({ id: h.id, title: h.title, active: h.active })),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const goal = await prisma.growthGoal.findFirst({
    where: { id, userId: user.id },
    include: {
      milestones: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
      habits: true,
    },
  });
  if (!goal) return fail('هدف یافت نشد.', 404);
  return ok({ goal: serialize(goal) });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.growthGoal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('هدف یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const data = {};
  if ('title' in b) {
    const title = cleanTitle(b.title);
    if (!title) return fail('عنوان هدف نمی‌تواند خالی باشد.', 400);
    data.title = title;
  }
  if ('description' in b) data.description = cleanText(b.description);
  if ('startDate' in b) data.startDate = cleanDate(b.startDate);
  if ('endDate' in b) data.endDate = cleanDate(b.endDate);
  if ('priority' in b) data.priority = cleanEnum(b.priority, GOAL_PRIORITIES, existing.priority);
  if ('status' in b) data.status = cleanEnum(b.status, GOAL_STATUSES, existing.status);
  if ('manualProgress' in b) data.manualProgress = cleanPercent(b.manualProgress, null);
  if ('courseId' in b) data.courseId = b.courseId ? String(b.courseId).trim().slice(0, 100) : null;

  await prisma.growthGoal.update({ where: { id }, data });
  await recalculateGoalProgress(id); // manualProgress یا وضعیت ممکن است progress کش‌شده را تغییر دهد

  const goal = await prisma.growthGoal.findUnique({
    where: { id },
    include: { milestones: { orderBy: { order: 'asc' } }, tasks: true, habits: true },
  });
  return ok({ goal: serialize(goal) });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.growthGoal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('هدف یافت نشد.', 404);

  await prisma.growthGoal.delete({ where: { id } }); // Cascade: Milestoneها هم حذف می‌شوند؛ Task/Habit فقط goalId=null می‌گیرند
  return ok({ deleted: true });
}
