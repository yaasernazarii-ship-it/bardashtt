import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import CourseList from '@/components/CourseList';
import { loadContent, splitLines } from '@/lib/siteContent';
import { faqJsonLd, jsonLdScript } from '@/lib/seo';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('onlineLearning');
}

export const dynamic = 'force-dynamic';

// هر مورد به شکل «عنوان | توضیح» ذخیره می‌شود؛ اگر جداکننده نبود، کل خط عنوان است.
function parsePairs(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split('|');
    return [title.trim(), rest.join('|').trim()];
  });
}

export default async function OnlineLearningPage() {
  const t = await loadContent();
  const lessons = parsePairs(t('online.lessons'));
  const faqItems = [
    { q: 'دورهٔ آنلاین برای چه کسانی مناسب است؟', a: 'برای کودکان، نوجوانان و بزرگسالانی مناسب است که امکان حضور منظم در کلاس حضوری را ندارند یا می‌خواهند تمرین‌ها را از خانه دنبال کنند.' },
    { q: 'آیا یادگیری آنلاین رایگان است؟', a: 'محتوای آموزشی آنلاین خانواده برداشت بدون شهریه ارائه می‌شود.' },
    { q: 'برای شرکت در دورهٔ آنلاین پیش‌نیاز لازم است؟', a: 'برای شروع دورهٔ آنلاین بازیگری، تجربه یا مدرک قبلی لازم نیست.' },
    { q: 'دورهٔ آنلاین چه مدتی طول می‌کشد؟', a: 'مدت یادگیری به مسیر انتخابی، تعداد درس‌ها و برنامهٔ تمرین هنرجو بستگی دارد.' },
    { q: 'آیا پس از دورهٔ آنلاین مدرک صادر می‌شود؟', a: 'شرایط دریافت گواهینامه به تکمیل مسیر آموزشی و شرکت در آزمون مربوط است.' },
    { q: 'چطور در دورهٔ آنلاین ثبت‌نام کنم؟', a: 'از صفحهٔ ثبت‌نام رایگان درخواست خود را ارسال کنید تا اطلاعات ادامهٔ مسیر برایتان اعلام شود.' },
  ];
  const faqLd = faqJsonLd([{ items: faqItems }]);
  return (
    <SimplePage title={t('online.title')} subtitle={t('online.subtitle')} tag={t('online.tag')} slides={splitLines(t('online.slides'))}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqLd)} />
      <section aria-labelledby="online-summary-title" style={{ marginBottom: 24 }}>
        <h2 id="online-summary-title" className="subheading">دورهٔ آنلاین بازیگری چیست؟</h2>
        <p className="body-lg">دورهٔ آنلاین خانواده برداشت برای کودکان، نوجوانان و بزرگسالان طراحی شده است؛ آموزش‌ها غیرحضوری، رایگان و مناسب شروع بدون پیش‌نیاز هستند و هنرجو می‌تواند تمرین‌های بازیگری را از خانه دنبال کند.</p>
        <div style={{ overflowX: 'auto', marginTop: 20 }}>
          <table className="data-table">
            <caption className="sr-only">مشخصات دورهٔ آنلاین بازیگری</caption>
            <thead><tr><th>مدت دوره</th><th>ردهٔ سنی</th><th>محل برگزاری</th><th>مدرک</th><th>هزینه</th></tr></thead>
            <tbody><tr><td>وابسته به مسیر آموزشی</td><td>کودک، نوجوان و بزرگسال</td><td>آنلاین از خانه</td><td>پس از تکمیل شرایط و آزمون</td><td>رایگان</td></tr></tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="online-steps-title" style={{ marginBottom: 24 }}>
        <h2 id="online-steps-title" className="subheading">مراحل ثبت‌نام دورهٔ آنلاین</h2>
        <ol style={{ lineHeight: 2, paddingInlineStart: 24 }}>
          <li>فرم ثبت درخواست رایگان را تکمیل کنید.</li>
          <li>اطلاعات تماس و مشخصات لازم را ارسال کنید.</li>
          <li>درخواست شما بررسی و مسیر مناسب اعلام می‌شود.</li>
          <li>درس‌ها و تمرین‌های آنلاین را طبق برنامه دنبال کنید.</li>
        </ol>
      </section>
      <section aria-labelledby="online-faq-title" style={{ marginBottom: 28 }}>
        <h2 id="online-faq-title" className="subheading">سؤالات متداول دورهٔ آنلاین</h2>
        <div className="faq-list">{faqItems.map((item) => <details key={item.q} className="faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      </section>
      <div className="stack-card" style={{ marginBottom: 22 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>{t('online.heading')}</h2>
        <p className="body-lg">{t('online.body')}</p>
      </div>
      <div className="responsive-grid-4">
        {lessons.map(([title, text], index) => (
          <div key={title} className="content-card">
            <div className="content-card__icon">{index + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <h2 className="subheading" style={{ margin: '32px 0 16px' }}>{t('online.courses.heading')}</h2>
      <CourseList />

      <SectionPosts section="course-video" variant="media" heading={t('online.videos.heading')} />
    </SimplePage>
  );
}
