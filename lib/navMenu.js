// تبدیل متنِ چندخطیِ منو (که مدیر در پنل می‌نویسد) به ساختار درختیِ منو.
//
// قالب هر خط:
//   «نام | نشانی»        → یک آیتم ساده
//   «نام»                 → یک منوی کشویی (خط‌های «-» بعدی زیرمجموعهٔ آن می‌شوند)
//   «- نام | نشانی»       → زیرمجموعهٔ آخرین کشویی
//   «- ---»               → خط جداکننده داخل کشویی
//
// اگر متن خالی یا خراب باشد، آرایهٔ خالی برمی‌گردد و صفحه‌خوان بالادست از منوی
// پیش‌فرض استفاده می‌کند؛ پس یک اشتباه تایپی هرگز منو را ناپدید نمی‌کند.
export function parseMenu(raw) {
  const lines = String(raw ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const items = [];
  for (const line of lines) {
    const isChild = line.startsWith('-');
    const body = isChild ? line.slice(1).trim() : line;

    if (isChild) {
      const parent = items[items.length - 1];
      if (!parent || !parent.children) continue; // زیرمجموعه بدون والد نادیده گرفته می‌شود
      if (/^-{2,}$/.test(body)) {
        parent.children.push({ type: 'sep' });
        continue;
      }
      const [label, href] = splitPair(body);
      if (label && href) parent.children.push({ label, href });
      continue;
    }

    const [label, href] = splitPair(body);
    if (!label) continue;
    if (href) items.push({ label, href });
    else items.push({ label, children: [] });
  }

  // کشویی‌ای که هیچ زیرمجموعه‌ای نگرفته بی‌فایده است و حذف می‌شود.
  return items.filter((it) => !it.children || it.children.length > 0);
}

function splitPair(s) {
  const i = s.indexOf('|');
  if (i === -1) return [s.trim(), ''];
  return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
}
