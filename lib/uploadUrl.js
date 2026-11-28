// آدرس فایل‌های آپلودشده همیشه از مسیر داخلیِ /media/ می‌آید (خروجی /api/upload).
// خروجی: رشتهٔ معتبر، یا null برای «بدون عکس»، یا false برای مقدار نامعتبر.
export function normalizeUploadUrl(value) {
  if (value === undefined || value === null) return null;
  const url = String(value).trim();
  if (!url) return null;
  if (!/^\/media\/[A-Za-z0-9._-]+$/.test(url)) return false;
  return url;
}

// تصویری که یا روی همین سایت آپلود شده (/media/…) یا نشانی کاملِ بیرونی است.
export function isImageUrl(value) {
  const url = String(value ?? '').trim();
  return /^\/media\/[A-Za-z0-9._-]+$/.test(url) || /^https?:\/\/.+/i.test(url);
}
