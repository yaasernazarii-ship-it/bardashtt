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

  const [actors, shortlist, t] = await Promise.all([
    prisma.actorResume.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, fullName: true, headline: true, city: true, photoUrl: true,
        gender: true, birthYear: true, heightCm: true, skills: true,
        experience: true, selfVideoUrl: true, showreelUrl: true,
      },
    }),
    prisma.actorShortlist.findMany({ where: { userId: user.id }, select: { actorId: true } }),
    loadContent(),
  ]);

  return (
    <SimplePage title={t('actors.title')} subtitle={t('actors.subtitle')} tag={t('actors.tag')} cta={false} slides={splitLines(t('actors.slides'))}>
      <ActorsBank actors={actors} shortlistIds={shortlist.map((s) => s.actorId)} emptyText={t('actors.empty')} />
    </SimplePage>
  );
}
