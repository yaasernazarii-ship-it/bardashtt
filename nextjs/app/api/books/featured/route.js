import { liveBooks } from '@/lib/books';
import { loadContent } from '@/lib/siteContent';

export const dynamic = 'force-dynamic';

const OFF = ['خاموش', 'غیرفعال', 'off', '0', 'false', 'نه'];

// اولین پاراگرافِ واقعیِ معرفی کتاب برای پنجرهٔ کوچک؛ تیتر و نشانه‌های مارک‌داون کنار گذاشته می‌شوند.
function shortSummary(description) {
  const first = String(description || '')
    .split(/\n{2,}/)
    .map((s) => s.replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim())
    .find((s) => s.length >= 40) || '';
  return first.length > 200 ? `${first.slice(0, 200).trimEnd()}…` : first;
}

// کتابِ پیشنهادی + متن‌های پنجرهٔ خوش‌آمد. عمومی است و فقط دادهٔ نمایشی برمی‌گرداند.
export async function GET() {
  const t = await loadContent();
  if (OFF.includes(String(t('bookPromo.enabled')).trim().toLowerCase())) {
    return Response.json({ ok: true, promo: null });
  }

  const books = await liveBooks();
  const book = books[0];
  if (!book) return Response.json({ ok: true, promo: null });

  const delay = Number(String(t('bookPromo.delay')).replace(/[^\d]/g, '')) || 4;
  const repeatDays = Number(String(t('bookPromo.repeatDays')).replace(/[^\d]/g, '')) || 7;

  return Response.json({
    ok: true,
    promo: {
      badge: t('bookPromo.badge'),
      heading: t('bookPromo.heading'),
      text: t('bookPromo.text'),
      cta: t('bookPromo.cta'),
      dismiss: t('bookPromo.dismiss'),
      delaySeconds: Math.min(Math.max(delay, 0), 60),
      repeatDays: Math.min(Math.max(repeatDays, 0), 365),
      book: {
        title: book.title,
        author: book.author,
        price: book.price,
        coverImage: book.coverImage,
        summary: shortSummary(book.description),
      },
    },
  });
}
