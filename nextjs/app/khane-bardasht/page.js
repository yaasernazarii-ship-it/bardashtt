import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { siteUrl } from '@/lib/siteUrl';

export async function generateMetadata() {
  const site = await siteUrl();
  const title = 'خانه برداشت چیست؟';
  const description = 'خانه برداشت یا خانواده برداشت، مجموعه‌ای آموزشی در حوزه بازیگری سینما و فیلم‌سازی با شعبه‌های تهران و مازندران است.';
  return { title, description, alternates: { canonical: `${site}/khane-bardasht` }, openGraph: { title, description, url: `${site}/khane-bardasht` } };
}

export default async function KhaneBardashtPage() {
  const site = await siteUrl();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: { '@id': `${site}/#organization` },
    name: 'خانه برداشت چیست؟',
    url: `${site}/khane-bardasht`,
    inLanguage: 'fa-IR',
  };
  return (
    <SimplePage title="خانه برداشت چیست؟" subtitle="معرفی رسمی مجموعه، فعالیت‌ها و راه‌های دسترسی" tag="معرفی مجموعه" narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      <article className="stack-card" style={{ lineHeight: 2.1 }}>
        <h2>خانه برداشت؛ آموزش بازیگری و تجربهٔ عملی سینما</h2>
        <p>خانه برداشت، که با نام «خانواده برداشت» نیز شناخته می‌شود، مجموعه‌ای آموزشی در حوزهٔ بازیگری سینما و فیلم‌سازی است. این مجموعه از سال ۱۳۹۷ فعالیت می‌کند و مسیر آموزش خود را برای کودکان، نوجوانان و بزرگسالان طراحی کرده است.</p>
        <p>فعالیت‌های خانه برداشت شامل دوره‌های بازیگری، آموزش فیلم‌سازی، تمرین و تجربهٔ عملی تولید، انتشار محتوای آموزشی، معرفی آثار و استعلام گواهی‌نامهٔ پایان دوره است.</p>
        <h3>نام مجموعه</h3>
        <p>«خانواده برداشت» نام برند عمومی مجموعه است. آموزشگاه آزاد سینمایی «تک برداشت» عنوان آموزشی مجموعه است که در بخش معرفی و مجوزهای سایت توضیح داده شده است.</p>
        <h3>شعبه‌ها</h3>
        <ul><li><strong>تهران:</strong> میدان فاطمی</li><li><strong>مازندران:</strong> ساری، بلوار طالقانی، روبه‌روی شهابی، طالقانی ۱۰، خانهٔ برداشت</li></ul>
        <h3>صفحه‌های مرتبط</h3>
        <p><Link href="/about">دربارهٔ ما</Link> · <Link href="/courses">دوره‌های بازیگری</Link> · <Link href="/projects">پروژه‌ها و آثار</Link> · <Link href="/yaser-nazari">یاسر نظری</Link></p>
      </article>
    </SimplePage>
  );
}
