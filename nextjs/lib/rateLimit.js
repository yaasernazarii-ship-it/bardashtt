// محدودسازیِ ساده‌ی تلاش‌های ناموفق (حافظه‌ای، در سطح یک پردازش سرور).
// برای جلوگیری از حدس‌زدنِ خودکار رمز عبور یا کد پیامکی به‌کار می‌رود.
const buckets = new Map();

export function isLocked(key, { max = 5, windowMs = 5 * 60 * 1000 } = {}) {
  const rec = buckets.get(key);
  if (!rec || Date.now() > rec.resetAt) return false;
  return rec.count >= max;
}

export function recordFailure(key, { max = 5, windowMs = 5 * 60 * 1000 } = {}) {
  const rec = buckets.get(key);
  if (!rec || Date.now() > rec.resetAt) {
    buckets.set(key, { count: 1, resetAt: Date.now() + windowMs });
    return;
  }
  rec.count += 1;
}

export function clearAttempts(key) {
  buckets.delete(key);
}
