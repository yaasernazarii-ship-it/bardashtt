import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum, cleanPercent, cleanDate } from '@/lib/growthApi';
import { GOAL_PRIORITIES } from '@/lib/growthConfig';

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
    milestoneCount: g._count ? g._count.milestones : undefined,
    taskCount: g._count ? g._count.tasks : undefined,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  const goals = await prisma.growthGoal.findMany({
    where: { userId: user.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { milestones: true, tasks: true } } },
  });
  return ok({ goals: goals.map(serialize) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const title = cleanTitle(b.title);
  if (!title) return fail('عنوان هدف الزامی است.', 400);

  const goal = await prisma.growthGoal.create({
    data: {
      userId: user.id, // هرگز از body گرفته نمی‌شود
      title,
      description: cleanText(b.description),
      startDate: cleanDate(b.startDate),
      endDate: cleanDate(b.endDate),
      priority: cleanEnum(b.priority, GOAL_PRIORITIES, 'medium'),
      manualProgress: cleanPercent(b.manualProgress, null),
      courseId: b.courseId ? String(b.courseId).trim().slice(0, 100) : null,
    },
  });
  return ok({ goal: serialize(goal) }, 201);
}
