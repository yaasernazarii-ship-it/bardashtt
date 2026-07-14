'use client';
import Link from 'next/link';
import { useState } from 'react';
import PageLayout from '@/components/PageLayout';

const perks = [
  { title: 'ورود سریع', text: 'فقط با شماره موبایل و کد تأیید، بدون رمزهای پیچیده.' },
  { title: 'دسترسی متمرکز', text: 'کلاس‌ها، آزمون‌ها و وضعیت آموزشی شما در یک فضای ساده.' },
  { title: 'مناسب موبایل', text: 'فرآیند ورود برای استفاده سریع روی گوشی بهینه شده است.' },
];

export default function AuthPage() {
  const [otpSent, setOtpSent] = useState(false);
  return (
    <PageLayout>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">ورود هنرجویان</div>
          <h1>ورود به حساب کاربری</h1>
          <p>برای دسترسی به وضعیت آموزشی، برنامه کلاس‌ها و خدمات هنرجویی، با شماره موبایل خود وارد شوید.</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › ورود</div>
        </div>
      </div>
      <section style={{ background: 'var(--surface)' }}>
        <div className="container split-layout split-layout--compact">
          <div className="stack-card">
            <span className="tag tag--dark" style={{ marginBottom: 18 }}>مزایای حساب هنرجویی</span>
            <h2 className="heading" style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', marginBottom: 12 }}>همه چیز در یک پنل ساده و سریع</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.95, marginBottom: 20 }}>با ورود به حساب، مسیر آموزشی، دسترسی به دوره‌ها، اطلاع‌رسانی‌ها و وضعیت هنرجویی شما در یک محیط یکپارچه در دسترس خواهد بود.</p>
            <div className="feature-list">
              {perks.map((item, index) => (
                <div key={item.title} className="feature-list__item">
                  <div className="feature-list__icon">{index + 1}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <form className="form-shell" onSubmit={(e) => { e.preventDefault(); setOtpSent(true); }}>
            <div className="form-shell__head">
              <h2>ورود با شماره موبایل</h2>
              <p>شماره موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود.</p>
            </div>
            {otpSent && <div className="alert alert--info">کد تأیید آزمایشی: 1234</div>}
            <div className="form-group">
              <label className="form-label">شماره موبایل</label>
              <input className="form-input" dir="ltr" type="tel" required placeholder="09xxxxxxxxx" />
            </div>
            {otpSent && <div className="otp-wrap">{[0,1,2,3].map(i => <input key={i} className="otp-input" maxLength="1" inputMode="numeric" />)}</div>}
            <button className="btn btn--dark btn--full">{otpSent ? 'ورود' : 'دریافت کد'}</button>
            <p className="form-hint" style={{ textAlign: 'center', marginTop: 14 }}>حساب ندارید؟ <Link href="/register" style={{ color: 'var(--dark)', fontWeight: 800 }}>عضویت رایگان</Link></p>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}
