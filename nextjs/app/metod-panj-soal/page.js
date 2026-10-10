import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { siteUrl } from '@/lib/siteUrl';

export async function generateMetadata() {
  const site = await siteUrl();
  const title = 'متد پنج سؤال طلایی چیست؟';
  const description = 'معرفی متد پنج سؤال طلایی در رویکرد آموزشی بازیگری خانه برداشت.';
  return { title, description, alternates: { canonical: `${site}/metod-panj-soal` }, openGraph: { title, description, url: `${site}/metod-panj-soal` } };
}

export default async function MethodPage() {
  const site = await siteUrl();
  const data = { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: 'متد پنج سؤال طلایی', description: 'رویکرد آموزشی معرفی‌شده در دوره‌های بازیگری خانه برداشت.', url: `${site}/metod-panj-soal`, inLanguage: 'fa-IR' };
  return (
    <SimplePage title="متد پنج سؤال طلایی چیست؟" subtitle="یک رویکرد آموزشی در مسیر بازیگری و تحلیل شخصیت" tag="رویکرد آموزشی" narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      <article className="stack-card" style={{ lineHeight: 2.1 }}>
        <h2>متد پنج سؤال طلایی</h2>
        <p>متد پنج سؤال طلایی رویکردی آموزشی است که خانه برداشت در بخشی از مسیر آموزش بازیگری خود به آن ارجاع می‌دهد. این رویکرد برای نزدیک‌شدن هنرجو به تحلیل شخصیت، مشاهدهٔ رفتار و تمرین آگاهانه در بازیگری معرفی شده است.</p>
        <p>متد پنج سؤال طلایی جایگزین تمرین و تجربهٔ عملی نیست؛ در کنار آموزش بازیگری، تمرین، تحلیل شخصیت و حضور در فرایندهای آموزشی مجموعه به کار می‌آید.</p>
        <h3>جایگاه در آموزش</h3>
        <p>این رویکرد در معرفی دوره‌ها و صفحهٔ دربارهٔ خانه برداشت، بخشی از شیوهٔ آموزش بازیگری و انتقال تجربهٔ عملی معرفی شده است.</p>
        <h3>برای مطالعهٔ بیشتر</h3>
        <p><Link href="/ketab-panj-soal">معرفی کتاب متد پنج سؤال طلایی</Link> · <Link href="/courses">دوره‌های بازیگری</Link> · <Link href="/yaser-nazari">یاسر نظری</Link></p>
      </article>
    </SimplePage>
  );
}
