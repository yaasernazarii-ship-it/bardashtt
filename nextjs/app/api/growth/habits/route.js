import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanEnum, cleanPositiveInt, cleanDate } from '@/lib/growthApi';
import { HABIT_FREQUENCY_TYPES } from '@/lib/growthConfig';
import { getHabitStats, tehranDateKey } from '@/lib/growth';

function normalizeFrequencyConfig(frequencyType, input) {
  const cfg = input && typeof input === 'object' ? input : {};
  if (frequencyType === 'weekly_days') {
    const days = Array.isArray(cfg.days)
      ? [...new Set(cfg.days.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))]
      : [];
    return { valid: days.length > 0, config: { days } };
  }
  if (frequencyType === 'weekly_count' || frequencyType === 'monthly_count') {
    const count = cleanPositiveInt(cfg.count, 0);
    return { valid: count > 0, config: { count } };
  }
  return { valid: true, config: {} }; // daily
}

function serializeBase(h) {
  return {
    id: h.id, title: h.title, description: h.description,
    frequencyType: h.frequencyType, frequencyConfig: h.frequencyConfig,
    startDate: h.startDate.toISOString(), active: h.active, goalId: h.goalId,
  };
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  const { searchParams } = new URL(request.url);
  const where = { userId: user.id };
  if (searchParams.get('active') === '1') where.active = true;

  const habits = await prisma.habit.findMany({ where, orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] });
  if (!habits.length) return ok({ habits: [] });

  // یک Query برای همهٔ Logها به‌جای یک Query جداگانه برای هر Habit (جلوگیری از N+1)
  const logs = await prisma.habitLog.findMany({
    where: { habitId: { in: habits.map((h) => h.id) } },
    select: { habitId: true, logDate: true },
  });
  const logsByHabit = {};
  for (const l of logs) (logsByHabit[l.habitId] ||= []).push(l);

  const todayKey = tehranDateKey(new Date());
  const result = habits.map((h) => ({
    ...serializeBase(h),
    stats: {
      ...getHabitStats(h, logsByHabit[h.id] || []),
      todayLogged: (logsByHabit[h.id] || []).some((log) => log.logDate === todayKey),
      recentActivity: (logsByHabit[h.id] || []).reduce((map, log) => ({ ...map, [log.logDate]: (map[log.logDate] || 0) + 1 }), {}),
    },
  }));
  return ok({ habits: result });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const title = cleanTitle(b.title);
  if (!title) return fail('عنوان عادت الزامی است.', 400);

  const frequencyType = cleanEnum(b.frequencyType, HABIT_FREQUENCY_TYPES, null);
  if (!frequencyType) return fail('نوع تکرار نامعتبر است.', 400);

  const { valid, config } = normalizeFrequencyConfig(frequencyType, b.frequencyConfig);
  if (!valid) return fail('تنظیمات تکرار عادت نامعتبر است.', 400);

  let goalId = null;
  if (b.goalId) {
    const goal = await prisma.growthGoal.findFirst({ where: { id: b.goalId, userId: user.id } });
    if (!goal) return fail('هدف انتخاب‌شده یافت نشد.', 404);
    goalId = goal.id;
  }

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      goalId,
      title,
      description: cleanText(b.description),
      frequencyType,
      frequencyConfig: config,
      startDate: cleanDate(b.startDate) || new Date(),
    },
  });
  return ok({ habit: { ...serializeBase(habit), stats: getHabitStats(habit, []) } }, 201);
}
