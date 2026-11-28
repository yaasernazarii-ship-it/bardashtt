import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import HomeHeroBg from '@/components/HomeHeroBg';
import Icon from '@/components/Icon';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';
import IdentityFaq from '@/components/IdentityFaq';

export async function generateMetadata() {
  return pageMetadata('home');
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await loadContent();
  const heroSlides = splitLines(t('home.hero.slides'));
  const configuredHeroImages = heroSlides.length ? heroSlides : [t('home.hero.bgImage')].filter(Boolean);
  const heroImages = [t('home.hero.featuredImage'), ...configuredHeroImages].filter(Boolean);
  const storyImage = t('home.story.image');
  return (
    <PageLayout>
      {/* Hero */}
      <section id="hero" className="home-hero">
        <HomeHeroBg images={heroImages} />
        <div className="container home-hero__inner home-hero__inner--center">
          <div className="home-hero__eyebrow">{t('home.hero.eyebrow')}</div>
          <h1 className="home-hero__slogan">{t('home.hero.title')}</h1>
          <div className="home-hero__actions">
            <Link href="/courses" className="home-pill home-pill--gold">{t('home.hero.ctaPrimary')}</Link>
            <Link href="/about" className="home-pill">{t('home.hero.ctaSecondary')}</Link>
          </div>
        </div>
        <a href="#story" className="home-hero__down" aria-label="ادامه"><Icon name="arrowUp" size={20} /></a>
      </section>

      {/* داستان ما */}
      <section id="story" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="home-story">
            {storyImage ? <div className="home-story__media"><img src={storyImage} alt={t('home.story.imageAlt')} loading="lazy" /></div> : null}
            <div className="story-text">
              <span className="home-kicker">{t('about.story.eyebrow')}</span>
              <h2 className="home-title">{t('about.story.heading')}</h2>
              <p className="body-lg" style={{ marginBottom: 20 }}>
                {t('about.story.intro')}<br />
                <strong>{t('about.story.lead')}</strong>
              </p>
              <p>{t('about.story.p1')}</p>
              <p>{t('about.story.p2')}</p>
              <p>{t('about.story.p3')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="seo-intro home-quote" aria-labelledby="seo-intro-title">
        <div className="container">
          <span className="home-quote__mark" aria-hidden="true">”</span>
          <h2 id="seo-intro-title" className="home-title">{t('home.seo.heading')}</h2>
          <p className="body-lg">{t('home.seo.text')}</p>
        </div>
      </section>
      <IdentityFaq heading={t('home.faq.heading')} items={splitLines(t('home.faq.items'))} />

      {/* آمار */}
      <section id="stats" className="home-features">
        <div className="container">
          <div className="home-features__grid">
            {[[t('about.stat1.num'),t('about.stat1.label')],[t('about.stat2.num'),t('about.stat2.label')],[t('about.stat3.num'),t('about.stat3.label')],[t('about.stat4.num'),t('about.stat4.label')]].map(([n,l]) => (
              <div key={l} className="home-feature">
                <div className="home-feature__num">{n}</div>
                <p>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* تماس */}
      <div id="contact" className="contact-row">
        <a className="contact-cell" href={`tel:${t('contact.phone')}`} aria-label={`تماس با شماره ${t('contact.phone')}`}>
          <div className="ico"><Icon name="phone" size={26} /></div>
          <div className="lbl">{t('contact.phoneLabel')}</div>
          <span className="contact-value">{t('contact.phone')}</span>
        </a>
        <a className="contact-cell" href={t('contact.instagramUrl')} target="_blank" rel="noopener noreferrer" aria-label="مشاهده صفحه اینستاگرام">
          <div className="ico"><Icon name="instagram" size={26} /></div>
          <div className="lbl">{t('contact.instagramLabel')}</div>
          <span className="contact-value">{t('contact.instagram')}</span>
        </a>
        <a className="contact-cell" href={t('contact.baleUrl')} target="_blank" rel="noopener noreferrer" aria-label="مشاهده کانال بله">
          <div className="ico"><Icon name="chat" size={26} /></div>
          <div className="lbl">{t('contact.baleLabel')}</div>
          <span className="contact-value">{t('contact.bale')}</span>
        </a>
      </div>
      <section
        className="contact-addresses"
        aria-label="نشانی شعب آموزشگاه"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', background: '#171717' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '22px max(28px, calc((100vw - 1180px) / 2))', color: 'var(--gold)' }}>
          <Icon name="mapPin" size={24} />
          <div style={{ display: 'grid', gap: 3, color: 'rgba(255,255,255,.68)', lineHeight: 1.85 }}><strong style={{ color: '#fff' }}>{t('contact.tehranLabel')}</strong><span>{t('contact.tehranAddress')}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '22px max(28px, calc((100vw - 1180px) / 2))', color: 'var(--gold)', borderRight: '1px solid rgba(255,255,255,.08)' }}>
          <Icon name="mapPin" size={24} />
          <div style={{ display: 'grid', gap: 3, color: 'rgba(255,255,255,.68)', lineHeight: 1.85 }}><strong style={{ color: '#fff' }}>{t('contact.mazandaranLabel')}</strong><span>{t('contact.mazandaranAddress')}</span></div>
        </div>
      </section>
    </PageLayout>
  );
}
