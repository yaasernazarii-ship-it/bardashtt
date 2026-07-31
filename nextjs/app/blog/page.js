import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'وبلاگ',
  description: 'مطالب آموزشی و تحلیلی درباره بازیگری و سینما.',
  alternates: { canonical: 'https://www.bardashtt.com/blog' },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const t = await loadContent();
  const posts = [
    ['چطور برای تست بازیگری آماده شویم؟', 'راهنمای کوتاه برای اولین تجربه تست بازیگری.'],
    ['اهمیت بیان در بازیگری', 'چرا کنترل صدا و تنفس برای بازیگر حیاتی است؟'],
    ['بازی مقابل دوربین با بازی روی صحنه چه تفاوتی دارد؟', 'نگاهی کاربردی به تفاوت‌های اجرایی.'],
  ];
  return (
    <SimplePage title={t('blog.title')} subtitle={t('blog.subtitle')} tag={t('blog.tag')}>
      <div className="post-list" style={{ marginBottom: 20 }}>
        <Link href="/blog/amoozesh-bazigari-raygan-shoroe" className="post-card">
          <div className="post-card__body">
            <h2 className="post-card__title">آموزش بازیگری رایگان؛ از کجا شروع کنیم؟</h2>
            <p className="post-card__excerpt">
              راهنمای کامل و قدم‌به‌قدم ورود به دنیای بازیگری سینما برای علاقه‌مندانی که می‌خواهند بدون
              هزینه شروع کنند.
            </p>
          </div>
        </Link>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {posts.map(([ptitle, d]) => (
          <article key={ptitle} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>{ptitle}</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{d}</p>
          </article>
        ))}
      </div>
    </SimplePage>
  );
}
