import SimplePage from '@/components/SimplePage';
import { loadContent } from '@/lib/siteContent';

export const metadata = { title: 'پادکست', description: 'پادکست‌های آموزشی و گفتگوهای سینمایی خانواده برداشت.' };

export const dynamic = 'force-dynamic';

export default async function PodcastPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('podcast.title')} subtitle={t('podcast.subtitle')} tag={t('podcast.tag')}>
      <div style={{ display: 'grid', gap: 16 }}>
        {['مقدمات بازیگری', 'تمرین تمرکز', 'تجربه تست بازیگری'].map((ep, i) => (
          <div key={ep} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ color: 'var(--dark)', fontSize: '1.1rem', marginBottom: 14 }}>{ep}</h2>
            <div style={{ height: 46, borderRadius: 100, background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--muted)' }}>▶ قسمت {i + 1}</div>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
