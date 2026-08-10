import { loadContent } from '@/lib/siteContent';
import { SEO_PAGE_BY_KEY, SITE_URL } from '@/lib/seoFields';

// ساخت متادیتای صفحه از روی مقادیر ذخیره‌شده در پنل، با fallback به پیش‌فرض‌ها.
// در هر صفحه به‌جای «export const metadata» از این تابع داخل generateMetadata استفاده می‌شود
// تا مدیر بتواند عنوان و توضیح گوگل را بدون تغییر کد عوض کند.
//
// نکته: canonical همیشه نسخهٔ www است تا با ریدایرکت ۳۰۱ سرور هم‌راستا بماند.
export async function pageMetadata(pageKey, extra = {}) {
  const page = SEO_PAGE_BY_KEY.get(pageKey);
  if (!page) return extra;

  const t = await loadContent();
  const title = (t(`seo.${pageKey}.title`) || page.title).trim();
  const description = (t(`seo.${pageKey}.description`) || page.description).trim();
  const image = (t(`seo.${pageKey}.image`) || '').trim();
  // هر مقداری جز «خیر»/«نه»/«خاموش» یعنی صفحه در گوگل نمایش داده شود.
  const indexRaw = (t(`seo.${pageKey}.index`) || '').trim();
  const allowIndex = !['خیر', 'نه', 'خاموش', 'no', 'false'].includes(indexRaw.toLowerCase());
  const url = `${SITE_URL}${page.path}`;
  const ogImage = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : undefined;

  return {
    title,
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
