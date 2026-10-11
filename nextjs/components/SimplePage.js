import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import PageSlider from '@/components/PageSlider';

export default async function SimplePage({ title, subtitle, tag = 'خانواده برداشت', children, narrow = false, slides = [], sectionClassName = '' }) {
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
      <section className={sectionClassName} style={{ background: 'var(--bg)' }}>
        <div className={narrow ? 'container container--sm' : 'container'}>
          {children}
        </div>
      </section>
    </PageLayout>
  );
}
