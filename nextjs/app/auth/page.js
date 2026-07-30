import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import AccountPanel from '@/components/AccountPanel';

const perks = [
  { title: 'حساب تأییدشده', text: 'حساب شما پس از بررسی و تأیید خانواده برداشت ساخته می‌شود.' },
  { title: 'دسترسی متمرکز', text: 'کلاس‌ها، آزمون‌ها و وضعیت آموزشی شما در یک فضای ساده.' },
  { title: 'ورود امن', text: 'با نام کاربری و رمز اختصاصی که برایتان صادر می‌شود وارد می‌شوید.' },
];

export const metadata = {
  title: 'ورود هنرجویان',
  description: 'ورود به حساب کاربری خانواده برداشت با نام کاربری و رمز عبور.',
  alternates: { canonical: 'https://www.bardashtt.com/auth' },
};

export default function AuthPage() {
  return (
    <PageLayout>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">ورود هنرجویان</div>
          <h1>ورود به حساب کاربری</h1>
          <p>برای دسترسی به وضعیت آموزشی، برنامه کلاس‌ها و خدمات هنرجویی، با نام کاربری و رمز عبور خود وارد شوید.</p>
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
          <div>
            <AccountPanel />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
