// توابع مرکزی ماژول «مسیر رشد»: تاریخ تهران، Streak/Adherence عادت‌ها، پیشرفت هدف، Activity Score و وضعیت توجه.
// یک Utility مشابه (تبدیل timezone/تاریخ ایرانی) قبلاً در پروژه پیدا نشد؛ بنابراین از صفر و فقط با Intl ساخته شده.
import { prisma } from './prisma';
import { GROWTH_CONFIG } from './growthConfig';

// ===================== تاریخ تهران =====================

// کلید روزِ تقویمی به وقت Asia/Tehran، فرمت YYYY-MM-DD.
// این تنها منبع صحتِ «امروز چه روزی است» برای کل ماژول Growth است — هرگز از setHours/Date خام استفاده نشود.
export function tehranDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: GROWTH_CONFIG.timezone }).format(date);
}

// شمارهٔ روز هفته (0=یکشنبه ... 6=شنبه، مطابق استاندارد Date.getDay) برای تاریخ تهرانِ یک لحظه.
// چون شمارهٔ روز هفته فقط به خودِ تاریخ (نه ساعت) وابسته است، بعد از استخراج Y-M-D تهران با Date.UTC محاسبه می‌شود.
export function tehranWeekday(date = new Date()) {
  return weekdayFromKey(tehranDateKey(date));
}

function partsFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

function utcDateFromKey(key) {
  const { y, m, d } = partsFromKey(key);
  return new Date(Date.UTC(y, m - 1, d));
}

function keyFromUtcDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekdayFromKey(key) {
  return utcDateFromKey(key).getUTCDay();
}

function addDaysToKey(key, days) {
  const d = utcDateFromKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return keyFromUtcDate(d);
}

// تعداد روز از keyB تا keyA (مثبت یعنی keyA بعد از keyB است)
function daysBetweenKeys(keyA, keyB) {
  return Math.round((utcDateFromKey(keyA).getTime() - utcDateFromKey(keyB).getTime()) / 86400000);
}

function monthKeyFromDateKey(key) {
  return key.slice(0, 7); // YYYY-MM
}

// شنبهٔ همان هفته (یا قبل از آن) برای یک کلید روز — مبنای گروه‌بندی weekly_count
function weekStartKey(key) {
  const wd = weekdayFromKey(key); // 0=یکشنبه..6=شنبه
  const diffFromSaturday = (wd - 6 + 7) % 7;
  return addDaysToKey(key, -diffFromSaturday);
}

function clamp01to100(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

// ===================== Habit: تنظیمات تکرار =====================

function habitFrequency(habit) {
  const cfg = habit.frequencyConfig && typeof habit.frequencyConfig === 'object' ? habit.frequencyConfig : {};
  const days = Array.isArray(cfg.days)
    ? [...new Set(cfg.days.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))]
    : [];
  const count = Number.isInteger(cfg.count) && cfg.count > 0 ? cfg.count : 1;
  return { days, count };
}

// آیا این روز برای Habit «روز هدف» است؟ فقط برای daily/weekly_days معنا دارد.
export function isHabitTargetDay(habit, dateKey) {
  if (habit.frequencyType === 'daily') return true;
  if (habit.frequencyType === 'weekly_days') return habitFrequency(habit).days.includes(weekdayFromKey(dateKey));
  return false; // weekly_count / monthly_count بر مبنای دوره‌اند، نه روز
}

function distinctLogDates(logs) {
  return new Set((logs || []).map((l) => l.logDate));
}

// ===================== Habit Adherence =====================

