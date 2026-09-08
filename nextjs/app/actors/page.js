import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isFilmmakerOrManager } from '@/lib/auth';
import SimplePage from '@/components/SimplePage';
import ActorsBank from '@/components/ActorsBank';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('actors');
}

export const dynamic = 'force-dynamic';

export default async function ActorsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/actors');
  // بانک بازیگران فقط ویژه‌ی فیلم‌سازان و ادمین/ادیتور است؛ هنرجو و عضو عادی دسترسی ندارند.
  if (!isFilmmakerOrManager(user)) redirect('/dashboard');

  const [rows, shortlist, t] = await Promise.all([
    prisma.actorResume.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, fullName: true, headline: true, city: true,
        gender: true, birthYear: true, age: true, heightCm: true, skills: true,
        experience: true, showreelUrl: true,
        photos: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
        _count: { select: { videos: true } },
      },
    }),
    prisma.actorShortlist.findMany({ where: { userId: user.id }, select: { actorId: true } }),
    loadContent(),
  ]);

  // کارت بازیگر فقط به عکس اصلی و «داشتنِ ویدیو» نیاز دارد، نه به کل رسانه‌های رزومه.
  const actors = rows.map(({ photos, _count, ...rest }) => ({
    ...rest,
    photoUrl: photos[0]?.url || null,
    hasVideo: _count.videos > 0,
  }));

  return (
    <SimplePage title={t('actors.title')} subtitle={t('actors.subtitle')} tag={t('actors.tag')} cta={false} slides={splitLines(t('actors.slides'))}>
      <ActorsBank actors={actors} shortlistIds={shortlist.map((s) => s.actorId)} emptyText={t('actors.empty')} />
    </SimplePage>
  );
}
