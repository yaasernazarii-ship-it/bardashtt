// دسته‌های ثابت وبلاگ — هر دسته یک موضوع سئو است که هر هفته کلمات کلیدی جدید برایش می‌آید.
// این فایل هیچ وابستگی سروری (prisma) ندارد تا در کامپوننت‌های کلاینت هم قابل استفاده باشد.
export const BLOG_CATEGORIES = [
  { value: 'bazigari', label: 'بازیگری' },
  { value: 'amoozesh-bazigari', label: 'آموزش بازیگری' },
  { value: 'test-bazigari', label: 'تست بازیگری' },
  { value: 'kargardani', label: 'کارگردانی' },
  { value: 'filmnamenevisi', label: 'فیلمنامه‌نویسی' },
  { value: 'cinema', label: 'سینما' },
  { value: 'ravanshenasi', label: 'روان‌شناسی' },
  { value: 'khanevade', label: 'خانواده' },
  { value: 'etemad-be-nafs', label: 'اعتمادبه‌نفس' },
  { value: 'ezzat-nafs', label: 'عزت نفس' },
  { value: 'hoosh-hayejani', label: 'هوش هیجانی' },
  { value: 'koodak', label: 'کودک' },
  { value: 'nojavan', label: 'نوجوان' },
  { value: 'movaffaghiat', label: 'موفقیت' },
  { value: 'shakhsiat-shenasi', label: 'شخصیت‌شناسی' },
  { value: 'zaban-badan', label: 'زبان بدن' },
  { value: 'ertebat-moaser', label: 'ارتباط مؤثر' },
  { value: 'fan-bayan', label: 'فن بیان' },
  { value: 'tose-fardi', label: 'توسعه فردی' },
  { value: 'projehaye-farhangi', label: 'پروژه‌های فرهنگی' },
];

export const BLOG_CATEGORY_VALUES = BLOG_CATEGORIES.map((c) => c.value);

export function blogCategoryLabel(value) {
  const c = BLOG_CATEGORIES.find((x) => x.value === value);
  return c ? c.label : value;
}
