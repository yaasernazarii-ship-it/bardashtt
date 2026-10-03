import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CoursesExplorer from '@/components/CoursesExplorer';
import PageSlider from '@/components/PageSlider';
import { loadContent, splitLines } from '@/lib/siteContent';
import { courseListJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/siteUrl';
import { pageMetadata } from '@/lib/pageMeta';

// شماره و رنگِ گرادیانِ هر دوره ثابت‌اند؛ متن و سرفصل‌ها از پنل می‌آیند.
const NUMS = ['۰۱', '۰۲', '۰۳', '۰۴', '۰۵'];
const GRADS = [
  'linear-gradient(135deg,#2a1e0a 0%,#4a3512 100%)',
  'linear-gradient(135deg,#241a2e 0%,#3d2a4d 100%)',
  'linear-gradient(135deg,#0f2417 0%,#1e4030 100%)',
  'linear-gradient(135deg,#161629 0%,#2d2d52 100%)',
  'linear-gradient(135deg,#2a0f0f 0%,#4a1c1c 100%)',
];

export async function generateMetadata() {
  return pageMetadata('courses');
}

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const t = await loadContent();
  const courses = NUMS.map((num, i) => {
    const n = i + 1;
    return {
      num,
      grad: GRADS[i],
      title: t(`course.c${n}.title`),
      sub: t(`course.c${n}.sub`),
      desc: t(`course.c${n}.desc`),
      items: splitLines(t(`course.c${n}.items`)),
    };
  });
  const courseSlides = splitLines(t('courses.slides'));
  const site = await siteUrl();
  const url = `${site}/courses`;
  const courseLd = courseListJsonLd(
    courses.map((c) => ({ name: c.title, description: c.desc, items: c.items })),
    { site, url },
  );
  const breadcrumbLd = breadcrumbJsonLd([{ name: 'خانه', url: site }, { name: t('courses.title') }]);
  const faqItems = [
    { q: 'دوره‌های بازیگری خانواده برداشت برای چه کسانی است؟', a: 'کودکان، نوجوانان و بزرگسالان علاقه‌مند می‌توانند پس از ثبت درخواست، مسیر آموزشی مناسب خود را آغاز کنند.' },
    { q: 'آیا شرکت در دوره‌ها رایگان است؟', a: 'بله، دوره‌های اصلی خانواده برداشت بدون دریافت شهریه برگزار می‌شوند.' },
    { q: 'برای شروع دوره پیش‌نیاز لازم است؟', a: 'برای شروع مسیر مقدماتی، سابقهٔ بازیگری یا مدرک قبلی لازم نیست؛ علاقه، پیگیری و حضور منظم اهمیت دارد.' },
  ];
  const faqLd = faqJsonLd([{ items: faqItems }]);
  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(courseLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqLd)} />
      {courseSlides.length > 0 && <PageSlider title={t('courses.title')} images={courseSlides} />}
      <section className="container" aria-labelledby="courses-summary-title" style={{ padding: '32px 0 8px' }}>
        <h2 id="courses-summary-title" className="subheading">دوره‌های رایگان بازیگری برای همهٔ سنین</h2>
        <p className="body-lg">دوره‌های خانواده برداشت برای کودکان، نوجوانان و بزرگسالان طراحی شده‌اند و مسیر آموزش بازیگری را از مقدماتی تا پیشرفته پوشش می‌دهند.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href="/register" className="btn btn--gold">ثبت‌نام رایگان</Link>
          <Link href="/about#about-path" className="btn btn--outline">آشنایی با مسیر رشد هنرجو</Link>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 24 }}>
          <table className="data-table">
            <caption className="sr-only">مشخصات دوره‌های بازیگری خانواده برداشت</caption>
            <thead><tr><th>مدت مسیر</th><th>ردهٔ سنی</th><th>محل برگزاری</th><th>مدرک</th><th>هزینه</th></tr></thead>
            <tbody><tr><td>۵ مرحله آموزشی</td><td>کودک، نوجوان و بزرگسال</td><td>تهران و شعبه‌های فعال</td><td>پس از تکمیل شرایط و آزمون</td><td>رایگان</td></tr></tbody>
          </table>
        </div>
      </section>
      <CoursesExplorer
        heading={t('courses.title')}
        subheading={t('courses.subtitle')}
        courses={courses}
        listHeading={t('courses.panel.listHeading')}
        ctaNote={t('courses.cta.note')}
        ctaButton={t('courses.cta.button')}
      />
      <section className="container" aria-labelledby="courses-faq-title" style={{ padding: '12px 0 56px' }}>
        <h2 id="courses-faq-title" className="subheading">سؤالات متداول دربارهٔ دوره‌ها</h2>
        <div className="faq-list">{faqItems.map((item) => <details key={item.q} className="faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
        <p style={{ marginTop: 18 }}><Link href="/faq">مشاهدهٔ همهٔ سؤالات متداول</Link></p>
      </section>
    </PageLayout>
  );
}
