import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import { loadContent, splitLines } from '@/lib/siteContent';
import { BLOG_CATEGORIES } from '@/lib/blogCategories';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('blog');
}

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('blog.title')} subtitle={t('blog.subtitle')} tag={t('blog.tag')} slides={splitLines(t('blog.slides'))}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {BLOG_CATEGORIES.map((c) => (
          <Link key={c.value} href={`/blog/category/${c.value}`} className="pay-chip">{c.label}</Link>
        ))}
      </div>
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
      <SectionPosts section="blog" variant="article" hrefBase="/blog" />
    </SimplePage>
  );
}
