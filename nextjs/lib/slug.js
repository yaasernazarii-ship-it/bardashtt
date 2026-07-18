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
