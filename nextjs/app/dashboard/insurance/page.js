import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { loadContent, splitLines } from '@/lib/siteContent';
import DashboardSidebar from '@/components/DashboardSidebar';
import Icon from '@/components/Icon';

// پنل شخصی است؛ نباید ایندکس شود.
export const metadata = { title: 'بیمهٔ من', robots: { index: false, follow: false } };

// اطلاعات بیمه‌نامه از «متن صفحات» می‌آید و ممکن است هنوز پر نشده باشد؛
// هر جای خالی با یک متن جایگزینِ روشن نمایش داده می‌شود تا صفحه ناقص به‌نظر نرسد.
const NOT_SET = 'ثبت نشده';

// هر مورد به شکل «عنوان | توضیح» ذخیره می‌شود؛ اگر جداکننده نبود، کل خط عنوان است.
function parsePairs(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split('|');
    return [title.trim(), rest.join('|').trim()];
  });
}

function Field({ label, value }) {
  return (
    <div className="info-chip">
      <strong>{label}</strong>
      <span>{value || NOT_SET}</span>
    </div>
  );
}

export default async function MyInsurancePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/insurance');
  // پوشش بیمه فقط در بازهٔ حضور فعال هنرجو در دوره است.
  if (user.role === 'student' && user.graduated) redirect('/dashboard');
  // بیمه مخصوص هنرجوست؛ فیلمساز رابطهٔ آموزشی با آموزشگاه ندارد.
  if (user.role === 'filmmaker') redirect('/dashboard');

  const t = await loadContent();

  const classGroup = user.classGroupId
    ? await prisma.classGroup.findUnique({ where: { id: user.classGroupId }, select: { name: true } })
    : null;

  // «در حال تحصیل» یعنی هنرجویی که هنوز فارغ‌التحصیل نشده؛ پوشش بیمه برای همین بازه است.
  const isStudent = user.role === 'student';
  const covered = isStudent && !user.graduated;

  const coverage = parsePairs(t('insurancePanel.coverage'));
  const steps = splitLines(t('insurancePanel.steps'));
  const phone = t('insurancePanel.phone') || t('footer.phone');
  const note = t('insurancePanel.note');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="insurance" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">بیمهٔ من</h1>
          <p className="dash-head__sub">
            وضعیت پوشش بیمه‌ای شما و روش استفاده از آن در صورت بروز حادثه.
          </p>
        </div>

        {covered ? (
          <div className="alert alert--success" style={{ marginBottom: 18 }}>
            <Icon name="shield" size={16} /> شما در حال حاضر <b>تحت پوشش بیمه</b> هستید. تا پایان دوره،
            حوادث ناشی از کلاس‌ها، کارگاه‌ها و اردوهای آموزشگاه مشمول این پوشش است.
          </div>
        ) : isStudent && user.graduated ? (
          <div className="alert alert--info" style={{ marginBottom: 18 }}>
            <Icon name="shield" size={16} /> شما دورهٔ آموزشی را به پایان رسانده‌اید؛ پوشش بیمهٔ هنرجویی
            مربوط به بازهٔ تحصیل شماست و برای فارغ‌التحصیلان ادامه پیدا نمی‌کند. اطلاعات زیر برای
            پیگیری پرونده‌های همان بازه در دسترس شماست.
          </div>
        ) : (
          <div className="alert alert--warning" style={{ marginBottom: 18 }}>
            <Icon name="alertTriangle" size={16} /> پوشش بیمهٔ هنرجویی از زمانی فعال می‌شود که ثبت‌نام شما
            نهایی و در یکی از کلاس‌ها ثبت شوید.{' '}
            <Link href="/dashboard/enrollment" style={{ fontWeight: 700 }}>پیگیری ثبت‌نام ←</Link>
          </div>
        )}

        <p style={{ color: 'var(--muted)', lineHeight: 2, margin: '0 0 20px' }}>{t('insurancePanel.intro')}</p>

        <section className="stack-card" style={{ marginBottom: 26 }}>
          <h2 className="dash-card__title" style={{ marginBottom: 14 }}>
            <Icon name="shield" size={18} /> کارت بیمهٔ هنرجو
            <span className={`tag ${covered ? 'tag--green' : 'tag--dark'}`} style={{ marginRight: 8 }}>
              {covered ? 'فعال' : 'غیرفعال'}
            </span>
          </h2>

          <div className="info-grid" style={{ marginBottom: 14 }}>
            <Field label="نام هنرجو" value={user.displayName} />
            <Field label="کد ملی" value={user.nationalId} />
            <Field label="شمارهٔ موبایل" value={<span dir="ltr">{user.phone}</span>} />
            <Field label="شعبه" value={user.branch} />
            <Field label="دوره" value={user.courseTitle} />
            <Field label="کلاس" value={classGroup?.name} />
          </div>

          <div className="info-grid" style={{ marginBottom: 0 }}>
            <Field label="شرکت بیمه" value={t('insurancePanel.company')} />
            <Field label="شمارهٔ بیمه‌نامهٔ گروهی" value={t('insurancePanel.policyNo')} />
            <Field label="نوع پوشش" value={t('insurancePanel.kind')} />
            <Field label="اعتبار از" value={t('insurancePanel.validFrom')} />
            <Field label="اعتبار تا" value={t('insurancePanel.validTo')} />
            <Field label="وضعیت" value={covered ? 'در حال تحصیل — تحت پوشش' : 'خارج از بازهٔ پوشش'} />
          </div>

          {!user.nationalId && (
            <div className="alert alert--warning" style={{ marginTop: 16 }}>
              <Icon name="user" size={16} /> کد ملی شما ثبت نشده است. برای تشکیل پروندهٔ بیمه، کد ملی لازم است.{' '}
              <Link href="/dashboard/profile" style={{ fontWeight: 700 }}>تکمیل پروفایل ←</Link>
            </div>
          )}
        </section>

        {coverage.length > 0 && (
          <section style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 12px' }}>چه چیزهایی پوشش داده می‌شود</h2>
            <div className="dash-cards">
              {coverage.map(([title, text]) => (
                <div key={title} className="dash-card">
                  <h3 className="dash-card__title">{title}</h3>
                  <p className="dash-card__text" style={{ marginBottom: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {steps.length > 0 && (
          <section className="stack-card" style={{ marginBottom: 26 }}>
            <h2 className="dash-card__title" style={{ marginBottom: 12 }}>
              <Icon name="clipboard" size={18} /> اگر حادثه‌ای رخ داد چه کنیم؟
            </h2>
            <ol style={{ color: 'var(--muted)', lineHeight: 2.1, margin: 0, paddingInlineStart: 20 }}>
              {steps.map((step) => (
                <li key={step} style={{ marginBottom: 6 }}>{step}</li>
              ))}
            </ol>

            {phone && (
              <p style={{ margin: '16px 0 0' }}>
                <a href={`tel:${phone}`} className="dash-card__link" dir="ltr" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="phone" size={16} /> {phone}
                </a>
              </p>
            )}
          </section>
        )}

        {note && (
          <div className="alert alert--info">
            <Icon name="alertTriangle" size={16} /> {note}
          </div>
        )}
      </main>
    </div>
  );
}
