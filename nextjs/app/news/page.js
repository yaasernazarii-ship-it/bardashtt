import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import { livePosts } from '@/lib/content';

export const metadata = {
  title: 'اخبار و مطالب',
  description: 'آخرین اخبار، مطالب و ویدیوهای خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/news' },
};
export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function NewsPage() {
  const posts = await livePosts('news');

  return (
    <SimplePage title="اخبار و مطالب" subtitle="آخرین اخبار، مطالب و ویدیوهای خانواده برداشت" tag="مطالب">
      {posts.length === 0 ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز مطلبی منتشر نشده است.</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((p) => (
            <Link key={p.id} href={`/news/${p.slug}`} className="post-card">
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SimplePage>
  );
}
