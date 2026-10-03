import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import SignupWizard from '@/components/SignupWizard';
import { loadContent } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';
import { signupContent, parsePairs } from '@/lib/formContent';

export async function generateMetadata() {
  return pageMetadata('register');
}

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const t = await loadContent();
  const benefits = parsePairs(t('register.benefits'));
  return (
    <PageLayout>
      <style>{`@media(max-width:800px){.register-steps-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:480px){.register-steps-grid{grid-template-columns:1fr!important;}}`}</style>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{t('register.tag')}</div>
          <h1>{t('register.title')}</h1>
          <p>{t('register.subtitle')}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › ثبت‌نام</div>
        </div>
      </div>
      <section aria-labelledby="register-steps-title" style={{ background: 'var(--white)', padding: '28px 0 8px' }}>
        <div className="container">
          <h2 id="register-steps-title" className="subheading">مراحل ثبت‌نام دوره بازیگری</h2>
          <div className="feature-list register-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              ['۱', 'تکمیل فرم', 'اطلاعات اولیه و مسیر موردنظر خود را وارد کنید.'],
              ['۲', 'ارسال مدارک', 'اطلاعات تماس و مدارک لازم را با دقت ارسال کنید.'],
              ['۳', 'بررسی درخواست', 'تیم خانواده برداشت درخواست شما را بررسی می‌کند.'],
              ['۴', 'اعلام شروع', 'پس از تأیید، زمان و مسیر شروع آموزش اعلام می‌شود.'],
            ].map(([number, title, text]) => (
              <div key={number} className="feature-list__item">
                <div className="feature-list__icon">{number}</div>
                <div><strong>{title}</strong><span>{text}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ background: 'var(--surface)' }}>
        <div className="container split-layout">
          <div className="stack-card stack-card--dark">
            <span className="tag tag--gold" style={{ marginBottom: 18 }}>{t('register.benefits.tag')}</span>
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
          <SignupWizard content={signupContent(t)} />
        </div>
      </section>
    </PageLayout>
  );
}
