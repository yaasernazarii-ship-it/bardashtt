import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanPercent, cleanDate } from '@/lib/growthApi';
import { recalculateGoalProgress } from '@/lib/growth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id: goalId } = await params;

  const goal = await prisma.growthGoal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return fail('هدف یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const title = cleanTitle(b.title);
  if (!title) return fail('عنوان گام الزامی است.', 400);

  const count = await prisma.goalMilestone.count({ where: { goalId } });
  const milestone = await prisma.goalMilestone.create({
    data: {
      goalId,
      title,
      description: cleanText(b.description),
      dueDate: cleanDate(b.dueDate),
      progress: cleanPercent(b.progress, 0),
      order: count,
    },
  });

  await recalculateGoalProgress(goalId);

  return ok({
    milestone: {
      id: milestone.id, title: milestone.title, description: milestone.description,
      dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null,
      status: milestone.status, progress: milestone.progress, order: milestone.order,
    },
  }, 201);
}
