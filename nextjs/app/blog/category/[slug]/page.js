import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import SectionPosts from '@/components/SectionPosts';
import { BLOG_CATEGORIES } from '@/lib/blogCategories';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = BLOG_CATEGORIES.find((c) => c.value === slug);
  if (!category) return { title: 'دسته یافت نشد' };
  const site = await siteUrl();
  const url = `${site}/blog/category/${category.value}`;
  const title = `${category.label} | مقاله‌های خانواده برداشت`;
  const description = `مطالب آموزشی و تحلیلی دربارهٔ ${category.label} — مقاله‌های خانواده برداشت.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url },
    twitter: { card: 'summary', title, description },
  };
}

export default async function BlogCategoryPage({ params }) {
  const { slug } = await params;
  const category = BLOG_CATEGORIES.find((c) => c.value === slug);
  if (!category) notFound();

  const site = await siteUrl();
  const url = `${site}/blog/category/${category.value}`;
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'خانه', url: site },
    { name: 'مقاله‌ها', url: `${site}/blog` },
    { name: category.label, url },
  ]);

  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">مقاله‌ها</div>
          <h1>{category.label}</h1>
          <p>مطالب آموزشی و تحلیلی دربارهٔ {category.label}</p>
          <div className="breadcrumb">
            <Link href="/">خانه</Link> › <Link href="/blog">مقاله‌ها</Link> › {category.label}
          </div>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {BLOG_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/blog/category/${c.value}`}
                className={`pay-chip${c.value === category.value ? ' is-active' : ''}`}
              >
                {c.label}
              </Link>
            ))}
          </div>
          <SectionPosts
            section="blog"
            category={category.value}
            variant="article"
            hrefBase="/blog"
            empty={<p style={{ color: 'var(--muted)' }}>هنوز مطلبی در دستهٔ «{category.label}» منتشر نشده است.</p>}
          />
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/blog" className="btn btn--ghost">← بازگشت به همهٔ مقاله‌ها</Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
