import { headers } from 'next/headers';

// دو دامنهٔ رسمی و URL کانونیِ هرکدام. حتی اگر کاربر از نسخهٔ بدون www وارد شده باشد،
// خروجی همیشه نسخهٔ با www است (هم‌راستا با ریدایرکت apex→www موجودِ nginx برای `.com`،
// و به‌عنوان نسخهٔ ترجیحیِ یکتا برای `.ir` تا از دوگانگیِ apex/www در تگ‌های سئو جلوگیری شود؛
// خودِ nginx برای `.ir` ریدایرکتی بین apex و www نمی‌زند، فقط تگ canonical یکی را ترجیح می‌دهد).
const IR_HOSTS = new Set(['bardashtt.ir', 'www.bardashtt.ir']);
const COM_URL = 'https://www.bardashtt.com';
const IR_URL = 'https://www.bardashtt.ir';

// دامنهٔ کانونیِ درخواستِ جاری را از هدر Host تشخیص می‌دهد (nginx همان Host مرورگر را عبور می‌دهد).
// فقط برای ساختِ URLهای مطلقِ سئو (canonical/OG/Schema/Sitemap/robots) استفاده می‌شود؛
// لینک‌های داخلیِ سایت نسبی‌اند و به این تابع نیازی ندارند.
export async function siteUrl() {
  const h = await headers();
  const host = (h.get('host') || '').split(':')[0].toLowerCase();
  return IR_HOSTS.has(host) ? IR_URL : COM_URL;
}
