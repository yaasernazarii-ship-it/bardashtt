import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'وبلاگ', description: 'مطالب آموزشی و تحلیلی درباره بازیگری و سینما.' };

export default function BlogPage() {
  const posts = [
    ['چطور برای تست بازیگری آماده شویم؟', 'راهنمای کوتاه برای اولین تجربه تست بازیگری.'],
    ['اهمیت بیان در بازیگری', 'چرا کنترل صدا و تنفس برای بازیگر حیاتی است؟'],
    ['بازی مقابل دوربین با بازی روی صحنه چه تفاوتی دارد؟', 'نگاهی کاربردی به تفاوت‌های اجرایی.'],
  ];
  return (
    <SimplePage title="وبلاگ" subtitle="مطالب آموزشی درباره بازیگری و سینما" tag="مطالب آموزشی">
      <div style={{ display: 'grid', gap: 16 }}>
        {posts.map(([t, d]) => (
          <article key={t} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>{t}</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{d}</p>
          </article>
        ))}
      </div>
    </SimplePage>
  );
}
