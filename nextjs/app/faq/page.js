import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Accordion from '@/components/Accordion';
import OpenChatButton from '@/components/OpenChatButton';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'سوالات متداول',
  description: 'پاسخ به سوالات پرتکرار درباره دوره‌ها، ثبت‌نام، آزمون و گواهینامه خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/faq' },
};

export const dynamic = 'force-dynamic';

const groups = [
  {
    title: 'ثبت‌نام و پذیرش', tag: 'tag--gold', items: [
      { q: 'آیا آموزشگاه واقعاً رایگان است؟', a: 'بله. آموزش دوره‌ها رایگان است و تنها هزینه‌های اجرایی مانند اجاره لوکیشن، پلاتو یا موارد اعلام‌شده پیش از شروع دوره توسط هنرجو پرداخت می‌شود.' },
      { q: 'چگونه ثبت‌نام کنم؟', a: 'از طریق فرم ثبت‌نام سایت یا ارسال عدد ۱ به دایرکت اینستاگرام. پس از ثبت‌نام، اطلاعات شما بررسی و در صورت تکمیل بودن، کارشناسان با شما تماس خواهند گرفت.' },
      { q: 'چه مدت بعد از ثبت‌نام با من تماس می‌گیرید؟', a: 'معمولاً در اولین فرصت و بر اساس زمان ثبت‌نام و ظرفیت دوره‌ها، کارشناسان با شما تماس می‌گیرند.' },
      { q: 'آیا بدون هیچ سابقه بازیگری هم می‌توانم شرکت کنم؟', a: 'بله. دوره‌های مقدماتی برای افرادی طراحی شده‌اند که هیچ تجربه قبلی در بازیگری ندارند.' },
      { q: 'آیا محدودیت سنی برای ثبت‌نام وجود دارد؟', a: 'خیر. افراد در رده‌های سنی مختلف می‌توانند در دوره‌های متناسب با شرایط خود شرکت کنند.' },
    ],
  },
  {
    title: 'دوره‌ها و برگزاری', tag: 'tag--dark', items: [
      { q: 'کلاس‌ها در چه شهرهایی برگزار می‌شوند؟', a: 'در حال حاضر دوره‌ها در دو شعبهٔ فعال، تهران و مازندران برگزار می‌شوند. اطلاعات زمان و محل هر دوره هنگام ثبت‌نام اعلام خواهد شد.' },
      { q: 'آیا بعد از پایان دوره مدرک دریافت می‌کنم؟', a: 'اطلاعات مربوط به گواهی پایان دوره و شرایط دریافت آن در زمان ثبت‌نام توسط کارشناسان توضیح داده می‌شود.' },
      { q: 'آیا پس از پایان دوره امکان معرفی به پروژه‌های بازیگری وجود دارد؟', a: 'هنرجویان مستعد پس از گذراندن دوره‌ها و بر اساس ارزیابی، ممکن است برای فعالیت‌ها و پروژه‌های مرتبط معرفی شوند. این موضوع به عملکرد هنرجو بستگی دارد و تضمینی نیست.' },
    ],
  },
  {
    title: 'پشتیبانی و ارتباط', tag: 'tag--dark', items: [
      { q: 'اگر بعد از ثبت‌نام پاسخی دریافت نکردم چه کار کنم؟', a: 'در صورت گذشت چند روز بدون دریافت تماس، از طریق چت آنلاین سایت، دایرکت اینستاگرام یا شماره پشتیبانی با ما در ارتباط باشید.' },
      { q: 'سؤال من در این صفحه نیست، چه کار کنم؟', a: 'از طریق چت آنلاین سایت، تماس تلفنی یا دایرکت اینستاگرام با پشتیبانی در ارتباط باشید. کارشناسان ما در سریع‌ترین زمان ممکن پاسخگوی شما خواهند بود.' },
    ],
  },
];

export default async function FaqPage() {
  const t = await loadContent();
  return (
    <PageLayout>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{t('faq.tag')}</div>
          <h1>{t('faq.title')}</h1>
          <p>{t('faq.subtitle')}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › سوالات متداول</div>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="faq-grid">
            <aside className="faq-side">
              <span className="tag tag--gold" style={{ marginBottom: 14 }}>پشتیبانی مستقیم</span>
              <h3>{t('faq.side.heading')}</h3>
              <p>{t('faq.side.text')}</p>
              <div className="feature-list">
                <div className="feature-list__item">
                  <div className="feature-list__icon">۱</div>
                  <div>
                    <strong>دوره‌ها را ببینید</strong>
                    <span>اگر آماده ورود به مسیر آموزشی هستید، از صفحهٔ دوره‌ها ثبت‌نام را آغاز کنید.</span>
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
                <OpenChatButton className="btn btn--gold">پشتیبانی آنلاین</OpenChatButton>
                <a href={`tel:${t('contact.phone')}`} className="btn btn--hero-secondary">تماس مستقیم</a>
                <Link href="/courses" className="btn btn--hero-secondary">مشاهده دوره‌ها</Link>
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
