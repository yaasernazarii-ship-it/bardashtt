// تنظیمات متمرکز ماژول «مسیر رشد». عمداً بدون وابستگی به Prisma یا هر ماژول سرور دیگر
// تا در کامپوننت‌های کلاینت هم (برای نمایش برچسب/آستانه) قابل import باشد.

export const GROWTH_CONFIG = {
  // وزن هر مؤلفه در محاسبهٔ داخلیِ Activity Score (هرگز به‌عنوان «نمره عملکرد» در UI نمایش داده نمی‌شود)
  weights: {
    habit: 0.4,
    task: 0.3,
    assignment: 0.3,
  },

  // اگر Activity Score زیر این آستانه باشد، یکی از شرط‌های needs_attention برقرار است
  needsAttentionThreshold: 40,

  // اگر آخرین فعالیت بیشتر از این تعداد روز قدیمی باشد → وضعیت inactive
  inactiveAfterDays: 14,

  // اگر آخرین فعالیت بیشتر از این تعداد روز قدیمی باشد → یکی از شرط‌های needs_attention
  attentionAfterDays: 4,

  // حداقل تعداد Assignment عقب‌افتاده (dueDate گذشته و هنوز submit/approve نشده) برای needs_attention
  attentionOverdueAssignments: 2,

  timezone: 'Asia/Tehran',
};

export const HABIT_FREQUENCY_TYPES = ['daily', 'weekly_days', 'weekly_count', 'monthly_count'];
export const GOAL_PRIORITIES = ['low', 'medium', 'high'];
export const GOAL_STATUSES = ['active', 'completed', 'archived'];
export const TASK_STATUSES = ['pending', 'done'];
export const ASSIGNMENT_STATUSES = ['assigned', 'submitted', 'approved', 'needs_revision'];
export const JOURNAL_VISIBILITIES = ['private', 'shared'];