export function calculateHabitAdherence(habit, logs, referenceDate = new Date()) {
  const todayKey = tehranDateKey(referenceDate);
  const startKey = tehranDateKey(habit.startDate || habit.createdAt || referenceDate);
  if (daysBetweenKeys(todayKey, startKey) < 0) return 0; // هنوز شروع نشده

  const logDates = distinctLogDates(logs);

  if (habit.frequencyType === 'daily' || habit.frequencyType === 'weekly_days') {
    let expected = 0;
    let completed = 0;
    for (let key = startKey; daysBetweenKeys(todayKey, key) >= 0; key = addDaysToKey(key, 1)) {
      if (!isHabitTargetDay(habit, key)) continue;
      expected += 1;
      if (logDates.has(key)) completed += 1;
    }
    return expected > 0 ? clamp01to100(Math.round((completed / expected) * 100)) : 0;
  }

  const { count } = habitFrequency(habit);

  if (habit.frequencyType === 'weekly_count') {
    const units = [];
    let cursor = weekStartKey(startKey);
    const lastWeek = weekStartKey(todayKey);
    while (daysBetweenKeys(lastWeek, cursor) >= 0) {
      const weekEnd = addDaysToKey(cursor, 6);
      let inWeek = 0;
      for (const d of logDates) {
        if (daysBetweenKeys(d, cursor) >= 0 && daysBetweenKeys(weekEnd, d) >= 0) inWeek += 1;
      }
      units.push(Math.min(1, inWeek / count));
      cursor = addDaysToKey(cursor, 7);
    }
    if (!units.length) return 0;
    return clamp01to100(Math.round((units.reduce((a, b) => a + b, 0) / units.length) * 100));
  }

  if (habit.frequencyType === 'monthly_count') {
    const startMonth = monthKeyFromDateKey(startKey);
    const todayMonth = monthKeyFromDateKey(todayKey);
    const units = [];
    let [y, m] = startMonth.split('-').map(Number);
    const [ty, tm] = todayMonth.split('-').map(Number);
    while (y < ty || (y === ty && m <= tm)) {
      const mk = `${y}-${String(m).padStart(2, '0')}`;
      let inMonth = 0;
      for (const d of logDates) if (monthKeyFromDateKey(d) === mk) inMonth += 1;
      units.push(Math.min(1, inMonth / count));
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    if (!units.length) return 0;
    return clamp01to100(Math.round((units.reduce((a, b) => a + b, 0) / units.length) * 100));
  }

  return 0;
}

// ===================== Habit Streak =====================

// Streak جاری برای daily/weekly_days: از امروز به عقب حرکت می‌کند؛ روزهای غیرهدف نادیده گرفته می‌شوند؛
// امروزِ ثبت‌نشده Streak را نمی‌شکند (چون هنوز فرصت ثبت هست)، اما هر روزِ هدفِ گذشته که ثبت نشده Streak را می‌شکند.
function currentStreakByDay(habit, logDates, todayKey, startKey) {
  let streak = 0;
  let key = todayKey;
  while (daysBetweenKeys(key, startKey) >= 0) {
    if (isHabitTargetDay(habit, key)) {
      if (logDates.has(key)) {
        streak += 1;
      } else if (key === todayKey) {
        // امروز هنوز ثبت نشده: نادیده بگیر و ادامه بده، بدون شکستن Streak
      } else {
        break;
      }
    }
    key = addDaysToKey(key, -1);
  }
  return streak;
}

function bestStreakByDay(habit, logDates, todayKey, startKey) {
  let best = 0;
  let run = 0;
  for (let key = startKey; daysBetweenKeys(todayKey, key) >= 0; key = addDaysToKey(key, 1)) {
    if (!isHabitTargetDay(habit, key)) continue;
    if (logDates.has(key)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

// Streak دوره‌ای برای weekly_count/monthly_count: هر دورهٔ گذشته باید «کامل» شده باشد؛ دورهٔ جاری اگر ناتمام باشد Streak را نمی‌شکند.
function currentStreakByPeriod(periodKeysDesc, fulfilledSet) {
  let streak = 0;
  periodKeysDesc.forEach((key, i) => {
    const fulfilled = fulfilledSet.has(key);
    if (i === 0) {
      if (fulfilled) streak += 1;
      return;
    }
    if (streak === i && fulfilled) streak += 1;
  });
  return streak;
}

function bestStreakByPeriod(periodKeysAsc, fulfilledSet) {
  let best = 0;
  let run = 0;
  for (const key of periodKeysAsc) {
    if (fulfilledSet.has(key)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

function weeklyPeriods(habit, logDates, todayKey, startKey) {
  const { count } = habitFrequency(habit);
  const keysAsc = [];
  let cursor = weekStartKey(startKey);
  const lastWeek = weekStartKey(todayKey);
  const fulfilled = new Set();
  while (daysBetweenKeys(lastWeek, cursor) >= 0) {
    const weekEnd = addDaysToKey(cursor, 6);
    let inWeek = 0;
    for (const d of logDates) {
      if (daysBetweenKeys(d, cursor) >= 0 && daysBetweenKeys(weekEnd, d) >= 0) inWeek += 1;
    }
    if (inWeek >= count) fulfilled.add(cursor);
    keysAsc.push(cursor);
    cursor = addDaysToKey(cursor, 7);
  }
  return { keysAsc, keysDesc: [...keysAsc].reverse(), fulfilled };
}

function monthlyPeriods(habit, logDates, todayKey, startKey) {
  const { count } = habitFrequency(habit);
  const startMonth = monthKeyFromDateKey(startKey);
  const todayMonth = monthKeyFromDateKey(todayKey);
  let [y, m] = startMonth.split('-').map(Number);
  const [ty, tm] = todayMonth.split('-').map(Number);
  const keysAsc = [];
  const fulfilled = new Set();
  while (y < ty || (y === ty && m <= tm)) {
    const mk = `${y}-${String(m).padStart(2, '0')}`;
    let inMonth = 0;
    for (const d of logDates) if (monthKeyFromDateKey(d) === mk) inMonth += 1;
    if (inMonth >= count) fulfilled.add(mk);
    keysAsc.push(mk);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return { keysAsc, keysDesc: [...keysAsc].reverse(), fulfilled };
}

export function calculateCurrentStreak(habit, logs, referenceDate = new Date()) {
  const todayKey = tehranDateKey(referenceDate);
  const startKey = tehranDateKey(habit.startDate || habit.createdAt || referenceDate);
  if (daysBetweenKeys(todayKey, startKey) < 0) return 0;

  if (habit.frequencyType === 'daily' || habit.frequencyType === 'weekly_days') {
    return currentStreakByDay(habit, distinctLogDates(logs), todayKey, startKey);
  }
  if (habit.frequencyType === 'weekly_count') {
    const { keysDesc, fulfilled } = weeklyPeriods(habit, distinctLogDates(logs), todayKey, startKey);
    return currentStreakByPeriod(keysDesc, fulfilled);
  }
  if (habit.frequencyType === 'monthly_count') {
    const { keysDesc, fulfilled } = monthlyPeriods(habit, distinctLogDates(logs), todayKey, startKey);
    return currentStreakByPeriod(keysDesc, fulfilled);
  }
  return 0;
}

export function calculateBestStreak(habit, logs, referenceDate = new Date()) {
  const todayKey = tehranDateKey(referenceDate);
  const startKey = tehranDateKey(habit.startDate || habit.createdAt || referenceDate);
  if (daysBetweenKeys(todayKey, startKey) < 0) return 0;

  if (habit.frequencyType === 'daily' || habit.frequencyType === 'weekly_days') {
    return bestStreakByDay(habit, distinctLogDates(logs), todayKey, startKey);
  }
  if (habit.frequencyType === 'weekly_count') {
    const { keysAsc, fulfilled } = weeklyPeriods(habit, distinctLogDates(logs), todayKey, startKey);
    return bestStreakByPeriod(keysAsc, fulfilled);
  }
  if (habit.frequencyType === 'monthly_count') {
    const { keysAsc, fulfilled } = monthlyPeriods(habit, distinctLogDates(logs), todayKey, startKey);
    return bestStreakByPeriod(keysAsc, fulfilled);
  }
  return 0;
}

export function getHabitStats(habit, logs, referenceDate = new Date()) {
  return {
    adherence: calculateHabitAdherence(habit, logs, referenceDate),
    currentStreak: calculateCurrentStreak(habit, logs, referenceDate),
    bestStreak: calculateBestStreak(habit, logs, referenceDate),
    totalLogs: distinctLogDates(logs).size,
  };
}

// ===================== Goal Progress =====================

function clampProgress(n) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

// تابع خالص (بدون Prisma) — برای استفادهٔ مجدد در recalculateGoalProgress و هرجای دیگر که Goal همراه با milestones/tasks در دست است.
export function calculateGoalProgress(goal, { milestones, tasks } = {}) {
  const ms = milestones ?? goal.milestones ?? [];
  const ts = tasks ?? goal.tasks ?? [];

  if (ms.length) {
    const sum = ms.reduce((acc, m) => acc + (m.status === 'done' ? 100 : clampProgress(m.progress)), 0);
    return clampProgress(sum / ms.length);
  }
  if (goal.manualProgress !== null && goal.manualProgress !== undefined) {
    return clampProgress(goal.manualProgress);
  }
  if (ts.length) {
    const done = ts.filter((t) => t.status === 'done').length;
    return clampProgress((done / ts.length) * 100);
  }
  return 0;
}

// نسخهٔ Prisma-محور: مقدار کش‌شدهٔ GrowthGoal.progress را بازمحاسبه و در صورت تغییر ذخیره می‌کند.
// این تنها نقطهٔ نوشتنِ progress است؛ بعد از هر تغییر Milestone/Task باید همین تابع صدا زده شود.
export async function recalculateGoalProgress(goalId) {
  const goal = await prisma.growthGoal.findUnique({
    where: { id: goalId },
    include: { milestones: true, tasks: true },
  });
  if (!goal) return null;
  const progress = calculateGoalProgress(goal);
  if (progress !== goal.progress) {
    await prisma.growthGoal.update({ where: { id: goalId }, data: { progress } });
  }
  return progress;
}

// ===================== Activity Score (فقط داخلی — هرگز با عنوان «نمره عملکرد» در UI نمایش داده نشود) =====================

export function calculateTaskCompletionRate(tasks) {
  if (!tasks || !tasks.length) return 0;
  const done = tasks.filter((t) => t.status === 'done').length;
  return clamp01to100(Math.round((done / tasks.length) * 100));
}

export function calculateAssignmentCompletionRate(assignments) {
  if (!assignments || !assignments.length) return 0;
  const resolved = assignments.filter((a) => a.status === 'approved').length;
  return clamp01to100(Math.round((resolved / assignments.length) * 100));
}

export function calculateActivityScore({ habitAdherence = 0, taskCompletion = 0, assignmentScore = 0 }) {
  const { weights } = GROWTH_CONFIG;
  const score =
    clamp01to100(habitAdherence) * weights.habit +
    clamp01to100(taskCompletion) * weights.task +
    clamp01to100(assignmentScore) * weights.assignment;
  return clamp01to100(Math.round(score));
}

// ===================== Last Activity =====================

// آخرین فعالیت چند کاربر را یکجا (بدون N+1) برمی‌گرداند: userId -> Date | undefined
export async function getLastActivityMap(userIds) {
  const ids = [...new Set(userIds)].filter(Boolean);
  const map = {};
  if (!ids.length) return map;

  const [habitLogs, tasks, journals, submissions] = await Promise.all([
    prisma.habitLog.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _max: { loggedAt: true } }),
    prisma.growthTask.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _max: { updatedAt: true } }),
    prisma.journalEntry.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _max: { updatedAt: true } }),
    prisma.assignmentSubmission.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _max: { submittedAt: true } }),
  ]);

  const merge = (rows, field) => {
    for (const r of rows) {
      const d = r._max[field];
      if (!d) continue;
      if (!map[r.userId] || d > map[r.userId]) map[r.userId] = d;
    }
  };
  merge(habitLogs, 'loggedAt');
  merge(tasks, 'updatedAt');
  merge(journals, 'updatedAt');
  merge(submissions, 'submittedAt');
  return map;
}

