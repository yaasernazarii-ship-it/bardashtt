import { aparatEmbedUrl } from '@/lib/aparat';

// از ورودیِ ویدیو یک نشانیِ امنِ src برای iframe استخراج می‌کند.
// ورودی می‌تواند سه شکل باشد:
//   ۱) کد کاملِ <iframe ... src="..."> (سرویس‌های محدودسازیِ دامنه مثل ویدپروتکت/نگاوید معمولاً این را می‌دهند)
//   ۲) لینکِ تماشای آپارات
//   ۳) نشانیِ مستقیمِ امبد (URL)
// فقط http(s) پذیرفته می‌شود تا از تزریقِ اسکیم‌های ناامن (javascript:, data:) جلوگیری شود.
export function embedSrc(input) {
  if (!input) return null;
  const s = String(input).trim();

  // اگر کد iframe کامل چسبانده شده باشد، مقدار src را دربیاور
  const m = s.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  let url = (m ? m[1] : s).trim();

  // لینک آپارات را به نشانیِ امبدِ استاندارد تبدیل کن
  const ap = aparatEmbedUrl(url);
  if (ap) return ap;

  if (url.startsWith('//')) url = 'https:' + url;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}
