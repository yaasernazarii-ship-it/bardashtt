import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'خانواده برداشت | اولین آموزشگاه رایگان بازیگری سینما در ایران',
  description: 'خانواده برداشت — اولین و تنها آموزشگاه رایگان بازیگری سینما در ایران. دوره‌های مقدماتی، تکمیلی و پیشرفته بازیگری در تهران و مازندران. ثبت‌نام رایگان.',
  alternates: { canonical: 'https://www.bardashtt.com/' },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await loadContent();
  return (
    <PageLayout>
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__bg" />
        <div className="container home-hero__inner home-hero__inner--center">
          <div className="home-hero__logo">
            <img src={t('home.hero.logo')} alt="خانه برداشت" />
          </div>
          <div className="home-hero__eyebrow">
            <span /> {t('home.hero.eyebrow')}
          </div>
          <h1 className="home-hero__slogan">
            {t('home.hero.title')}
            <span>{t('home.hero.subtitle')}</span>
          </h1>
          <div className="home-hero__actions home-hero__actions--center">
            <Link href="/courses" className="btn btn--gold btn--lg">{t('home.hero.ctaPrimary')}</Link>
            <Link href="/about" className="btn btn--hero-secondary btn--lg">{t('home.hero.ctaSecondary')}</Link>
          </div>
        </div>
      </section>

      {/* شعبه‌ها */}
      <section style={{ background: 'linear-gradient(135deg, #1B1B1B 0%, #202020 100%)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="tag tag--gold">شعبه‌ها</span>
            <h2 className="heading" style={{ marginTop: 14, color: '#fff' }}>{t('home.branch.heading')}</h2>
          </div>
          <div className="branch-row">
            <div className="branch-card">
              <div className="bnum">۰۱</div>
              <h3>{t('home.branch1.title')}</h3>
              <p>{t('home.branch1.desc')}</p>
              <div className="active-dot">فعال</div>
            </div>
            <div className="branch-card">
              <div className="bnum">۰۲</div>
              <h3>{t('home.branch2.title')}</h3>
              <p>{t('home.branch2.desc')}</p>
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
          <a href={`tel:${t('contact.phone')}`}>{t('contact.phone')}</a>
        </div>
        <div className="contact-cell">
          <div className="ico">📸</div>
          <div className="lbl">اینستاگرام</div>
          <a href={t('contact.instagramUrl')} target="_blank" rel="noopener noreferrer">{t('contact.instagram')}</a>
        </div>
        <div className="contact-cell">
          <div className="ico">💬</div>
          <div className="lbl">کانال بله</div>
          <a href={t('contact.baleUrl')} target="_blank" rel="noopener noreferrer">{t('contact.bale')}</a>
        </div>
      </div>
    </PageLayout>
  );
}
