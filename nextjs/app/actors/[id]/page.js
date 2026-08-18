import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isFilmmakerOrManager } from '@/lib/auth';
import SimplePage from '@/components/SimplePage';
import Icon from '@/components/Icon';
import ActorBooking from '@/components/ActorBooking';
import ShortlistButton from '@/components/ShortlistButton';
import { embedSrc } from '@/lib/embed';
import { siteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const GENDER = { male: 'آقا', female: 'خانم' };

export async function generateMetadata({ params }) {
  const { id } = await params;
  const actor = await prisma.actorResume.findFirst({ where: { id, isPublic: true }, select: { fullName: true, headline: true } });
  if (!actor) return { title: 'بازیگر یافت نشد' };
  return {
    title: `${actor.fullName} | بانک بازیگران`,
    description: actor.headline || `رزومه بازیگری ${actor.fullName} در خانواده برداشت.`,
    alternates: { canonical: `${await siteUrl()}/actors/${id}` },
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

  const inShortlist = !!(await prisma.actorShortlist.findUnique({
    where: { userId_actorId: { userId: user.id, actorId: a.id } },
    select: { id: true },
  }));

  const skills = a.skills ? a.skills.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : [];
  const introSrc = embedSrc(a.selfVideoUrl);

  return (
    <SimplePage title={a.fullName} subtitle={a.headline || 'رزومه بازیگری'} tag="بازیگران" cta={false}>
      <div style={{ marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/actors" className="btn btn--outline btn--sm">→ بازگشت به فهرست</Link>
        <ShortlistButton actorId={a.id} initial={inShortlist} />
      </div>
      <div className="actor-detail">
        <div className="actor-detail__photo" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})` } : undefined}>
          {!a.photoUrl && <Icon name="masks" size={56} strokeWidth={1.3} />}
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
          {introSrc && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 10 }} className="icon-inline"><Icon name="video" size={18} /> ویدیوی معرفی</h3>
              <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 'var(--radius)', overflow: 'hidden', background: '#000' }}>
                <iframe
                  src={introSrc}
                  title={`ویدیوی معرفی ${a.fullName}`}
                  allowFullScreen
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
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
