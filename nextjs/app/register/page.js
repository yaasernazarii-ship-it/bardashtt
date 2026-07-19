import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import RegisterForm from '@/components/RegisterForm';
import { loadContent } from '@/lib/siteContent';

const benefits = [
  { title: 'کاملاً رایگان', text: 'تمام مسیر آموزشی اصلی بدون شهریه برگزار می‌شود.' },
  { title: 'ارتباط مستقیم', text: 'پس از ثبت درخواست، تیم پشتیبانی برای مراحل بعدی با شما تماس می‌گیرد.' },
  { title: 'مسیر مرحله‌ای', text: 'از آشنایی اولیه تا ورود به فضای حرفه‌ای بازیگری.' },
];

export const metadata = {
  title: 'ثبت‌نام رایگان',
  description: 'ثبت درخواست عضویت در خانواده برداشت برای شروع مسیر آموزش رایگان بازیگری سینما.',
  alternates: { canonical: 'https://www.bardashtt.com/register' },
};

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const t = await loadContent();
  return (
    <PageLayout>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{t('register.tag')}</div>
          <h1>{t('register.title')}</h1>
          <p>{t('register.subtitle')}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › ثبت‌نام</div>
        </div>
      </div>
      <section style={{ background: 'var(--surface)' }}>
        <div className="container split-layout">
          <div className="stack-card stack-card--dark">
            <span className="tag tag--gold" style={{ marginBottom: 18 }}>چرا از اینجا شروع کنیم؟</span>
            <h2 className="heading" style={{ color: '#fff', fontSize: 'clamp(1.5rem,3vw,2.2rem)', marginBottom: 12 }}>{t('register.side.heading')}</h2>
            <p style={{ lineHeight: 1.95, marginBottom: 20 }}>{t('register.side.text')}</p>
            <div className="feature-list">
              {benefits.map((item, index) => (
                <div key={item.title} className="feature-list__item" style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.08)' }}>
                  <div className="feature-list__icon">{index + 1}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <RegisterForm />
        </div>
      </section>
    </PageLayout>
  );
}
