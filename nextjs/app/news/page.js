import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { livePosts } from '@/lib/content';
import { loadContent, splitLines } from '@/lib/siteContent';
import { sourceHost } from '@/lib/sourceLink';

export const metadata = {
  title: 'اخبار و مطالب',
  description: 'آخرین اخبار، مطالب و ویدیوهای خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/news' },
};
export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function NewsPage() {
  const [posts, t] = await Promise.all([livePosts('news'), loadContent()]);

  return (
    <SimplePage title={t('news.title')} subtitle={t('news.subtitle')} tag={t('news.tag')} slides={splitLines(t('news.slides'))}>
      {posts.length === 0 ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>{t('news.empty')}</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((p) => {
            const card = (
              <>
                {p.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="post-card__cover" src={p.coverImage} alt={p.title} loading="lazy" />
                )}
                <div className="post-card__body">
                  <h2 className="post-card__title">{p.title}</h2>
                  {p.excerpt && <p className="post-card__excerpt">{p.excerpt}</p>}
                  <div className="post-card__meta">
                    <span>{dateFmt.format(new Date(p.createdAt))}</span>
                    {p.aparatUrl && <span>🎬 ویدیو</span>}
                    {p.sourceUrl && <span>🔗 {sourceHost(p.sourceUrl)}</span>}
                  </div>
                </div>
              </>
            );
            // خبرهایی که از سایت دیگری برداشته شده‌اند مستقیم به همان سایت می‌روند، نه صفحهٔ داخلی.
            return p.sourceUrl ? (
              <a key={p.id} href={p.sourceUrl} className="post-card" target="_blank" rel="noopener noreferrer nofollow">{card}</a>
            ) : (
              <Link key={p.id} href={`/news/${p.slug}`} className="post-card">{card}</Link>
            );
          })}
        </div>
      )}
    </SimplePage>
  );
}
