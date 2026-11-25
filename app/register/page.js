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
      <style>{`@media(max-width:800px){.register-steps-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:480px){.register-steps-grid{grid-template-columns:1fr!important;}}.register-editorial{background:var(--white)!important;padding:68px 0 24px!important}.register-editorial .container{max-width:1000px}.register-editorial-head{display:block;margin-bottom:32px}.register-editorial-head .subheading{font-size:clamp(1.8rem,4vw,3.2rem);line-height:1.2;letter-spacing:-.05em}.register-editorial-head p{color:var(--muted);line-height:2;font-size:.88rem;border-right:2px solid var(--gold);padding-right:20px;margin:0}.register-editorial .register-steps-grid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:0!important;border-top:1px solid var(--dark);margin-top:0}.register-editorial .feature-list__item{display:block;background:transparent;border:0;border-bottom:1px solid var(--border);border-radius:0;padding:22px 16px 24px 0}.register-editorial .feature-list__item:not(:last-child){border-left:1px solid var(--border);padding-left:16px}.register-editorial .feature-list__icon{background:transparent;color:#b6b1a8;width:auto;height:auto;display:block;font-size:1.65rem;font-weight:900;margin-bottom:16px}.register-editorial .feature-list__item strong{font-size:.95rem;margin-bottom:7px}.register-editorial .feature-list__item span{font-size:.78rem;line-height:1.9}.register-editorial + section{padding-top:74px}@media(max-width:800px){.register-editorial-head{grid-template-columns:1fr;gap:18px}.register-editorial .register-steps-grid{grid-template-columns:1fr 1fr!important}.register-editorial .feature-list__item:nth-child(2){border-left:0}.register-editorial .feature-list__item:nth-child(odd){padding-left:16px;border-left:1px solid var(--border)}}@media(max-width:480px){.register-editorial .register-steps-grid{grid-template-columns:1fr!important}.register-editorial .feature-list__item{border-left:0!important;padding-left:0!important}}`}</style>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{t('register.tag')}</div>
          <h1>{t('register.title')}</h1>
          <p>{t('register.subtitle')}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › ثبت‌نام</div>
        </div>
      </div>
      <section className="register-editorial" aria-labelledby="register-steps-title" style={{ background: 'var(--white)', padding: '28px 0 8px' }}>
        <div className="container">
          <div className="register-editorial-head"><h2 id="register-steps-title" className="subheading">مراحل ساخت حساب کاربری</h2></div>
          <div className="feature-list register-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              ['۱', 'انتخاب نوع حساب', 'مشخص کنید حساب کاربری هنرجو یا فیلمساز می‌خواهید.'],
              ['۲', 'تکمیل اطلاعات', 'اطلاعات لازم برای ساخت حساب خود را با دقت وارد کنید.'],
              ['۳', 'بررسی درخواست', 'تیم خانواده برداشت اطلاعات حساب شما را بررسی می‌کند.'],
              ['۴', 'دریافت اطلاعات ورود', 'پس از تأیید، نام کاربری و رمز عبور برای شما ارسال می‌شود.'],
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
