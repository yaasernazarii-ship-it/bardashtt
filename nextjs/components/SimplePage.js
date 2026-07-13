import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

export default function SimplePage({ title, subtitle, tag = 'خانواده برداشت', children, cta = true }) {
  return (
    <PageLayout>
      <div className="page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="breadcrumb"><Link href="/">خانه</Link> › {title}</div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container container--sm">
          <span className="tag tag--gold" style={{ marginBottom: 20 }}>{tag}</span>
          {children}
          {cta && (
            <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius-lg)', padding: 36, textAlign: 'center', marginTop: 40 }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, marginBottom: 10 }}>برای شروع آماده‌اید؟</h3>
              <p style={{ color: 'rgba(255,255,255,.6)', marginBottom: 24 }}>ثبت‌نام در خانواده برداشت کاملاً رایگان است.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/audition" className="btn btn--gold">ثبت‌نام در کلاس‌ها</Link>
                <a href="tel:02191090934" className="btn btn--outline" style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff' }}>تماس مستقیم</a>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
