import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'پادکست', description: 'پادکست‌های آموزشی و گفتگوهای سینمایی خانواده برداشت.' };

export default function PodcastPage() {
  return (
    <SimplePage title="پادکست" subtitle="گفتگوها و آموزش‌های صوتی درباره بازیگری" tag="صوت">
      <div style={{ display: 'grid', gap: 16 }}>
        {['مقدمات بازیگری', 'تمرین تمرکز', 'تجربه تست بازیگری'].map((t, i) => (
          <div key={t} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ color: 'var(--dark)', fontSize: '1.1rem', marginBottom: 14 }}>{t}</h2>
            <div style={{ height: 46, borderRadius: 100, background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--muted)' }}>▶ قسمت {i + 1}</div>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
