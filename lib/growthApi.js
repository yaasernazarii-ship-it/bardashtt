// کمک‌تابع‌های مشترکِ Route Handlerهای ماژول Growth: قالب پاسخ استاندارد + اعتبارسنجی ورودی‌های خام.
// عمداً جدا از lib/growth.js (که فقط منطق محاسباتی خالص/Prisma دارد) تا دو دغدغه به‌هم آمیخته نشوند.

export function ok(data, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function fail(error, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export function cleanTitle(input, max = 200) {
  return String(input || '').trim().slice(0, max);
}

export function cleanText(input, max = 5000) {
  if (input === undefined || input === null) return null;
  const t = String(input).trim().slice(0, max);
  return t || null;
}

export function cleanEnum(input, allowed, fallback) {
  return allowed.includes(input) ? input : fallback;
}

// ورودیِ 0 تا 100؛ اگر خالی/نامعتبر بود fallback برگردانده می‌شود (برای فیلدهای اختیاری مثل manualProgress).
export function cleanPercent(input, fallback = null) {
  if (input === undefined || input === null || input === '') return fallback;
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// مثل cleanPercent ولی null معتبر است (fallback فقط برای undefined/NaN)؛ برای score که باید همیشه عدد باشد از این استفاده نکنید.
export function requiredScore(input) {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
}

export function cleanDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function cleanPositiveInt(input, fallback = 1) {
  const n = parseInt(input, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function cleanPagination(searchParams, { defaultPageSize = 20, maxPageSize = 100 } = {}) {
  const page = Math.max(1, cleanPositiveInt(searchParams.get('page'), 1));
  const pageSize = Math.min(maxPageSize, Math.max(1, cleanPositiveInt(searchParams.get('pageSize'), defaultPageSize)));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