export async function getLastActivity(userId) {
  const map = await getLastActivityMap([userId]);
  return map[userId] || null;
}

// ===================== Attention Status =====================

// نمای کلی فعالیت چند هنرجو یکجا (برای لیست مدیریتی) — بدون N+1: فقط چند Query تجمیعیِ batched،
// مستقل از تعداد هنرجوها. برای Activity Score از یک بازهٔ اخیر (پیش‌فرض ۷ روز) به‌عنوان تقریبِ سبک استفاده می‌شود؛
// محاسبهٔ دقیقِ Adherence هر Habit (با احترام به نوع تکرار) در صفحهٔ پروندهٔ تکی هنرجو انجام می‌شود، نه در لیست.
export async function getActivityOverviewMap(userIds, { days = 7 } = {}) {
  const ids = [...new Set(userIds)].filter(Boolean);
  const overview = {};
  if (!ids.length) return overview;

  const since = new Date(Date.now() - days * 86400000);
  const sinceKey = tehranDateKey(since);
  const now = new Date();

  const [
    lastActivityMap,
    activeHabits,
    recentLogs,
    recentTasksTotal,
    recentTasksDone,
    assignmentsTotal,
    assignmentsApproved,
    assignmentsOverdue,
  ] = await Promise.all([
    getLastActivityMap(ids),
    prisma.habit.groupBy({ by: ['userId'], where: { userId: { in: ids }, active: true }, _count: { _all: true } }),
    prisma.habitLog.groupBy({ by: ['userId'], where: { userId: { in: ids }, logDate: { gte: sinceKey } }, _count: { _all: true } }),
    prisma.growthTask.groupBy({ by: ['userId'], where: { userId: { in: ids }, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.growthTask.groupBy({ by: ['userId'], where: { userId: { in: ids }, createdAt: { gte: since }, status: 'done' }, _count: { _all: true } }),
    prisma.assignment.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
    prisma.assignment.groupBy({ by: ['userId'], where: { userId: { in: ids }, status: 'approved' }, _count: { _all: true } }),
    prisma.assignment.groupBy({ by: ['userId'], where: { userId: { in: ids }, dueDate: { lt: now }, status: { in: ['assigned', 'needs_revision'] } }, _count: { _all: true } }),
  ]);

  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.userId, r._count._all]));
  const habitsMap = toMap(activeHabits);
  const logsMap = toMap(recentLogs);
  const tasksTotalMap = toMap(recentTasksTotal);
  const tasksDoneMap = toMap(recentTasksDone);
  const asgTotalMap = toMap(assignmentsTotal);
  const asgApprovedMap = toMap(assignmentsApproved);
  const asgOverdueMap = toMap(assignmentsOverdue);

  for (const id of ids) {
    const activeHabitCount = habitsMap[id] || 0;
    const habitAdherence = activeHabitCount > 0
      ? clamp01to100(Math.round(((logsMap[id] || 0) / (activeHabitCount * days)) * 100))
      : 0;
    const taskCompletion = tasksTotalMap[id]
      ? clamp01to100(Math.round(((tasksDoneMap[id] || 0) / tasksTotalMap[id]) * 100))
      : 0;
    const assignmentScore = asgTotalMap[id]
      ? clamp01to100(Math.round(((asgApprovedMap[id] || 0) / asgTotalMap[id]) * 100))
      : 0;

    const activityScore = calculateActivityScore({ habitAdherence, taskCompletion, assignmentScore });
    const lastActivityAt = lastActivityMap[id] || null;
    const status = getAttentionStatus({ lastActivityAt, activityScore, overdueAssignments: asgOverdueMap[id] || 0 }, now);

    overview[id] = { activityScore, lastActivityAt, status };
  }

  return overview;
}

export function getAttentionStatus({ lastActivityAt, activityScore = 0, overdueAssignments = 0 }, now = new Date()) {
  const cfg = GROWTH_CONFIG;
  const daysSince = lastActivityAt
    ? Math.floor((now.getTime() - new Date(lastActivityAt).getTime()) / 86400000)
    : Infinity;

  if (daysSince >= cfg.inactiveAfterDays) return 'inactive';

  const needsAttention =
    activityScore < cfg.needsAttentionThreshold ||
    daysSince >= cfg.attentionAfterDays ||
    overdueAssignments >= cfg.attentionOverdueAssignments;

  return needsAttention ? 'needs_attention' : 'active';
}
