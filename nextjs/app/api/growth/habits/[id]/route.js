import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum } from '@/lib/growthApi';
import { HABIT_FREQUENCY_TYPES } from '@/lib/growthConfig';
import { getHabitStats } from '@/lib/growth';

function normalizeFrequencyConfig(frequencyType, input) {
  const cfg = input && typeof input === 'object' ? input : {};
  if (frequencyType === 'weekly_days') {
    const days = Array.isArray(cfg.days)
      ? [...new Set(cfg.days.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))]
      : [];
    return { valid: days.length > 0, config: { days } };
  }
  if (frequencyType === 'weekly_count' || frequencyType === 'monthly_count') {
    const count = parseInt(cfg.count, 10);
    return { valid: Number.isInteger(count) && count > 0, config: { count: Number.isInteger(count) && count > 0 ? count : 0 } };
  }
  return { valid: true, config: {} };
}

function serializeBase(h) {
  return {
    id: h.id, title: h.title, description: h.description,
    frequencyType: h.frequencyType, frequencyConfig: h.frequencyConfig,
    startDate: h.startDate.toISOString(), active: h.active, goalId: h.goalId,
  };
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('عادت یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const data = {};
  if ('title' in b) {
    const title = cleanTitle(b.title);
    if (!title) return fail('عنوان عادت نمی‌تواند خالی باشد.', 400);
    data.title = title;
  }
  if ('description' in b) data.description = cleanText(b.description);
  if ('active' in b) data.active = !!b.active;

  let frequencyType = existing.frequencyType;
  if ('frequencyType' in b) {
    frequencyType = cleanEnum(b.frequencyType, HABIT_FREQUENCY_TYPES, null);
    if (!frequencyType) return fail('نوع تکرار نامعتبر است.', 400);
    data.frequencyType = frequencyType;
  }
  if ('frequencyType' in b || 'frequencyConfig' in b) {
    const { valid, config } = normalizeFrequencyConfig(frequencyType, 'frequencyConfig' in b ? b.frequencyConfig : existing.frequencyConfig);
    if (!valid) return fail('تنظیمات تکرار عادت نامعتبر است.', 400);
    data.frequencyConfig = config;
  }

  if ('goalId' in b) {
    if (b.goalId) {
      const goal = await prisma.growthGoal.findFirst({ where: { id: b.goalId, userId: user.id } });
      if (!goal) return fail('هدف انتخاب‌شده یافت نشد.', 404);
      data.goalId = goal.id;
    } else {
      data.goalId = null;
    }
  }

  const habit = await prisma.habit.update({ where: { id }, data });
  const logs = await prisma.habitLog.findMany({ where: { habitId: id }, select: { habitId: true, logDate: true } });
  return ok({ habit: { ...serializeBase(habit), stats: getHabitStats(habit, logs) } });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('عادت یافت نشد.', 404);

  await prisma.habit.delete({ where: { id } });
  return ok({ deleted: true });
}
