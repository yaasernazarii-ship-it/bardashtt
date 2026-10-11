// فهرست بخش‌های مقصد برای محتوای زمان‌بندی‌شده.
// این فایل هیچ وابستگی سروری (prisma) ندارد تا در کامپوننت‌های کلاینت هم قابل استفاده باشد.
export const SECTIONS = [
  { value: 'news', label: 'اخبار و مطالب', kind: 'article', path: '/news' },
  { value: 'blog', label: 'مجله برداشت', kind: 'article', path: '/blog' },
  { value: 'social-responsibility', label: 'مسئولیت اجتماعی ← آگاهی‌سازی', kind: 'article', path: '/social-responsibility' },
  { value: 'sr-podcast', label: 'مسئولیت اجتماعی ← پادکست', kind: 'article', path: '/social-responsibility' },
  { value: 'works-advertising', label: 'آثار ← تولیدات تبلیغاتی', kind: 'media', path: '/works/advertising' },
  { value: 'works-output', label: 'آثار ← خروجی خانواده برداشت', kind: 'media', path: '/works/output' },
  { value: 'works-resume', label: 'آثار ← پشتوانه علمی و هنری', kind: 'media', path: '/works/resume' },
  { value: 'gallery', label: 'گالری (عکس/ویدیو)', kind: 'media', path: '/gallery' },
  { value: 'course-video', label: 'ویدیوهای فروش دورهٔ آنلاین', kind: 'media', path: '/online-learning' },
];

export const SECTION_VALUES = SECTIONS.map((s) => s.value);

export function sectionLabel(value) {
  const s = SECTIONS.find((x) => x.value === value);
  return s ? s.label : value;
}
