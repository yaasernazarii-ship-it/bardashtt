import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { siteUrl } from '@/lib/siteUrl';

export async function generateMetadata() {
  const site = await siteUrl();
  const title = 'کتاب متد پنج سؤال طلایی';
  const description = 'معرفی کتاب متد پنج سؤال طلایی از یاسر نظری و ارتباط آن با رویکرد آموزشی خانه برداشت.';
  return { title, description, alternates: { canonical: `${site}/ketab-panj-soal` }, openGraph: { title, description, url: `${site}/ketab-panj-soal` } };
}

export default async function BookPage() {
  const site = await siteUrl();
  const data = { '@context': 'https://schema.org', '@type': 'Book', name: 'متد پنج سؤال طلایی', author: { '@type': 'Person', name: 'یاسر نظری', url: `${site}/yaser-nazari` }, inLanguage: 'fa-IR', url: `${site}/ketab-panj-soal`, publisher: { '@id': `${site}/#organization` }, description: 'کتابی از یاسر نظری دربارهٔ رویکرد متد پنج سؤال طلایی.' };
  return (
    <SimplePage title="کتاب متد پنج سؤال طلایی" subtitle="معرفی کتاب و ارتباط آن با رویکرد آموزشی خانه برداشت" tag="کتاب" narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      <article className="stack-card" style={{ lineHeight: 2.1 }}>
        <h2>کتاب متد پنج سؤال طلایی</h2>
        <p>کتاب «متد پنج سؤال طلایی» اثر یاسر نظری است. این کتاب با رویکرد آموزشی‌ای هم‌نام، در پیوند با تحلیل رفتار، شخصیت و مسیر یادگیری بازیگری معرفی می‌شود.</p>
        <p>برای دریافت اطلاعات به‌روز دربارهٔ تهیه، مشخصات نشر، نسخه‌ها یا محتوای تفصیلی کتاب، اطلاعاتی که در بخش عمومی سایت منتشر می‌شود مرجع خواهد بود.</p>
        <h3>پیوند با آموزش بازیگری</h3>
        <p>خانه برداشت این رویکرد را در کنار تمرین، تحلیل شخصیت و تجربهٔ عملی تولید به‌عنوان بخشی از مسیر آموزشی خود معرفی می‌کند.</p>
        <h3>صفحه‌های مرتبط</h3>
        <p><Link href="/metod-panj-soal">متد پنج سؤال طلایی چیست؟</Link> · <Link href="/yaser-nazari">یاسر نظری</Link> · <Link href="/courses">دوره‌های بازیگری</Link></p>
      </article>
    </SimplePage>
  );
}
