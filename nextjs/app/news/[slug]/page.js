import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { prisma } from '@/lib/prisma';
import { aparatEmbedUrl } from '@/lib/aparat';
import { SITE_URL, DEFAULT_IMAGE, articleJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' });

async function findPost(key) {
  return prisma.post.findFirst({ where: { OR: [{ id: key }, { slug: key }] } });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return { title: 'مطلب یافت نشد' };
  const url = `${SITE_URL}/news/${post.slug}`;
  const image = post.coverImage ? `${SITE_URL}${post.coverImage}` : DEFAULT_IMAGE;
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt || undefined,
      url,
      images: [{ url: image }],
      publishedTime: new Date(post.createdAt).toISOString(),
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt || undefined },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post || !post.published) notFound();

  const embed = aparatEmbedUrl(post.aparatUrl);
  const paragraphs = post.body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const url = `${SITE_URL}/news/${post.slug}`;
  const image = post.coverImage ? `${SITE_URL}${post.coverImage}` : undefined;

  const articleLd = articleJsonLd({
    title: post.title,
    description: post.excerpt,
    url,
    image,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
  });
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'خانه', url: SITE_URL },
    { name: 'اخبار و مطالب', url: `${SITE_URL}/news` },
    { name: post.title },
  ]);

  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(articleLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
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
              <img className="post-article__cover" src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
            )}
            {embed && (
              <div className="post-video">
                <iframe src={embed} title={post.title} allowFullScreen allow="autoplay; fullscreen" />
              </div>
            )}
            {paragraphs.map((para, i) => (
              <p key={i} className="post-article__p">{para}</p>
            ))}
          </article>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/news" className="btn btn--ghost">← بازگشت به فهرست مطالب</Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
