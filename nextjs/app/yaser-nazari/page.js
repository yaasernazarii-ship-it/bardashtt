import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { siteUrl } from '@/lib/siteUrl';

export async function generateMetadata() {
  const site = await siteUrl();
  const title = 'یاسر نظری | کارگردان و بنیان‌گذار خانه برداشت';
  const description = 'معرفی یاسر نظری، کارگردان سینما، نویسنده و بنیان‌گذار آموزشگاه خانواده برداشت.';
  return { title, description, alternates: { canonical: `${site}/yaser-nazari` }, openGraph: { title, description, url: `${site}/yaser-nazari` } };
}

export default async function YaserNazariPage() {
  const site = await siteUrl();
  const data = {
    '@context': 'https://schema.org', '@type': 'Person', '@id': `${site}/yaser-nazari#person`,
    name: 'یاسر نظری', alternateName: 'Yaser Nazari', url: `${site}/yaser-nazari`,
    jobTitle: 'کارگردان سینما و بنیان‌گذار آموزشگاه خانواده برداشت',
    worksFor: { '@id': `${site}/#organization` },
    description: 'کارگردان سینما، نویسنده و بنیان‌گذار آموزشگاه خانواده برداشت.',
    image: `${site}/founder-yaser.jpg`, inLanguage: 'fa-IR',
  };
  return (
    <SimplePage title="یاسر نظری کیست؟" subtitle="کارگردان سینما، نویسنده و بنیان‌گذار خانه برداشت" tag="بنیان‌گذار" narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      <article className="stack-card" style={{ lineHeight: 2.1 }}>
        <h2>یاسر نظری</h2>
        <p>یاسر نظری کارگردان سینما، نویسنده و بنیان‌گذار آموزشگاه خانواده برداشت است. فعالیت او بر آموزش بازیگری، فیلم‌سازی، تحلیل رفتار و تجربهٔ عملی در فضای تولید سینما متمرکز است.</p>
        <p>در معرفی رسمی مجموعه، از بیش از ۸۰ پروژهٔ سینمایی، تلویزیونی و تبلیغاتی در کارنامهٔ او در نقش‌هایی مانند کارگردان، تهیه‌کننده و مدیر تولید یاد شده است.</p>
        <h3>نقش در خانه برداشت</h3>
        <p>یاسر نظری بنیان‌گذار مجموعه است و رویکرد آموزشی آن بر پیوند آموزش بازیگری با تمرین، تحلیل شخصیت و تجربهٔ عملی شکل گرفته است.</p>
        <h3>صفحه‌های مرتبط</h3>
        <p><Link href="/about">سوابق و مجوزها در دربارهٔ ما</Link> · <Link href="/metod-panj-soal">متد پنج سؤال طلایی</Link> · <Link href="/projects">پروژه‌ها و آثار</Link> · <Link href="/khane-bardasht">معرفی خانه برداشت</Link></p>
      </article>
    </SimplePage>
  );
}
