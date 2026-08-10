import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Icon from '@/components/Icon';
import { loadContent } from '@/lib/siteContent';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'نتیجهٔ پرداخت | خانوادهٔ برداشت',
  robots: { index: false, follow: false },
};

// عنوان و متن هر حالت از پنل («متن صفحات» ← «صفحهٔ نتیجهٔ پرداخت») می‌آید؛
// آیکون و رنگ ثابت می‌مانند تا معنای بصری موفق/ناموفق دست‌نخورده بماند.
const TONES = {
  success: { icon: 'check', tone: 'success' },
  canceled: { icon: 'alertTriangle', tone: 'error' },
  failed: { icon: 'xCircle', tone: 'error' },
};

export default async function PaymentResultPage({ searchParams }) {
  const sp = await searchParams;
  const status = TONES[sp?.status] ? sp.status : 'failed';
  const t = await loadContent();
  const r = { ...TONES[status], title: t(`payment.${status}.title`), desc: t(`payment.${status}.desc`) };
  const ref = sp?.ref ? String(sp.ref) : '';

  return (
    <PageLayout>
      <div className="page-header"><h1>{t('payment.header')}</h1></div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container--sm">
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <div className={`pay-result__ico pay-result__ico--${r.tone}`}><Icon name={r.icon} size={40} strokeWidth={1.6} /></div>
            <h3 style={{ marginBottom: 12 }}>{r.title}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 2, marginBottom: 20 }}>{r.desc}</p>
            {status === 'success' && ref && (
              <div className="alert alert--info" style={{ marginBottom: 20 }} dir="ltr">
                {t('payment.refLabel')}: {ref}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn--dark" href="/dashboard">{t('payment.btn.dashboard')}</Link>
              <Link className="btn" href="/">{t('payment.btn.home')}</Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
