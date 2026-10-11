import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CommunityFeed from '@/components/CommunityFeed';
import Icon from '@/components/Icon';
import { prisma } from '@/lib/prisma';
import { AUTHOR_SELECT, authorCard, handleOf, visibleWhere } from '@/lib/social';

export const dynamic = 'force-dynamic';

// پروفایل عمومیِ برداشتگرام. حساب کاملاً مستقل از حساب آموزشی سایت است؛
// فقط نام نمایشی، عکس و بیوی خودِ حساب برداشتگرام اینجا خوانده و نمایش داده می‌شود.
async function findAccount(handle) {
  return prisma.socialAccount.findFirst({
    where: { active: true, OR: [{ username: handle }, { id: handle }] },
    select: AUTHOR_SELECT,
  });
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const account = await findAccount(decodeURIComponent(handle));
  if (!account) return { title: 'کاربر یافت نشد' };
  const name = account.displayName || account.username || 'کاربر';
  return {
    title: `${name} — برداشتگرام`,
    description: `مطالب و کارهای ${name} در برداشتگرام خانواده برداشت.`,
    robots: { index: true, follow: true },
  };
}

export default async function CommunityProfilePage({ params }) {
  const { handle } = await params;
  const account = await findAccount(decodeURIComponent(handle));
  if (!account) notFound();

  const count = await prisma.socialPost.count({
    where: { authorId: account.id, kind: 'post', ...visibleWhere() },
  });
  const card = authorCard(account);

  return (
    <PageLayout>
      <div className="container container--sm" style={{ paddingTop: 110, paddingBottom: 60 }}>
        <div className="breadcrumb" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link> › <Link href="/community">برداشتگرام</Link> › {card.name}
        </div>

        <header className="cm-profile">
          <span className="cm-avatar cm-avatar--xl">
            {account.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.photoUrl} alt={card.name} />
            ) : (
              <Icon name="user" size={44} />
            )}
          </span>
          <div>
            <h1>{card.name}</h1>
            <p className="cm-profile__role">{card.roleLabel}</p>
            {account.bio && <p className="cm-muted">{account.bio}</p>}
            <p className="cm-muted">{count.toLocaleString('fa-IR')} پست منتشرشده</p>
          </div>
        </header>

        <CommunityFeed handle={handleOf(account)} showStories={false} />
      </div>
    </PageLayout>
  );
}
