import Link from 'next/link';
import { livePosts } from '@/lib/content';
import { aparatEmbedUrl } from '@/lib/aparat';
import { blogCategoryLabel } from '@/lib/blogCategories';
import { sourceHost } from '@/lib/sourceLink';
import Icon from './Icon';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' });

// نمایش محتوای زندهٔ یک بخش به‌صورت شبکه‌ای از کارت‌ها.
// variant='media'   → عکس/ویدیو به‌صورت درجا داخل کارت پخش می‌شود (آثار، گالری، فروش دوره).
// variant='article' → کارت به صفحهٔ جزئیات لینک می‌شود (اخبار، وبلاگ).
export default async function SectionPosts({ section, variant = 'media', hrefBase, heading, empty = null, category }) {
  const posts = await livePosts(section, { category });
  if (posts.length === 0) return empty;

  return (
    <div style={{ marginBottom: 8 }}>
      {heading && <h2 className="subheading" style={{ margin: '4px 0 16px' }}>{heading}</h2>}
      <div className="post-list">
        {posts.map((p) => {
          const embed = variant === 'media' ? aparatEmbedUrl(p.aparatUrl) : null;
          const card = (
            <>
              {embed ? (
                <div className="post-card__video">
                  <iframe src={embed} title={p.title} allowFullScreen allow="autoplay; fullscreen" />
                </div>
              ) : p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="post-card__cover" src={p.coverImage} alt={p.title} loading="lazy" />
              ) : null}
              <div className="post-card__body">
                <h3 className="post-card__title">{p.title}</h3>
                {p.excerpt && <p className="post-card__excerpt">{p.excerpt}</p>}
                <div className="post-card__meta">
                  <span>{dateFmt.format(new Date(p.publishAt || p.createdAt))}</span>
                  {p.category && section === 'blog' && <span>{blogCategoryLabel(p.category)}</span>}
                  {p.aparatUrl && <span className="meta-ico"><Icon name="clapperboard" size={14} /> ویدیو</span>}
                  {variant === 'article' && p.sourceUrl && <span className="meta-ico"><Icon name="link" size={14} /> {sourceHost(p.sourceUrl)}</span>}
                </div>
              </div>
            </>
          );

          // مطلبی که از سایت دیگری برداشته شده مستقیم به همان سایت می‌رود، نه صفحهٔ داخلی.
          return variant === 'article' && p.sourceUrl ? (
            <a key={p.id} href={p.sourceUrl} className="post-card" target="_blank" rel="noopener noreferrer nofollow">{card}</a>
          ) : variant === 'article' && hrefBase ? (
            <Link key={p.id} href={`${hrefBase}/${p.slug}`} className="post-card">{card}</Link>
          ) : (
            <div key={p.id} className="post-card">{card}</div>
          );
        })}
      </div>
    </div>
  );
}
