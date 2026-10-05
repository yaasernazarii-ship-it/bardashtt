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
      <style>{`.courses-editorial-intro{padding:56px 24px 40px!important}.courses-intro-card{display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:center;background:var(--dark);color:#fff;border-radius:var(--radius-lg);padding:clamp(28px,4vw,48px);position:relative;overflow:hidden}.courses-intro-card::before{content:'';position:absolute;top:0;right:0;width:6px;height:100%;background:var(--gold)}.courses-editorial-intro .subheading{color:#fff;font-size:clamp(1.5rem,2.8vw,2.3rem);line-height:1.35;margin-bottom:14px}.courses-editorial-intro .body-lg{color:rgba(255,255,255,.68);font-size:.92rem;line-height:2;margin:0}.courses-editorial-intro__actions{display:flex;flex-direction:column;gap:12px;align-items:stretch}.courses-editorial-intro__actions .btn--outline{color:#fff;border-color:rgba(255,255,255,.3)}.courses-editorial-intro__actions .btn--outline:hover{background:#fff;color:var(--dark);border-color:#fff}.courses-editorial-table{overflow-x:auto;margin-top:18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--white)}.courses-editorial-table .data-table{min-width:680px;margin:0}.courses-editorial-table th{background:var(--surface);font-size:.75rem;color:var(--muted);font-weight:700}.courses-editorial-table td{font-size:.88rem;font-weight:700;color:var(--dark)}.courses-editorial-faq{padding:72px 0 70px!important;border-top:1px solid var(--line);background:var(--white)}.courses-editorial-faq .subheading{font-size:clamp(1.8rem,3vw,2.8rem);margin-bottom:10px}.courses-editorial-faq::before{content:'پاسخ‌های کوتاه برای شروع مسیر';display:block;color:var(--muted);font-size:.82rem;margin-bottom:30px}.courses-editorial-faq .faq-list{max-width:820px;border-top:1px solid var(--dark);counter-reset:faq}.courses-editorial-faq .faq-item{counter-increment:faq;border-bottom:1px solid var(--border);padding:0}.courses-editorial-faq .faq-item summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:18px;padding:20px 0;font-size:.92rem;font-weight:700}.courses-editorial-faq .faq-item summary::-webkit-details-marker{display:none}.courses-editorial-faq .faq-item summary::before{content:'۰' counter(faq);color:#aaa;font-size:.8rem;font-weight:800;min-width:24px}.courses-editorial-faq .faq-item summary::after{content:'+';color:#a27c00;font-size:1.1rem;margin-right:auto}.courses-editorial-faq .faq-item[open] summary::after{content:'−'}.courses-editorial-faq .faq-item p{margin:0 0 18px;padding:0 42px 0 20px;color:var(--muted);font-size:.82rem;line-height:1.9;max-width:700px}.courses-editorial-faq>p{margin-top:24px!important}.courses-editorial-faq>p a{display:inline-flex;border-bottom:1px solid var(--gold);padding-bottom:5px;font-size:.78rem;font-weight:700}@media(max-width:700px){.courses-intro-card{grid-template-columns:1fr;gap:24px}.courses-editorial-intro{padding-top:55px!important}.courses-editorial-table .data-table{min-width:620px}.courses-editorial-faq{padding:56px 0 55px!important}.courses-editorial-faq .faq-item summary{font-size:.84rem;gap:12px}.courses-editorial-faq .faq-item p{padding-right:36px}}`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(courseLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqLd)} />
      {courseSlides.length > 0 && <PageSlider title={t('courses.title')} images={courseSlides} />}
      <section className="container courses-editorial-intro" aria-labelledby="courses-summary-title" style={{ padding: '32px 0 8px' }}>
        <div className="courses-intro-card"><div><h2 id="courses-summary-title" className="subheading">{t('courses.intro.heading')}</h2>
        <p className="body-lg">{t('courses.intro.text')}</p></div>
        <div className="courses-editorial-intro__actions">
          <Link href="/register" className="btn btn--gold">{t('courses.intro.register')}</Link>
          <Link href="/about#about-path" className="btn btn--outline">{t('courses.intro.path')}</Link>
        </div></div>
        <div className="courses-editorial-table">
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
      <section className="container courses-editorial-faq" aria-labelledby="courses-faq-title" style={{ padding: '12px 0 56px' }}>
        <h2 id="courses-faq-title" className="subheading">{t('courses.faq.heading')}</h2>
        <div className="faq-list">{faqItems.map((item) => <details key={item.q} className="faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
        <p style={{ marginTop: 18 }}><Link href="/faq">{t('courses.faq.all')}</Link></p>
      </section>
    </PageLayout>
  );
}
