import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isFilmmakerOrManager } from '@/lib/auth';
import SimplePage from '@/components/SimplePage';
import Icon from '@/components/Icon';
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

  const [actors, t] = await Promise.all([
    prisma.actorResume.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, fullName: true, headline: true, city: true, photoUrl: true, gender: true },
    }),
    loadContent(),
  ]);

  return (
    <SimplePage title={t('actors.title')} subtitle={t('actors.subtitle')} tag={t('actors.tag')} cta={false} slides={splitLines(t('actors.slides'))}>
      {actors.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>{t('actors.empty')}</p>
        </div>
      ) : (
        <div className="responsive-grid-3">
          {actors.map((a) => (
            <Link key={a.id} href={`/actors/${a.id}`} className="content-card actor-card">
              <div className="actor-photo" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})` } : undefined}>
                {!a.photoUrl && <Icon name="masks" size={40} strokeWidth={1.4} />}
              </div>
              <h3 style={{ margin: '12px 0 4px' }}>{a.fullName}</h3>
              {a.headline && <p style={{ color: 'var(--muted)', margin: 0 }}>{a.headline}</p>}
              {a.city && <span className="tag tag--gold" style={{ marginTop: 10, alignSelf: 'flex-start' }}>{a.city}</span>}
            </Link>
          ))}
        </div>
      )}
    </SimplePage>
  );
}
