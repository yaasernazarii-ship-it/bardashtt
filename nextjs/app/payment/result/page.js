import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

export const metadata = {
  title: 'نتیجهٔ پرداخت | خانوادهٔ برداشت',
  robots: { index: false, follow: false },
};

const RESULTS = {
  success: {
    icon: '✅',
    title: 'با موفقیت انجام شد',
    desc: 'پرداختِ شما با موفقیت ثبت شد. از همراهی و اعتمادتان سپاسگزاریم؛ دسترسی‌ها و امکاناتِ مربوط همین حالا برای شما فعال شد. مسیرِ درخشیدن‌تان را از صمیم قلب آرزو می‌کنیم.',
    tone: 'success',
  },
  canceled: {
    icon: '⚠️',
    title: 'پرداخت انجام نشد',
    desc: 'به‌نظر می‌رسد پرداخت لغو شد یا کامل نشد. مبلغی از حساب شما کسر نشده است. در صورت تمایل می‌توانید دوباره تلاش کنید.',
    tone: 'error',
  },
  failed: {
    icon: '❌',
    title: 'پرداخت ناموفق بود',
    desc: 'تأییدِ پرداخت ممکن نشد. اگر مبلغی از حساب شما کسر شده، طیِ ۷۲ ساعت به‌صورت خودکار بازمی‌گردد. برای پیگیری با پشتیبانی هماهنگ کنید.',
    tone: 'error',
  },
};

export default async function PaymentResultPage({ searchParams }) {
  const sp = await searchParams;
  const status = RESULTS[sp?.status] ? sp.status : 'failed';
  const r = RESULTS[status];
  const ref = sp?.ref ? String(sp.ref) : '';

  return (
    <PageLayout>
      <div className="page-header"><h1>نتیجهٔ پرداخت</h1></div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container--sm">
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">{r.icon}</div>
            <h3 style={{ marginBottom: 12 }}>{r.title}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 2, marginBottom: 20 }}>{r.desc}</p>
            {status === 'success' && ref && (
              <div className="alert alert--info" style={{ marginBottom: 20 }} dir="ltr">
                کد پیگیری: {ref}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn--dark" href="/dashboard">داشبورد من</Link>
              <Link className="btn" href="/">صفحهٔ اصلی</Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
