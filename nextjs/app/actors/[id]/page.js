import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isFilmmakerOrManager } from '@/lib/auth';
import SimplePage from '@/components/SimplePage';
import Icon from '@/components/Icon';
import ActorBooking from '@/components/ActorBooking';
import ActorGallery from '@/components/ActorGallery';
import ShortlistButton from '@/components/ShortlistButton';
import { embedSrc } from '@/lib/embed';
import { siteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const GENDER = { male: 'آقا', female: 'خانم' };

// ویدیوی رزومه یا فایلِ آپلودشده روی خودِ سایت است یا امبدِ آپارات/ویو.
const isLocalVideo = (url) => /^\/media\//.test(url);

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
  const canShortlist = isFilmmakerOrManager(user);

  const a = await prisma.actorResume.findFirst({
    where: { id, isPublic: true },
    include: {
      photos: { where: { approvalStatus: 'approved' }, orderBy: { sortOrder: 'asc' } },
      user: { select: { photoUrl: true } },
      videos: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!a) notFound();

  const [inShortlist, fieldDefs] = await Promise.all([
    canShortlist ? prisma.actorShortlist.findUnique({
      where: { userId_actorId: { userId: user.id, actorId: a.id } },
      select: { id: true },
    }) : null,
    prisma.resumeFieldDef.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { key: true, label: true, type: true },
    }),
  ]);

  const skills = a.skills ? a.skills.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : [];

  // فقط فیلدهای سفارشیِ فعالی که برای این رزومه پر شده‌اند نمایش داده می‌شوند.
  const custom = fieldDefs
    .map((def) => ({ def, value: a.customValues?.[def.key] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '')
    .map(({ def, value }) => ({
      key: def.key,
      label: def.label,
      text: def.type === 'boolean' ? (value ? 'بله' : 'خیر') : String(value),
      long: def.type === 'textarea',
    }));

  return (
    <SimplePage title={a.fullName} subtitle={a.headline || 'رزومه بازیگری'} tag="بازیگران" cta={false}>
      <div style={{ marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/actors" className="btn btn--outline btn--sm">→ بازگشت به فهرست</Link>
        {canShortlist && <ShortlistButton actorId={a.id} initial={!!inShortlist} />}
      </div>
      <div className="actor-detail">
        <ActorGallery photos={a.user ? [...(a.user.photoUrl ? [{ id: 'account-photo', url: a.user.photoUrl, caption: 'عکس اصلی حساب کاربری' }] : []), ...a.photos] : a.photos} alt={a.fullName} gender={a.user ? a.gender : null} />
        <div className="actor-detail__body">
          {a.bio && <p className="body-lg">{a.bio}</p>}
          <ul className="actor-facts">
            {a.gender && <li><span>جنسیت</span><strong>{GENDER[a.gender]}</strong></li>}
            {a.city && <li><span>شهر</span><strong>{a.city}</strong></li>}
            {a.age && <li><span>سن</span><strong>{a.age.toLocaleString('fa-IR')} سال</strong></li>}
            {a.birthYear && <li><span>سال تولد</span><strong>{a.birthYear.toLocaleString('fa-IR')}</strong></li>}
            {a.heightCm && <li><span>قد</span><strong>{a.heightCm.toLocaleString('fa-IR')} سانتی‌متر</strong></li>}
            {a.weightKg && <li><span>وزن</span><strong>{a.weightKg.toLocaleString('fa-IR')} کیلوگرم</strong></li>}
            {custom.filter((c) => !c.long).map((c) => (
              <li key={c.key}><span>{c.label}</span><strong>{c.text}</strong></li>
            ))}
          </ul>

          {custom.filter((c) => c.long).map((c) => (
            <div key={c.key} style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 10 }}>{c.label}</h3>
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text)', lineHeight: 2 }}>{c.text}</p>
            </div>
          ))}

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

          {a.videos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 10 }} className="icon-inline">
                <Icon name="video" size={18} /> ویدیوهای رزومه
              </h3>
              <div className="actor-videos">
                {a.videos.map((v) => {
                  const local = isLocalVideo(v.url);
                  const src = local ? v.url : embedSrc(v.url);
                  if (!src) return null;
                  return (
                    <div key={v.id} className="actor-video">
                      <div className="actor-video__frame">
                        {local ? (
                          <video src={src} controls preload="metadata" playsInline />
                        ) : (
                          <iframe src={src} title={v.title || `ویدیوی ${a.fullName}`} allowFullScreen loading="lazy" />
                        )}
                      </div>
                      {v.title && <strong className="actor-video__title">{v.title}</strong>}
                      {v.description && <p className="actor-video__desc">{v.description}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {a.showreelUrl && (
            <div style={{ marginTop: 20 }}>
              <a href={a.showreelUrl} target="_blank" rel="noopener noreferrer" className="btn btn--dark">مشاهده نمونه‌کار</a>
            </div>
          )}
          {user?.role === 'filmmaker' && (
            <ActorBooking actorId={a.id} actorName={a.fullName} defaultName={user.displayName || ''} defaultPhone={user.phone || ''} />
          )}
        </div>
      </div>
    </SimplePage>
  );
}
