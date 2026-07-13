import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import HomeSlider from '@/components/HomeSlider';

export const metadata = {
  title: 'خانواده برداشت | اولین آموزشگاه رایگان بازیگری سینما در ایران',
  description: 'خانواده برداشت — اولین و تنها آموزشگاه رایگان بازیگری سینما در ایران. دوره‌های مقدماتی، تکمیلی و پیشرفته بازیگری در تهران و مازندران. ثبت‌نام رایگان.',
  alternates: { canonical: 'https://khanevadehbardasht.ir/' },
};

export default function HomePage() {
  return (
    <PageLayout>
      {/* اسلایدر */}
      <HomeSlider />

      {/* نوار CTA */}
      <div className="cta-strip">
        <div className="cta-strip__inner">
          <div className="cta-strip__text">
            <h2>اولین آموزشگاه رایگان بازیگری سینما در ایران</h2>
            <p>از سال ۱۳۹۷ · با مجوز رسمی · تهران و مازندران</p>
          </div>
          <div className="cta-strip__btns">
            <Link href="/audition" className="btn btn--dark">ثبت‌نام در کلاس‌ها</Link>
            <Link href="/register" className="btn btn--outline">ساخت حساب رایگان</Link>
          </div>
        </div>
      </div>

      {/* آمار */}
      <div className="stats-bar">
        <div className="stat-cell"><div className="n">۱۳۹۷</div><p>سال تأسیس</p></div>
        <div className="stat-cell"><div className="n">۲</div><p>شعبه فعال</p></div>
        <div className="stat-cell"><div className="n">۱۰۰٪</div><p>کاملاً رایگان</p></div>
        <div className="stat-cell"><div className="n">۵</div><p>مسیر آموزشی</p></div>
      </div>

      {/* درباره ما */}
      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="about-preview">
            <div className="about-preview__img">
              <div className="about-preview__badge">
                <strong>جایزه بین‌المللی زاگرب</strong>
                <span>بهترین کارگردانی · کرواسی</span>
              </div>
            </div>
            <div>
              <span className="tag tag--gold">درباره ما</span>
              <h2 className="heading" style={{ marginTop: 16, fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>
                خانواده برداشت<br />چیست؟
              </h2>
              <div className="line" />
              <p className="body-lg" style={{ marginBottom: 18 }}>
                با یک باور ساده شکل گرفت:<br />
                <strong>استعداد نباید گرو پول باشد.</strong>
              </p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 28 }}>
                از سال ۱۳۹۷، با مجوز رسمی و برگزاری دوره‌های تخصصی، بستری حرفه‌ای برای کشف و پرورش استعداد بازیگری فراهم کرده‌ایم — در تهران و مازندران.
              </p>
              <div className="trust-items">
                <div className="trust-item">
                  <span className="ti-icon">🏆</span>
                  <div>
                    <strong>برنده جایزه بهترین کارگردانی</strong>
                    <p>جشنواره بین‌المللی زاگرب کرواسی</p>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="ti-icon">🎓</span>
                  <div>
                    <strong>مجوز رسمی آموزشی</strong>
                    <p>دارای مجوز رسمی از ادارات آموزشی ذی‌صلاح</p>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="ti-icon">✅</span>
                  <div>
                    <strong>۱۰۰٪ رایگان برای همه</strong>
                    <p>اولین آموزشگاه بازیگری کاملاً رایگان در ایران</p>
                  </div>
                </div>
              </div>
              <Link href="/about" className="btn btn--outline" style={{ marginTop: 12 }}>بیشتر بدانید</Link>
            </div>
          </div>
        </div>
      </section>

      {/* دوره‌ها */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="tag tag--dark">مسیر آموزشی</span>
              <h2 className="heading" style={{ marginTop: 14 }}>دوره‌های ما</h2>
            </div>
            <Link href="/courses" className="btn btn--outline">مشاهده همه</Link>
          </div>
          <div className="course-row">
            {[
              { n: '۰۱', t: 'مقدماتی', d: 'ورود به دنیای بازیگری و کشف توانایی‌های شخصی.' },
              { n: '۰۲', t: 'تکمیلی', d: 'تعمیق مهارت‌ها و کار با متن‌های حرفه‌ای.' },
              { n: '۰۳', t: 'اردو', d: 'تجربه عملی ۲۴ ساعته در محیط واقعی تولید.' },
              { n: '۰۴', t: 'پیشرفته', d: 'بازیگری حرفه‌ای با تکنیک‌های استانیسلاوسکی.' },
              { n: '۰۵', t: 'فیلمسازی', d: 'بازی مقابل دوربین و زبان سینما.' },
            ].map(c => (
              <div key={c.n} className="c-step">
                <div className="num">مرحله {c.n}</div>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
            ))}
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
