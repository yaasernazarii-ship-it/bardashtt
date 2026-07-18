import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { prisma } from '@/lib/prisma';
import { aparatEmbedUrl } from '@/lib/aparat';

export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

async function findPost(key) {
  return prisma.post.findFirst({ where: { OR: [{ id: key }, { slug: key }] } });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return { title: 'مطلب یافت نشد' };
  return { title: post.title, description: post.excerpt || undefined };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post || !post.published) notFound();

  const embed = aparatEmbedUrl(post.aparatUrl);
  const paragraphs = post.body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <PageLayout>
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
              <img className="post-article__cover" src={post.coverImage} alt={post.title} />
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
