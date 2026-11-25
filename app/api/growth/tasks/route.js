import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum, cleanDate } from '@/lib/growthApi';
import { GOAL_PRIORITIES } from '@/lib/growthConfig';
import { recalculateGoalProgress } from '@/lib/growth';

function serialize(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    dueTime: t.dueTime,
    priority: t.priority,
    status: t.status,
    goalId: t.goalId,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  const { searchParams } = new URL(request.url);
  const where = { userId: user.id };
  if (searchParams.get('goalId')) where.goalId = searchParams.get('goalId');
  if (searchParams.get('status')) where.status = searchParams.get('status');
  if (searchParams.get('today') === '1') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    where.dueDate = { gte: start, lte: end };
  }

  const tasks = await prisma.growthTask.findMany({
    where,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  });
  return ok({ tasks: tasks.map(serialize) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const title = cleanTitle(b.title);
  if (!title) return fail('عنوان کار الزامی است.', 400);

  let goalId = null;
  if (b.goalId) {
    const goal = await prisma.growthGoal.findFirst({ where: { id: b.goalId, userId: user.id } });
    if (!goal) return fail('هدف انتخاب‌شده یافت نشد.', 404);
    goalId = goal.id;
  }

  const dueTime = b.dueTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(b.dueTime)) ? String(b.dueTime) : null;

  const task = await prisma.growthTask.create({
    data: {
      userId: user.id,
      goalId,
      title,
      description: cleanText(b.description),
      dueDate: cleanDate(b.dueDate),
      dueTime,
      priority: cleanEnum(b.priority, GOAL_PRIORITIES, 'medium'),
    },
  });

  if (goalId) await recalculateGoalProgress(goalId);
  return ok({ task: serialize(task) }, 201);
}
