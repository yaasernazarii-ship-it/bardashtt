import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SimplePage from '@/components/SimplePage';

export const metadata = {
  title: 'بانک بازیگران',
  description: 'فهرست رزومه بازیگران خانواده برداشت برای فیلم‌سازان و کارگردانان.',
  alternates: { canonical: 'https://www.bardashtt.com/actors' },
};

export const dynamic = 'force-dynamic';

export default async function ActorsPage() {
  const actors = await prisma.actorResume.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, fullName: true, headline: true, city: true, photoUrl: true, gender: true },
  });

  return (
    <SimplePage title="بانک بازیگران" subtitle="رزومه بازیگران خانواده برداشت؛ ویژه فیلم‌سازان و کارگردانان" tag="بازیگران" cta={false}>
      {actors.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز رزومه‌ای برای نمایش عمومی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="responsive-grid-3">
          {actors.map((a) => (
            <Link key={a.id} href={`/actors/${a.id}`} className="content-card actor-card">
              <div className="actor-photo" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})` } : undefined}>
                {!a.photoUrl && <span>{a.gender === 'female' ? '👩‍🎤' : '🎭'}</span>}
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
