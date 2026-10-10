import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { siteUrl } from '@/lib/siteUrl';

export async function generateMetadata() {
  const site = await siteUrl();
  const title = 'پروژه‌ها و آثار خانه برداشت';
  const description = 'فهرست مسیرهای رسمی برای مشاهدهٔ آثار، تولیدات تبلیغاتی، خبرها و خروجی‌های خانه برداشت.';
  return { title, description, alternates: { canonical: `${site}/projects` }, openGraph: { title, description, url: `${site}/projects` } };
}

export default async function ProjectsPage() {
  const site = await siteUrl();
  const data = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'پروژه‌ها و آثار خانه برداشت', url: `${site}/projects`, inLanguage: 'fa-IR', about: { '@id': `${site}/#organization` } };
  return (
    <SimplePage title="پروژه‌ها و آثار خانه برداشت" subtitle="مسیرهای رسمی مشاهدهٔ تولیدات، خروجی‌ها و اخبار مجموعه" tag="آثار و تولیدات" narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      <article className="stack-card" style={{ lineHeight: 2.1 }}>
        <h2>آثار و تجربه‌های عملی خانه برداشت</h2>
        <p>خانه برداشت در کنار آموزش بازیگری، تجربهٔ عملی و معرفی خروجی‌های هنرجویان و تیم تولید را دنبال می‌کند. صفحه‌های زیر مرجع رسمی انتشار آثار و اطلاعات پروژه‌ها در سایت هستند.</p>
        <ul>
          <li><Link href="/works/output">خروجی‌های خانواده برداشت</Link> — تمرین‌ها و آثار هنرجویان</li>
          <li><Link href="/works/advertising">تولیدات تبلیغاتی</Link> — پروژه‌های ویدیویی و تبلیغاتی</li>
          <li><Link href="/works/resume">پشتوانهٔ علمی و هنری</Link> — رزومه و سوابق مجموعه</li>
          <li><Link href="/news">اخبار</Link> — خبرهای پروژه‌ها و فعالیت‌ها</li>
          <li><Link href="/gallery">گالری</Link> — تصاویر کلاس‌ها و رویدادها</li>
        </ul>
        <p>هر اثر یا پروژه‌ای که صفحهٔ جزئیات عمومی داشته باشد، باید عنوان، نوع اثر، نقش مجموعه، تاریخ انتشار و منبع رسانه‌ای خود را در همان صفحه نشان دهد تا قابل استناد باشد.</p>
      </article>
    </SimplePage>
  );
}
