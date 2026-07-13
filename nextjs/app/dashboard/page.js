import Link from 'next/link';

export const metadata = { title: 'داشبورد هنرجو | خانواده برداشت' };

export default function DashboardPage() {
  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <aside className="sidebar">
        <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>
        <ul className="sidebar-menu">
          <li><Link className="active" href="/dashboard">🏠 داشبورد</Link></li>
          <li><Link href="/courses">🎓 دوره‌ها</Link></li>
          <li><Link href="/certificate">📜 آزمون</Link></li>
          <li><Link href="/insurance">🛡 بیمه</Link></li>
          <li><Link href="/profile">👤 پروفایل</Link></li>
          <li className="sep">سایت</li>
          <li><Link href="/">بازگشت به سایت</Link></li>
        </ul>
      </aside>
      <main className="main-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <div><h1 className="heading">داشبورد هنرجو</h1><p style={{ color: 'var(--muted)' }}>خوش آمدید؛ وضعیت آموزشی شما اینجاست.</p></div>
          <Link href="/" className="btn btn--outline">بازگشت به سایت</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
          <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius)', padding: 24, color: '#fff' }}><div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.75rem', fontWeight: 700 }}>کلاس بعدی</div><h2 style={{ fontSize: '1.5rem', margin: '8px 0' }}>مقدماتی بازیگری</h2><p style={{ color: 'var(--gold-lt)' }}>شنبه · ساعت ۱۸:۰۰</p></div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}><h3 style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 12 }}>پیشرفت</h3><strong style={{ fontSize: '2rem', color: 'var(--dark)' }}>۴۵٪</strong><div className="progress-bar"><div className="progress-fill" style={{ width: '45%' }} /></div></div>
          {['تکالیف هفته', 'گواهینامه‌ها', 'پیام‌های پشتیبانی'].map(t => <div key={t} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}><h3 style={{ color: 'var(--dark)' }}>{t}</h3><p style={{ color: 'var(--muted)' }}>محتوای این بخش پس از ورود واقعی نمایش داده می‌شود.</p></div>)}
        </div>
      </main>
    </div>
  );
}
