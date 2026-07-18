import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

export const metadata = {
  title: 'خانواده برداشت | اولین آموزشگاه رایگان بازیگری سینما در ایران',
  description: 'خانواده برداشت — اولین و تنها آموزشگاه رایگان بازیگری سینما در ایران. دوره‌های مقدماتی، تکمیلی و پیشرفته بازیگری در تهران و مازندران. ثبت‌نام رایگان.',
  alternates: { canonical: 'https://www.bardashtt.com/' },
};

export default function HomePage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__bg" />
        <div className="container home-hero__inner home-hero__inner--center">
          <div className="home-hero__logo">
            <img src="/bardasht-logo.png" alt="خانه برداشت" />
          </div>
          <div className="home-hero__eyebrow">
            <span /> اولین آموزشگاه رایگان بازیگری سینما در ایران
          </div>
          <h1 className="home-hero__slogan">
            استعداد بازیگری‌ات را جدی بگیر
            <span>آموزش حرفه‌ای، رایگان و قابل‌اعتماد</span>
          </h1>
          <div className="home-hero__actions home-hero__actions--center">
            <Link href="/courses" className="btn btn--gold btn--lg">مشاهده دوره‌ها</Link>
            <Link href="/about" className="btn btn--hero-secondary btn--lg">درباره ما</Link>
          </div>
        </div>
      </section>

      {/* شعبه‌ها */}
      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="tag tag--dark">شعبه‌ها</span>
            <h2 className="heading" style={{ marginTop: 14 }}>ما کجاییم؟</h2>
          </div>
          <div className="branch-row">
            <div className="branch-card">
              <div className="bnum">۰۱</div>
              <h3>تهران</h3>
              <p>مرکز اصلی خانواده برداشت در پایتخت. دوره‌های تخصصی با حضور موسس و اساتید مجرب.</p>
              <div className="active-dot">فعال</div>
            </div>
            <div className="branch-card">
              <div className="bnum">۰۲</div>
              <h3>مازندران</h3>
              <p>شعبه شمال کشور — فرصتی برای استعدادهای استان مازندران و مناطق همجوار.</p>
              <div className="active-dot">فعال</div>
            </div>
          </div>
        </div>
      </section>

      {/* تماس */}
      <div className="contact-row">
        <div className="contact-cell">
          <div className="ico">📞</div>
          <div className="lbl">تماس مستقیم</div>
          <a href="tel:02191090934">02191090934</a>
        </div>
        <div className="contact-cell">
          <div className="ico">📸</div>
          <div className="lbl">اینستاگرام</div>
          <a href="https://instagram.com/bardashtt" target="_blank" rel="noopener noreferrer">@bardashtt</a>
        </div>
        <div className="contact-cell">
          <div className="ico">💬</div>
          <div className="lbl">کانال بله</div>
          <a href="https://ble.ir/bardasht_family" target="_blank" rel="noopener noreferrer">@bardasht_family</a>
        </div>
      </div>
    </PageLayout>
  );
}
