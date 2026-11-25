// داده‌های پایه فرایند ثبت‌نام (بدون وابستگی سمت سرور) — قابل استفاده در کلاینت و سرور.

export const COURSES = [
  { key: '01', title: 'مقدماتی', sub: 'شروع مسیر' },
  { key: '02', title: 'تکمیلی', sub: 'عمق مهارت' },
  { key: '03', title: 'اردو', sub: 'تجربه عملی' },
  { key: '04', title: 'پیشرفته', sub: 'حرفه‌ای شدن' },
  { key: '05', title: 'فیلمسازی', sub: 'زبان سینما' },
];

// ورود به مسیر آموزشی همیشه از دورهٔ مقدماتی است؛ هنرجو دوره را انتخاب نمی‌کند.
// دوره‌های بعدی را مدیریت پس از گذراندن مرحلهٔ قبل ثبت می‌کند.
export const ENROLL_COURSE_KEY = '01';

export function courseByKey(key) {
  return COURSES.find((c) => c.key === key) || null;
}

// سؤالات تست آنلاین. هر سؤال چند گزینه دارد.
export const QUESTIONS = [
  { q: 'وقتی متن جدیدی می‌خوانید، بیشتر به چه چیزی توجه می‌کنید؟', options: ['احساس شخصیت', 'ریتم و بیان کلام', 'تصویرسازی صحنه', 'کنش و حرکت'] },
  { q: 'در کار گروهی معمولاً چه نقشی دارید؟', options: ['هماهنگ‌کننده', 'ایده‌پرداز', 'اجراکننده', 'مشاهده‌گر دقیق'] },
  { q: 'بیشتر دوست دارید کدام نوع نقش را بازی کنید؟', options: ['درام جدی', 'کمدی', 'اکشن و حرکتی', 'نقش‌های پیچیده و چندلایه'] },
  { q: 'نقطه قوت اصلی شما کدام است؟', options: ['احساس و درون', 'بیان و صدا', 'بدن و حرکت', 'تمرکز و تحلیل'] },
  { q: 'هنگام آماده‌شدن برای یک نقش، ابتدا سراغ چه می‌روید؟', options: ['حس و خاطره شخصی', 'خواندن بلند متن', 'راه‌رفتن و بدن نقش', 'تحلیل موقعیت و هدف'] },
  { q: 'جلوی دوربین یا تماشاگر چه حسی دارید؟', options: ['هیجان درونی', 'تمرکز روی بیان', 'انرژی بدنی بالا', 'آرامش و کنترل'] },
];

export const ACTOR_TYPES = ['بازیگر احساسی', 'بازیگر بیانی', 'بازیگر فیزیکی', 'بازیگر تحلیلی'];

// فرم ارسال ویدیوی معرفی هنرجو (فرم‌افزار).
export const VIDEO_FORM_URL = 'https://formafzar.com/form/wo6jb';

// اعتبارسنجی کد ملی ایرانی (۱۰ رقم + رقم کنترلی). ورودی می‌تواند ارقام فارسی داشته باشد.
export function normalizeNationalId(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[^\d]/g, '');
}

export function isValidNationalId(value) {
  const code = normalizeNationalId(value);
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // رد ارقام یکسان
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(code[i]) * (10 - i);
  const r = sum % 11;
  const check = Number(code[9]);
  return r < 2 ? check === r : check === 11 - r;
}

// اعتبارسنجی پاسخ‌ها: آرایه‌ای از اندیس گزینه‌ها به طول سؤالات.
export function validateAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) return null;
  const out = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const a = Number(answers[i]);
    if (!Number.isInteger(a) || a < 0 || a >= QUESTIONS[i].options.length) return null;
    out.push(a);
  }
  return out;
}
