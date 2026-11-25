// مسیر آموزشیِ ثابتِ خانواده برداشت: ۵ دوره به‌ترتیب.
// شناسه‌ها با courseKey مدل Enrollment هم‌خوان‌اند (۰۱ تا ۰۵).
export const COURSE_PATH = [
  { key: '01', title: 'مقدماتی' },
  { key: '02', title: 'تکمیلی' },
  { key: '03', title: 'اردو' },
  { key: '04', title: 'پیشرفته' },
  { key: '05', title: 'فیلمسازی' },
];

export function courseByKey(key) {
  return COURSE_PATH.find((c) => c.key === key) || null;
}

// دورهٔ فعلیِ هنرجو به‌صورت عنوان ذخیره می‌شود؛ این تابع دورهٔ بعدیِ پیشنهادی را برمی‌گرداند.
export function nextCourseAfterTitle(currentTitle) {
  if (!currentTitle) return COURSE_PATH[0];
  const norm = String(currentTitle).replace('دوره', '').trim();
  const i = COURSE_PATH.findIndex((c) => norm.includes(c.title));
  if (i === -1) return COURSE_PATH[0];
  return COURSE_PATH[i + 1] || null;
}
