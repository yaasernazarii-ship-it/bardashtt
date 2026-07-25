import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isFilmmakerOrManager } from '@/lib/auth';
import SimplePage from '@/components/SimplePage';
import ActorBooking from '@/components/ActorBooking';

export const dynamic = 'force-dynamic';

const GENDER = { male: 'آقا', female: 'خانم' };

export async function generateMetadata({ params }) {
  const { id } = await params;
  const actor = await prisma.actorResume.findFirst({ where: { id, isPublic: true }, select: { fullName: true, headline: true } });
  if (!actor) return { title: 'بازیگر یافت نشد' };
  return {
    title: `${actor.fullName} | بانک بازیگران`,
    description: actor.headline || `رزومه بازیگری ${actor.fullName} در خانواده برداشت.`,
    alternates: { canonical: `https://www.bardashtt.com/actors/${id}` },
  };
}

export default async function ActorDetailPage({ params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/auth?next=/actors/${id}`);
  // بانک بازیگران فقط ویژه‌ی فیلم‌سازان و ادمین/ادیتور است؛ هنرجو و عضو عادی دسترسی ندارند.
  if (!isFilmmakerOrManager(user)) redirect('/dashboard');

  const a = await prisma.actorResume.findFirst({ where: { id, isPublic: true } });
  if (!a) notFound();

  const skills = a.skills ? a.skills.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : [];

  return (
    <SimplePage title={a.fullName} subtitle={a.headline || 'رزومه بازیگری'} tag="بازیگران" cta={false}>
      <div style={{ marginBottom: 18 }}>
        <Link href="/actors" className="btn btn--outline btn--sm">→ بازگشت به فهرست</Link>
      </div>
      <div className="actor-detail">
        <div className="actor-detail__photo" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})` } : undefined}>
          {!a.photoUrl && <span>{a.gender === 'female' ? '👩‍🎤' : '🎭'}</span>}
        </div>
        <div className="actor-detail__body">
          {a.bio && <p className="body-lg">{a.bio}</p>}
          <ul className="actor-facts">
            {a.gender && <li><span>جنسیت</span><strong>{GENDER[a.gender]}</strong></li>}
            {a.city && <li><span>شهر</span><strong>{a.city}</strong></li>}
            {a.birthYear && <li><span>سال تولد</span><strong>{a.birthYear}</strong></li>}
            {a.heightCm && <li><span>قد</span><strong>{a.heightCm} سانتی‌متر</strong></li>}
          </ul>
          {skills.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 10 }}>مهارت‌ها</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map((s) => <span key={s} className="tag tag--gold">{s}</span>)}
              </div>
            </div>
          )}
          {a.experience && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 10 }}>سوابق و تجربه‌ها</h3>
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text)', lineHeight: 2 }}>{a.experience}</p>
            </div>
          )}
          {a.showreelUrl && (
            <div style={{ marginTop: 20 }}>
              <a href={a.showreelUrl} target="_blank" rel="noopener noreferrer" className="btn btn--dark">مشاهده نمونه‌کار</a>
            </div>
          )}
          <ActorBooking actorId={a.id} actorName={a.fullName} defaultName={user.displayName || ''} defaultPhone={user.phone || ''} />
        </div>
      </div>
    </SimplePage>
  );
}
