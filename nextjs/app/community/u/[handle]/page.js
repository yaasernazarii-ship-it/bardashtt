import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CommunityFeed from '@/components/CommunityFeed';
import Icon from '@/components/Icon';
import { prisma } from '@/lib/prisma';
import { AUTHOR_SELECT, handleOf, roleLabel, visibleWhere } from '@/lib/social';

export const dynamic = 'force-dynamic';

// پروفایل عمومیِ شبکهٔ اجتماعی. عمداً فقط به حساب کاربری وصل است:
// نام نمایشی، عکس حساب و مطالبِ منتشرشده. هیچ فیلدی از رزومهٔ بازیگری،
// شماره تماس، کد ملی یا کلاسِ کاربر اینجا خوانده و نمایش داده نمی‌شود.
async function findUser(handle) {
  return prisma.user.findFirst({
    where: { active: true, OR: [{ username: handle }, { id: handle }] },
    select: AUTHOR_SELECT,
  });
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const user = await findUser(decodeURIComponent(handle));
  if (!user) return { title: 'کاربر یافت نشد' };
  const name = user.displayName || user.username || 'کاربر';
  return {
    title: `${name} — برداشتگرام`,
    description: `مطالب و کارهای ${name} در برداشتگرام خانواده برداشت.`,
    robots: { index: true, follow: true },
  };
}

export default async function CommunityProfilePage({ params }) {
  const { handle } = await params;
  const user = await findUser(decodeURIComponent(handle));
  if (!user) notFound();

  const count = await prisma.socialPost.count({
    where: { authorId: user.id, kind: 'post', ...visibleWhere() },
  });
  const name = user.displayName || user.username || 'کاربر';

  return (
    <PageLayout>
      <div className="container container--sm" style={{ paddingTop: 110, paddingBottom: 60 }}>
        <div className="breadcrumb" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link> › <Link href="/community">برداشتگرام</Link> › {name}
        </div>

        <header className="cm-profile">
          <span className="cm-avatar cm-avatar--xl">
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt={name} />
            ) : (
              <Icon name="user" size={44} />
            )}
          </span>
          <div>
            <h1>{name}</h1>
            <p className="cm-profile__role">{roleLabel(user)}</p>
            <p className="cm-muted">{count.toLocaleString('fa-IR')} پست منتشرشده</p>
          </div>
        </header>

        <CommunityFeed handle={handleOf(user)} showStories={false} />
      </div>
    </PageLayout>
  );
}
