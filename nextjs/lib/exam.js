// قواعد آزمون فارغ‌التحصیلی و گواهی‌نامهٔ آموزشگاه سینمایی تک برداشت.
// همهٔ اعداد و نام‌ها اینجا متمرکز است تا تغییرشان یک‌جا انجام شود.

export const SCHOOL_NAME = 'آموزشگاه سینمایی تک برداشت';

export const EXAM_QUESTION_COUNT = 100; // تعداد سوال هر آزمون
// مهلت هر سوال جداگانه است و مهلت کل آزمون از جمعِ همین‌ها ساخته می‌شود.
// چون بازگشت به سوال قبلی ممکن نیست، زمانِ استفاده‌نشدهٔ یک سوال به سوال بعدی منتقل نمی‌شود.
export const EXAM_SECONDS_PER_QUESTION = 60; // مهلت پاسخ به هر سوال، به ثانیه
export const EXAM_PASS_PERCENT = 70; // حد نصاب قبولی
export const OPTION_COUNT = 4;

export const SERIAL_PREFIX = 'TB'; // Tak Bardasht

// «آقای/خانم» روی گواهی؛ اگر جنسیت ثبت نشده باشد هیچ عنوانی درج نمی‌شود.
export function honorific(gender) {
  if (gender === 'male') return 'آقای';
  if (gender === 'female') return 'خانم';
  return '';
}

export function genderLabel(gender) {
  if (gender === 'male') return 'آقا';
  if (gender === 'female') return 'خانم';
  return '—';
}

export function isValidGender(value) {
  return value === 'male' || value === 'female';
}

// سال جاری هجری شمسی به عدد لاتین (برای ساخت شمارهٔ سریال گواهی).
export function jalaliYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
    year: 'numeric',
    timeZone: 'Asia/Tehran',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value || '';
  return parseInt(y.replace(/[^\d]/g, ''), 10) || 0;
}

export function buildSerial(year, seq) {
  return `${SERIAL_PREFIX}-${year}-${String(seq).padStart(4, '0')}`;
}

// نرمال‌سازی کد استعلامی که کاربر تایپ می‌کند: حروف بزرگ، بدون فاصله، با خط تیرهٔ استاندارد.
export function normalizeSerial(input) {
  return String(input || '')
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
    .replace(/[\u2010-\u2015_\s]+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .toUpperCase();
}

// انتخاب تصادفی n سوال (Fisher–Yates روی کپیِ آرایه).
export function pickRandom(items, n) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

// تصحیح: answers یک شیء { questionId: اندیس گزینه } است.
export function gradeAttempt(questions, answers) {
  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct) score += 1;
  }
  const total = questions.length;
  const percent = total ? Math.round((score / total) * 100) : 0;
  return { score, total, percent, passed: percent >= EXAM_PASS_PERCENT };
}

// گزینه‌ها همیشه باید آرایه‌ای از رشته باشند؛ ورودی ادمین ممکن است ناقص باشد.
export function normalizeOptions(input) {
  const arr = Array.isArray(input) ? input : [];
  const cleaned = arr.map((o) => String(o ?? '').trim()).filter(Boolean);
  return cleaned.length === OPTION_COUNT ? cleaned : null;
}
