import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Accordion from '@/components/Accordion';

export const metadata = {
  title: 'سوالات متداول',
  description: 'پاسخ به سوالات پرتکرار درباره دوره‌ها، ثبت‌نام، آزمون و گواهینامه خانواده برداشت.',
};

const groups = [
  {
    title: 'ثبت‌نام و پذیرش', tag: 'tag--gold', items: [
      { q: 'آیا واقعاً آموزش رایگان است؟', a: 'بله، کاملاً رایگان است. خانواده برداشت از ابتدا با هدف دموکراتیزه کردن آموزش بازیگری تأسیس شده و تمام دوره‌های اصلی بدون هیچ هزینه‌ای ارائه می‌شوند.' },
      { q: 'شرط سنی برای ثبت‌نام وجود دارد؟', a: 'خیر، خانواده برداشت برای تمامی سنین پذیرنده است. از کودکان تا بزرگسالان می‌توانند در دوره‌های مناسب سن خود شرکت کنند.' },
      { q: 'آیا نیاز به تجربه قبلی دارم؟', a: 'خیر. دوره مقدماتی برای افراد بدون هیچ تجربه‌ای طراحی شده است. فقط علاقه و تعهد نیاز است.' },
      { q: 'چطور ثبت‌نام کنم؟', a: 'از طریق سایت در بخش ثبت‌نام، اطلاعات خود را وارد کنید. پس از بررسی، تیم پشتیبانی با شما تماس می‌گیرد.' },
    ],
  },
  {
    title: 'دوره‌ها و آموزش', tag: 'tag--dark', items: [
      { q: 'طول هر دوره چقدر است؟', a: 'هر دوره اصلی بسته به محتوا بین ۲ تا ۴ ماه طول می‌کشد. اردوها از ۲۴ ساعته تا ۱۰ روزه برگزار می‌شوند.' },
      { q: 'آیا گواهینامه صادر می‌شود؟', a: 'بله. پس از اتمام موفقیت‌آمیز هر دوره، گواهینامه رسمی صادر می‌شود.' },
      { q: 'آیا می‌توانم از اول وارد دوره پیشرفته شوم؟', a: 'خیر. ورود به هر مرحله نیاز به گذراندن مرحله قبلی دارد.' },
    ],
  },
  {
    title: 'بیمه و ایمنی', tag: 'tag--dark', items: [
      { q: 'آیا هنرجویان بیمه می‌شوند؟', a: 'بله. خانواده برداشت برای هنرجویان در طول دوره‌ها و اردوها بیمه صادر می‌کند.' },
    ],
  },
];

const summary = [
  { title: 'رایگان و رسمی', text: 'تمام مسیر اصلی بدون شهریه و با ساختار مشخص آموزشی برگزار می‌شود.' },
  { title: 'برای همه سنین', text: 'پذیرش برای کودکان، نوجوانان و بزرگسالان با مسیر متناسب انجام می‌شود.' },
  { title: 'ارتباط مستقیم', text: 'اگر پاسخ سؤال‌تان اینجا نیست، می‌توانید سریع با پشتیبانی تماس بگیرید.' },
];

export default function FaqPage() {
  return (
    <PageLayout>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">راهنمای هنرجویان</div>
          <h1>سوالات متداول</h1>
          <p>پاسخ سوال‌های رایج درباره ثبت‌نام، دوره‌ها، گواهینامه و روند آموزشی خانواده برداشت.</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › سوالات متداول</div>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="faq-summary">
            {summary.map(item => (
              <div key={item.title} className="faq-summary-card">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="faq-grid">
            <aside className="faq-side">
              <span className="tag tag--gold" style={{ marginBottom: 14 }}>پشتیبانی مستقیم</span>
              <h3>اگر پاسخ را پیدا نکردید</h3>
              <p>اگر سوال شما در این بخش نیست، تیم پشتیبانی خانواده برداشت آماده پاسخ‌گویی مستقیم به شماست.</p>
              <div className="feature-list">
                <div className="feature-list__item">
                  <div className="feature-list__icon">۱</div>
                  <div>
                    <strong>ثبت‌نام را سریع شروع کنید</strong>
                    <span>اگر آماده ورود به مسیر آموزشی هستید، از فرم ثبت‌نام اقدام کنید.</span>
                  </div>
                </div>
                <div className="feature-list__item">
                  <div className="feature-list__icon">۲</div>
                  <div>
                    <strong>با پشتیبانی تماس بگیرید</strong>
                    <span>برای سؤال‌های اختصاصی، ارتباط مستقیم سریع‌ترین راه است.</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <a href="tel:02191090934" className="btn btn--gold">تماس مستقیم</a>
                <Link href="/register" className="btn btn--hero-secondary">ثبت‌نام رایگان</Link>
              </div>
            </aside>
            <div>
              {groups.map(group => (
                <div key={group.title} style={{ marginBottom: 20 }}>
                  <span className={`tag ${group.tag}`} style={{ marginBottom: 14 }}>{group.title}</span>
                  <div className="faq-panel"><Accordion items={group.items} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
