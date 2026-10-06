import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import HomeHeroBg from '@/components/HomeHeroBg';
import Icon from '@/components/Icon';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('home');
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await loadContent();
  // اسلایدهای هدر از فیلد چند‌عکسی خوانده می‌شوند؛ اگر خالی بود، به عکس پس‌زمینهٔ تکی برمی‌گردیم.
  const heroSlides = splitLines(t('home.hero.slides'));
  const heroImages = heroSlides.length ? heroSlides : [t('home.hero.bgImage')].filter(Boolean);
  return (
    <PageLayout>
      {/* Hero */}
      <section id="hero" className="home-hero">
        <HomeHeroBg images={heroImages} />
        <div className="container home-hero__inner home-hero__inner--center">
          <div className="home-hero__eyebrow">
            <span /> {t('home.hero.eyebrow')}
          </div>
          <h1 className="home-hero__slogan">
            {t('home.hero.title')}
          </h1>
        </div>
      </section>

      {/* دکمه‌های اقدام — زیر عکس، تا روی عکس را نپوشانند */}
      <div className="home-hero-actions">
        <div className="container home-hero-actions__inner">
          <Link href="/courses" className="btn btn--gold btn--sm">{t('home.hero.ctaPrimary')}</Link>
          <Link href="/about" className="btn btn--hero-secondary btn--sm">{t('home.hero.ctaSecondary')}</Link>
        </div>
      </div>

      {/* داستان ما */}
      <section id="story" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="story-text">
            <span className="tag tag--gold">{t('about.story.eyebrow')}</span>
            <h2 className="heading" style={{ marginTop: 16 }}>{t('about.story.heading')}</h2>
            <div className="line" />
            <p className="body-lg" style={{ marginBottom: 20 }}>
              {t('about.story.intro')}<br />
              <strong>{t('about.story.lead')}</strong>
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 16 }}>
              {t('about.story.p1')}
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 16 }}>
              {t('about.story.p2')}
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9 }}>
              {t('about.story.p3')}
            </p>
          </div>
        </div>
      </section>

      <section className="seo-intro" aria-labelledby="seo-intro-title">
        <div className="container">
          <h2 id="seo-intro-title" className="heading">{t('home.seo.heading')}</h2>
          <p className="body-lg">{t('home.seo.text')}</p>
        </div>
      </section>

      {/* آمار */}
      <section id="stats" style={{ background: 'var(--dark)', padding: '36px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, textAlign: 'center' }}>
            {[[t('about.stat1.num'),t('about.stat1.label')],[t('about.stat2.num'),t('about.stat2.label')],[t('about.stat3.num'),t('about.stat3.label')],[t('about.stat4.num'),t('about.stat4.label')]].map(([n,l]) => (
              <div key={l} style={{ padding: '16px 8px', borderLeft: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: 'clamp(1.15rem,2.2vw,1.6rem)', fontWeight: 900, color: 'var(--gold)', lineHeight: 1, marginBottom: 6 }}>{n}</div>
                <p style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', letterSpacing: '.03em' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* تماس */}
      <div id="contact" className="contact-row">
        <a className="contact-cell" href={`tel:${t('contact.phone')}`} aria-label={`تماس با شماره ${t('contact.phone')}`}>
          <div className="ico"><Icon name="phone" size={26} /></div>
          <div className="lbl">تماس مستقیم</div>
          <span className="contact-value">{t('contact.phone')}</span>
        </a>
        <a className="contact-cell" href={t('contact.instagramUrl')} target="_blank" rel="noopener noreferrer" aria-label="مشاهده صفحه اینستاگرام">
          <div className="ico"><Icon name="instagram" size={26} /></div>
          <div className="lbl">اینستاگرام</div>
          <span className="contact-value">{t('contact.instagram')}</span>
        </a>
        <a className="contact-cell" href={t('contact.baleUrl')} target="_blank" rel="noopener noreferrer" aria-label="مشاهده کانال بله">
          <div className="ico"><Icon name="chat" size={26} /></div>
          <div className="lbl">کانال بله</div>
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
          <div style={{ display: 'grid', gap: 3, color: 'rgba(255,255,255,.68)', lineHeight: 1.85 }}><strong style={{ color: '#fff' }}>شعبهٔ تهران</strong><span>{t('contact.tehranAddress')}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '22px max(28px, calc((100vw - 1180px) / 2))', color: 'var(--gold)', borderRight: '1px solid rgba(255,255,255,.08)' }}>
          <Icon name="mapPin" size={24} />
          <div style={{ display: 'grid', gap: 3, color: 'rgba(255,255,255,.68)', lineHeight: 1.85 }}><strong style={{ color: '#fff' }}>شعبهٔ مازندران</strong><span>{t('contact.mazandaranAddress')}</span></div>
        </div>
      </section>
    </PageLayout>
  );
}
