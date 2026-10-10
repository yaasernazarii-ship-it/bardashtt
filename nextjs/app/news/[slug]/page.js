import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { prisma } from '@/lib/prisma';
import { aparatEmbedUrl } from '@/lib/aparat';
import { decodeSlug } from '@/lib/slug';
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' });

async function findPost(rawKey) {
  const key = decodeSlug(rawKey);
  return prisma.post.findFirst({ where: { OR: [{ id: key }, { slug: key }] } });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return { title: 'مطلب یافت نشد' };
  const site = await siteUrl();
  const url = `${site}/news/${post.slug}`;
  const image = post.coverImage ? `${site}${post.coverImage}` : `${site}/imgg.png`;
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    // برای مطلبِ برداشته‌شده، نسخهٔ اصلی در سایت منبع است.
    alternates: { canonical: post.sourceUrl || url },
    robots: post.sourceUrl ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      url,
      images: [{ url: image }],
      publishedTime: new Date(post.createdAt).toISOString(),
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.metaDescription || post.excerpt || undefined },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post || !post.published) notFound();
  // خبری که از سایت دیگری برداشته شده هیچ‌وقت داخل سایت ما باز نمی‌شود؛
  // حتی ورود مستقیم به این نشانی هم به سایت منبع فرستاده می‌شود.
  if (post.sourceUrl) redirect(post.sourceUrl);

  const embed = aparatEmbedUrl(post.aparatUrl);
  const galleryImages = String(post.images || '').split('\n').map((url) => url.trim()).filter(Boolean);
  const paragraphs = post.body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const site = await siteUrl();
  const url = `${site}/news/${post.slug}`;
  const image = post.coverImage ? `${site}${post.coverImage}` : `${site}/imgg.png`;

  const articleLd = articleJsonLd({
    title: post.title,
    description: post.metaDescription || post.excerpt,
    url,
    image,
    site,
    type: 'NewsArticle',
    isBasedOn: post.sourceReferenceUrl,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
  });
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'خانه', url: site },
    { name: 'اخبار و مطالب', url: `${site}/news` },
    { name: post.title },
  ]);

  const faqLd = Array.isArray(post.faq) && post.faq.length ? faqJsonLd([{ items: post.faq }]) : null;

  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(articleLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqLd)} />}
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">مطلب</div>
          <h1>{post.title}</h1>
          <p>{dateFmt.format(new Date(post.createdAt))}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › <Link href="/news">اخبار و مطالب</Link> › {post.title}</div>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container container--sm">
          <article className="post-article">
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="post-article__cover" src={post.coverImage} alt={post.imageAlt || post.title} loading="lazy" decoding="async" />
            )}
            {galleryImages.length > 0 && (
              <div className="post-article__gallery">
                {galleryImages.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`${url}-${index}`} src={url} alt={`${post.title} — عکس ${index + 1}`} loading="lazy" decoding="async" />
                ))}
              </div>
            )}
            {embed && (
              <div className="post-video">
                <iframe src={embed} title={post.title} allowFullScreen allow="autoplay; fullscreen" />
              </div>
            )}
            {post.audioUrl && (
              <audio src={post.audioUrl} controls preload="none" style={{ width: '100%', margin: '8px 0 20px' }} />
            )}
            {paragraphs.map((para, i) => (
              <p key={i} className="post-article__p">{para}</p>
            ))}
            {Array.isArray(post.faq) && post.faq.length > 0 && (
              <section><h2>پرسش‌های متداول</h2>{post.faq.map((item) => <div key={item.q}><h3>{item.q}</h3><p className="post-article__p">{item.a}</p></div>)}</section>
            )}
          </article>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/news" className="btn btn--ghost">← بازگشت به فهرست مطالب</Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
