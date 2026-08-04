// ساخت اسلاگ از عنوان (فارسی و انگلیسی). فاصله‌ها به - و کاراکترهای ناامن حذف می‌شوند.
export function slugify(input) {
  const base = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || 'post';
}

// مقدارِ پارامترهای مسیرِ پویا (مثل [slug]) به‌صورت percent-encoded می‌رسد.
// چون slugهای بالا فارسی ساخته می‌شوند، بدون decode هیچ‌وقت با مقدارِ ذخیره‌شده در دیتابیس
// برابر نمی‌شوند و صفحهٔ جزئیات ۴۰۴ می‌دهد. برای slugهای انگلیسی این تبدیل بی‌اثر است.
// آدرسِ خراب (مثل «%») باعث پرتاب URIError می‌شود؛ در آن حالت همان مقدار خام برمی‌گردد تا صفحه ۵۰۰ نشود.
export function decodeSlug(slug) {
  if (typeof slug !== 'string') return '';
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
