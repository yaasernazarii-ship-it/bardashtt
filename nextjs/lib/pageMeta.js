import { loadContent } from '@/lib/siteContent';
import { SEO_PAGE_BY_KEY } from '@/lib/seoFields';
import { siteUrl } from '@/lib/siteUrl';

// ساخت متادیتای صفحه از روی مقادیر ذخیره‌شده در پنل، با fallback به پیش‌فرض‌ها.
// در هر صفحه به‌جای «export const metadata» از این تابع داخل generateMetadata استفاده می‌شود
// تا مدیر بتواند عنوان و توضیح گوگل را بدون تغییر کد عوض کند.
//
// نکته: canonical بر اساس دامنهٔ همان درخواست ساخته می‌شود (siteUrl()) — `.com` روی
// bardashtt.com و `.ir` روی bardashtt.ir، بدون ارجاع متقابل بین دو دامنه.
export async function pageMetadata(pageKey, extra = {}) {
  const page = SEO_PAGE_BY_KEY.get(pageKey);
  if (!page) return extra;

  const site = await siteUrl();
  const t = await loadContent();
  const title = (t(`seo.${pageKey}.title`) || page.title).trim();
  const description = (t(`seo.${pageKey}.description`) || page.description).trim();
  const image = (t(`seo.${pageKey}.image`) || '').trim();
  // هر مقداری جز «خیر»/«نه»/«خاموش» یعنی صفحه در گوگل نمایش داده شود.
  const indexRaw = (t(`seo.${pageKey}.index`) || '').trim();
  const allowIndex = !['خیر', 'نه', 'خاموش', 'no', 'false'].includes(indexRaw.toLowerCase());
  const url = `${site}${page.path}`;
  const ogImage = image
    ? (image.startsWith('http') ? image : `${site}${image}`)
    : `${site}/hero-cinema-bg.png`;
  const verificationTitle = site === 'https://bardashtt.ir.bardashtt.com';

  return {
    title: verificationTitle ? { absolute: '55990608' } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: 'خانواده برداشت',
      url,
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: allowIndex, follow: true },
    ...extra,
  };
}
