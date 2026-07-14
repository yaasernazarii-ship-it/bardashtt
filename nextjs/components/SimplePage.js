import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

export default function SimplePage({ title, subtitle, tag = 'خانواده برداشت', children, cta = true, narrow = false }) {
  return (
    <PageLayout>
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
              <h3>برای شروع آماده‌اید؟</h3>
              <p>اگر می‌خواهید مسیر بازیگری را حرفه‌ای و بدون مانع مالی شروع کنید، همین حالا ثبت‌نام را آغاز کنید.</p>
              <div className="cta-card__actions">
                <Link href="/register" className="btn btn--gold">ثبت‌نام در کلاس‌ها</Link>
                <a href="tel:02191090934" className="btn btn--hero-secondary">تماس مستقیم</a>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
