import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import PageSlider from '@/components/PageSlider';
import { loadContent } from '@/lib/siteContent';

export default async function SimplePage({ title, subtitle, tag = 'خانواده برداشت', children, cta = true, narrow = false, slides = [] }) {
  const t = await loadContent();
  const heroSlides = (slides || []).filter(Boolean);
  return (
    <PageLayout>
      {heroSlides.length > 0 && (
        <PageSlider title={title} images={heroSlides} />
      )}
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{tag}</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › {title}</div>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className={narrow ? 'container container--sm' : 'container'}>
          {children}
          {cta && (
            <div className="cta-card">
              <h3>{t('common.cta.heading')}</h3>
              <p>{t('common.cta.text')}</p>
              <div className="cta-card__actions">
                <Link href="/courses" className="btn btn--gold">{t('common.cta.primary')}</Link>
                <a href={`tel:${t('contact.phone')}`} className="btn btn--hero-secondary">{t('common.cta.secondary')}</a>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
