import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { countChatUnread } from '@/lib/staffChat';
import DashboardSidebar from '@/components/DashboardSidebar';
import Icon from '@/components/Icon';
import { siteUrl } from '@/lib/siteUrl';

// پنل شخصی — نه محتوای عمومی دارد و نه باید در نتایج جست‌وجو بیاید.
export async function generateMetadata() {
  return {
    title: 'داشبورد',
    robots: { index: false, follow: false },
    alternates: { canonical: `${await siteUrl()}/dashboard` },
  };
}

// عکس ۳×۴ کاربر در سرصفحهٔ پنل؛ اگر عکسی ثبت نشده باشد دعوت به آپلود نمایش داده می‌شود.
function UserPhoto({ user }) {
  if (!user.photoUrl) {
    return (
      <Link href="/dashboard/profile" className="user-photo user-photo--empty-link" title="افزودن عکس ۳×۴">
        <span className="user-photo__empty">افزودن<br />عکس ۳×۴</span>
      </Link>
    );
  }
  return (
    <div className="user-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={user.photoUrl} alt={user.displayName || 'عکس کاربر'} />
    </div>
  );
}

// خانهٔ مدیریت: ادمین و ادیتور بعد از ورود مستقیم همین صفحه را می‌بینند،
// نه داشبورد هنرجو. هر بخش پنل یک کارت با توضیح کوتاه دارد.
const MANAGER_GROUPS = [
  {
    title: 'هنرجویان و آموزش', icon: 'graduationCap',
    cards: [
      { href: '/dashboard/admin', icon: 'users', title: 'کاربران', text: 'پرونده، نقش و دسترسی کاربران' },
      { href: '/dashboard/admin/signups', icon: 'check', title: 'درخواست عضویت و ساخت حساب', text: 'بررسی مدارک و ساخت اطلاعات ورود' },
      { href: '/dashboard/admin/enrollments', icon: 'clipboard', title: 'ثبت‌نام دوره و تست بازیگری', text: 'بررسی تست، تحلیل و ویدیوی معرفی' },
      { href: '/dashboard/admin/classes', icon: 'calendar', title: 'کلاس‌ها و تقویم', text: 'جلسه‌ها، تقویم و حضور و غیاب' },
      { href: '/dashboard/admin/live-classes', icon: 'video', title: 'کلاس‌های آنلاین', text: 'مدیریت پخش زنده و ضبط جلسات' },
      { href: '/dashboard/admin/exam', icon: 'check', title: 'آزمون و بانک سؤال', text: 'مجوزها، سؤال‌ها و نتایج آزمون' },
      { href: '/dashboard/admin/certificates', icon: 'fileText', title: 'گواهی‌نامه‌ها', text: 'صدور و پیگیری گواهی پایان دوره' },
      { href: '/dashboard/admin/resumes', icon: 'user', title: 'ساخت و مدیریت رزومه', text: 'ایجاد رزومهٔ جدید، ویرایش و انتشار در بانک بازیگران' },
      { href: '/dashboard/admin/growth', icon: 'flag', title: 'مسیر رشد هنرجویان', text: 'پیگیری هدف‌ها، تمرین‌ها و استمرار' },
    ],
  },
  {
    title: 'مالی و فروش', icon: 'creditCard',
    cards: [
      { href: '/dashboard/admin/payments', icon: 'creditCard', title: 'پرداخت‌ها و شهریه', text: 'پرداخت‌ها، اقساط و مانده حساب' },
      { href: '/dashboard/admin/courses', icon: 'graduationCap', title: 'فروش دوره‌های غیرحضوری', text: 'دوره‌ها، درس‌ها و دسترسی خریداران' },
      { href: '/dashboard/admin/books', icon: 'book', title: 'فروش کتاب', text: 'کتاب‌ها، سفارش‌ها و ارسال' },
      { href: '/dashboard/admin/bookings', icon: 'clapperboard', title: 'درخواست‌های ست‌تایم', text: 'پیگیری درخواست فیلم‌سازان' },
    ],
  },
  {
    title: 'ارتباطات', icon: 'chat',
    cards: [
      { href: '/dashboard/admin/support', icon: 'chat', title: 'پشتیبانی آنلاین', text: 'پیام‌ها و درخواست‌های کاربران' },
      { href: '/dashboard/admin/chat-groups', icon: 'users', title: 'گفت‌وگوی هنرجویان', text: 'گروه‌ها و پیام‌های خصوصی' },
      { href: '/dashboard/admin/reports', icon: 'clipboard', title: 'گزارش و گفت‌وگوی تیم', text: 'کارهای مشترک مدیر و ادیتور' },
      { href: '/dashboard/admin/social', icon: 'users', title: 'برداشتگرام', text: 'انتشار رسمی و نظارت بر محتوا' },
    ],
  },
  {
    title: 'محتوا و سایت', icon: 'edit',
    cards: [
      { href: '/dashboard/admin/ai-knowledge', icon: 'chat', title: 'منابع هوش مصنوعی', text: 'بارگذاری جزوه و بررسی اتصال هوش مصنوعی' },
      { href: '/dashboard/admin/posts', icon: 'edit', title: 'محتوا و انتشار', text: 'وبلاگ، اخبار و گالری' },
      { href: '/dashboard/admin/content', icon: 'fileText', title: 'متن صفحات', text: 'ویرایش محتوای ثابت سایت' },
      { href: '/dashboard/admin/links', icon: 'link', title: 'لینک صفحات', text: 'دسترسی و کپی نشانی صفحات' },
      { href: '/dashboard/admin/audit', icon: 'clipboard', title: 'گزارش تغییرات', text: 'سابقه اقدامات مدیران' },
    ],
  },
];

async function ManagerDashboard({ user }) {
  const name = user.displayName || 'همکار گرامی';
  const roleLabel = user.role === 'admin' ? 'مدیر' : 'ادیتور';

  // وضعیت کارهای روزانهٔ مدیریت در یک درخواست موازی جمع می‌شود تا خانهٔ مدیریت
  // بدون ورود به تک‌تک صفحه‌ها موارد نیازمند رسیدگی را نشان دهد.
  const seenAt = user.staffReportsSeenAt || new Date(0);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const growthSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    newReports, newComments, openReports, myOpenTasks, latestReport, chatUnread, liveCount,
    pendingSignups, pendingEnrollments, supportSummary, pendingPayments, newBookings, upcomingClasses,
    recentGrowthGoals, recentGrowthTasks, recentHabitLogs, recentSharedJournals,
  ] = await Promise.all([
    prisma.staffReport.count({ where: { createdAt: { gt: seenAt }, authorId: { not: user.id } } }),
    prisma.staffReportComment.count({ where: { createdAt: { gt: seenAt }, authorId: { not: user.id } } }),
    prisma.staffReport.count({ where: { status: 'open' } }),
    prisma.staffReport.count({ where: { status: 'open', targetId: user.id } }),
    prisma.staffReport.findFirst({ orderBy: { createdAt: 'desc' }, select: { title: true, authorName: true } }),
    countChatUnread(user),
    prisma.classSession.count({ where: { liveStatus: 'live' } }),
    prisma.signupRequest.count({ where: { status: 'pending' } }),
    prisma.enrollment.count({ where: { status: 'submitted' } }),
    prisma.supportConversation.aggregate({ _sum: { adminUnread: true }, where: { status: 'open' } }),
    prisma.payment.count({ where: { status: 'pending' } }),
    prisma.bookingRequest.count({ where: { status: 'new' } }),
    prisma.classSession.count({ where: { startsAt: { gte: new Date(), lte: nextWeek } } }),
    prisma.growthGoal.count({ where: { updatedAt: { gte: growthSince } } }),
    prisma.growthTask.count({ where: { updatedAt: { gte: growthSince } } }),
    prisma.habitLog.count({ where: { createdAt: { gte: growthSince } } }),
    prisma.journalEntry.count({ where: { visibility: 'shared', createdAt: { gte: growthSince } } }),
  ]);
  const recentGrowthActivity = recentGrowthGoals + recentGrowthTasks + recentHabitLogs + recentSharedJournals;
  const unread = newReports + newComments;
  const supportUnread = supportSummary._sum.adminUnread || 0;
  const urgentTasks = [
    { href: '/dashboard/admin/signups', icon: 'check', value: pendingSignups, title: 'درخواست عضویت', text: 'نیازمند بررسی و ساخت حساب', tone: 'gold' },
    { href: '/dashboard/admin/enrollments', icon: 'clipboard', value: pendingEnrollments, title: 'ثبت‌نام دوره', text: 'تست و ویدیوی در انتظار بررسی', tone: 'blue' },
    { href: '/dashboard/admin/support', icon: 'chat', value: supportUnread, title: 'پیام پشتیبانی', text: 'پیام خوانده‌نشدهٔ کاربران', tone: 'red' },
    { href: '/dashboard/admin/payments', icon: 'creditCard', value: pendingPayments, title: 'پرداخت در انتظار', text: 'شهریه و پرداخت‌های تعیین تکلیف‌نشده', tone: 'green' },
  ];

  return (
    <div className="manager-home">
      <div className="dash-head manager-home__head">
        <div className="dash-head__id">
          {user.photoUrl && <UserPhoto user={user} />}
          <div>
            <h1 className="dash-head__title">خانهٔ مدیریت</h1>
            <p className="dash-head__sub">خوش آمدید {name} — وضعیت کارهای روزانه و مسیرهای اصلی پنل در یک نگاه.</p>
          </div>
        </div>
        <div className="manager-home__head-actions">
          <Link href="/dashboard/admin/resumes?new=1" className="btn btn--dark">+ ساخت رزومه جدید</Link>
          <span className="manager-home__role">{roleLabel} سامانه</span>
        </div>
      </div>

      {liveCount > 0 && (
        <Link href="/dashboard/admin/live-classes" className="manager-live-alert">
          <span className="live-dot" />
          <strong>{liveCount.toLocaleString('fa-IR')} کلاس آنلاین اکنون در حال برگزاری است</strong>
          <span>ورود به مدیریت پخش ←</span>
        </Link>
      )}

      <section className="manager-home__section">
        <div className="manager-home__section-head">
          <div><span className="manager-home__eyebrow">اولویت امروز</span><h2>کارهای نیازمند رسیدگی</h2></div>
          <span>با انتخاب هر کارت مستقیم وارد همان بخش شوید.</span>
        </div>
        <div className="manager-task-grid">
          {urgentTasks.map((task) => (
            <Link key={task.href} href={task.href} className={`manager-task manager-task--${task.tone}`}>
              <span className="manager-task__icon"><Icon name={task.icon} size={20} /></span>
              <span className="manager-task__content"><strong>{task.title}</strong><small>{task.text}</small></span>
              <b>{task.value.toLocaleString('fa-IR')}</b>
            </Link>
          ))}
        </div>
      </section>

      <div className="manager-overview">
        <Link href="/dashboard/admin/classes"><Icon name="calendar" size={18} /><span><strong>{upcomingClasses.toLocaleString('fa-IR')}</strong> کلاس در هفت روز آینده</span></Link>
        <Link href="/dashboard/admin/bookings"><Icon name="clapperboard" size={18} /><span><strong>{newBookings.toLocaleString('fa-IR')}</strong> درخواست جدید ست‌تایم</span></Link>
        <Link href="/dashboard/admin/reports"><Icon name="users" size={18} /><span><strong>{openReports.toLocaleString('fa-IR')}</strong> کار باز تیمی{myOpenTasks > 0 ? ` · ${myOpenTasks.toLocaleString('fa-IR')} ارجاع به شما` : ''}</span></Link>
        <Link href="/dashboard/admin/growth"><Icon name="flag" size={18} /><span><strong>{recentGrowthActivity.toLocaleString('fa-IR')}</strong> فعالیت رشد در هفت روز اخیر</span></Link>
      </div>

      <Link href="/dashboard/admin/reports" className="manager-team-card">
        <span className="manager-team-card__icon"><Icon name="users" size={22} /></span>
        <span className="manager-team-card__content">
          <strong>گزارش کار و گفت‌وگوی تیم</strong>
          <small>{latestReport ? `آخرین گزارش: «${latestReport.title}» از ${latestReport.authorName}` : 'اولین گزارش کار را ثبت کنید یا گفت‌وگو را شروع کنید.'}</small>
        </span>
        <span className="manager-team-card__badges">
          {unread > 0 && <b>{unread.toLocaleString('fa-IR')} مورد تازه</b>}
          {chatUnread > 0 && <b>{chatUnread.toLocaleString('fa-IR')} پیام</b>}
        </span>
        <span className="manager-team-card__arrow">←</span>
      </Link>

      <section className="manager-home__section manager-tools">
        <div className="manager-home__section-head">
          <div><span className="manager-home__eyebrow">دسترسی سریع</span><h2>همهٔ ابزارهای مدیریت</h2></div>
          <span>بخش‌ها براساس نوع کار دسته‌بندی شده‌اند.</span>
        </div>
        <div className="manager-groups">
          {MANAGER_GROUPS.map((group, groupIndex) => (
            <details key={group.title} className="manager-group" open={groupIndex === 0}>
              <summary>
                <span className="manager-group__icon"><Icon name={group.icon} size={19} /></span>
                <span><strong>{group.title}</strong><small>{group.cards.length.toLocaleString('fa-IR')} ابزار مدیریتی</small></span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
              </summary>
              <div className="manager-tool-grid">
                {group.cards.map((card) => (
                  <Link key={card.href} href={card.href} className="manager-tool">
                    <span className="manager-tool__icon"><Icon name={card.icon} size={18} /></span>
                    <span><strong>{card.title}</strong><small>{card.text}</small></span>
                    <span className="manager-tool__arrow">←</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

// داشبورد فیلمساز عمداً هیچ بخش آموزشی (دوره، ثبت‌نام، تقویم) ندارد؛
// چرخهٔ کارِ او فقط این است: بانک بازیگران → لیست کوتاه → درخواست ست تایم → پیگیری پاسخ.
async function FilmmakerDashboard({ user }) {
  const name = user.displayName || 'فیلمساز گرامی';

  const [byStatus, shortlistCount, latestActors, actorsCount, lastReply] = await Promise.all([
    prisma.bookingRequest.groupBy({ by: ['status'], where: { userId: user.id }, _count: { _all: true } }),
    prisma.actorShortlist.count({ where: { userId: user.id } }),
    prisma.actorResume.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: { id: true, fullName: true, headline: true },
    }),
    prisma.actorResume.count({ where: { isPublic: true } }),
    prisma.bookingRequest.findFirst({
      where: { userId: user.id, reply: { not: null } },
      orderBy: { replyAt: 'desc' },
      select: { actorName: true, reply: true },
    }),
  ]);

  const count = (s) => byStatus.find((r) => r.status === s)?._count?._all || 0;
  const open = count('new');
  const inProgress = count('contacted');
  const done = count('done');
  const total = byStatus.reduce((sum, r) => sum + r._count._all, 0);

  const profileIncomplete = !user.displayName || !user.company;

  return (
    <>
      <div className="dash-head">
        <div className="dash-head__id">
          <UserPhoto user={user} />
          <div>
            <h1 className="dash-head__title">داشبورد فیلمساز</h1>
            <p className="dash-head__sub">خوش آمدید {name}؛ از اینجا به بانک بازیگران خانواده برداشت دسترسی دارید.</p>
          </div>
        </div>
      </div>

      {profileIncomplete && (
        <div className="alert alert--info" style={{ marginBottom: 14 }}>
          <Icon name="user" size={16} /> پروفایل حرفه‌ای شما کامل نیست. با ثبت نام، شرکت و زمینهٔ فعالیت، درخواست‌های ست تایم شما سریع‌تر بررسی می‌شود.{' '}
          <Link href="/dashboard/profile" style={{ fontWeight: 700 }}>تکمیل پروفایل ←</Link>
        </div>
      )}

      {lastReply?.reply && (
        <div className="alert alert--success" style={{ marginBottom: 14, lineHeight: 2 }}>
          <Icon name="chat" size={16} /> پاسخ پشتیبانی دربارهٔ <b>{lastReply.actorName}</b>: {lastReply.reply}{' '}
          <Link href="/dashboard/requests" style={{ fontWeight: 700 }}>مشاهدهٔ همهٔ درخواست‌ها ←</Link>
        </div>
      )}

      <Link href="/actors" className="dash-hero" style={{ marginBottom: 14 }}>
        <div className="dash-hero__label">ویژه‌ی فیلم‌سازان</div>
        <h2 className="dash-hero__title"><Icon name="masks" size={22} /> بانک بازیگران</h2>
        <p className="dash-hero__cta">
          {actorsCount > 0 ? `${actorsCount.toLocaleString('fa-IR')} رزومه آماده مشاهده — ثبت درخواست ست تایم` : 'مشاهده رزومه‌ها و ثبت درخواست ست تایم'} →
        </p>
      </Link>

      <div className="dash-cards" style={{ marginBottom: 22 }}>
        <Link href="/dashboard/requests" className="dash-card" style={{ display: 'block' }}>
          <h3 className="dash-card__title"><Icon name="clipboard" size={16} /> درخواست‌های ست تایم</h3>
          <p className="dash-card__text">
            {total === 0
              ? 'هنوز درخواستی ثبت نکرده‌اید. از رزومهٔ هر بازیگر می‌توانید درخواست بدهید.'
              : `${total.toLocaleString('fa-IR')} درخواست — ${open.toLocaleString('fa-IR')} در انتظار بررسی، ${inProgress.toLocaleString('fa-IR')} در حال پیگیری، ${done.toLocaleString('fa-IR')} انجام‌شده.`}
          </p>
          <span className="dash-card__link">پیگیری درخواست‌ها →</span>
        </Link>
        <Link href="/dashboard/shortlist" className="dash-card" style={{ display: 'block' }}>
          <h3 className="dash-card__title"><Icon name="trophy" size={16} /> لیست کوتاه من</h3>
          <p className="dash-card__text">
            {shortlistCount === 0
              ? 'بازیگرانی که می‌پسندید را نشان کنید تا بعداً راحت پیدایشان کنید.'
              : `${shortlistCount.toLocaleString('fa-IR')} بازیگر در لیست کوتاه شما ذخیره شده است.`}
          </p>
          <span className="dash-card__link">مشاهده لیست →</span>
        </Link>
        <div className="dash-card">
          <h3 className="dash-card__title"><Icon name="user" size={16} /> حساب کاربری</h3>
          <p className="dash-card__text">
            شماره موبایل: <span dir="ltr">{user.phone}</span>
            {user.company ? <><br />{user.company}</> : null}
          </p>
          <Link href="/dashboard/profile" className="dash-card__link">ویرایش پروفایل →</Link>
        </div>
      </div>

      {latestActors.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 12px' }}>تازه‌ترین رزومه‌ها</h2>
          <div className="dash-cards">
            {latestActors.map((a) => (
              <Link key={a.id} href={`/actors/${a.id}`} className="dash-card" style={{ display: 'block' }}>
                <h3 className="dash-card__title">{a.fullName}</h3>
                <p className="dash-card__text">{a.headline || 'رزومه بازیگری'}</p>
                <span className="dash-card__link">مشاهده رزومه →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// نوارِ آمارِ بالای داشبورد هنرجو: چهار عددی که هنرجو بیشتر از همه دنبالشان است.
// همهٔ اعداد واقعی‌اند و از حضور و غیاب و جلسه‌های کلاسِ خودش می‌آیند؛ فرمول پیشرفت
// دقیقاً همان چیزی است که در /api/my/schedule استفاده می‌شود تا دو جا دو عدد ندهند.
async function StudentStats({ user }) {
  const groupId = user.classGroupId;

  const [group, presentCount, upcoming, activeGoals, openTasks, latestProgressComment] = await Promise.all([
    groupId ? prisma.classGroup.findUnique({ where: { id: groupId }, select: { totalSessions: true } }) : null,
    groupId ? prisma.attendance.count({ where: { userId: user.id, status: 'present', session: { groupId } } }) : 0,
    groupId ? prisma.classSession.count({ where: { groupId, startsAt: { gt: new Date() } } }) : 0,
    prisma.growthGoal.count({ where: { userId: user.id, status: 'active' } }),
    prisma.growthTask.count({ where: { userId: user.id, status: 'pending' } }),
    prisma.studentProgressComment.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true } }),
  ]);

  const totalSessions = group?.totalSessions || 8;
  const computedProgress = totalSessions ? Math.min(100, Math.round((presentCount / totalSessions) * 100)) : 0;
  const progress = user.progressOverride ?? computedProgress;
  const fa = (n) => n.toLocaleString('fa-IR');

  return (
    <>
      <div className="dash-stats">
      {/* جای مربعِ بیمه را مسیر رشد گرفته است؛ بیمه از منوی کناری در دسترس می‌ماند. */}
      <Link href="/dashboard/growth" className="dash-stat">
        <div className="dash-stat__head">
          <span className={`dash-stat__ico ${activeGoals ? 'dash-stat__ico--green' : 'dash-stat__ico--gold'}`}>
            <Icon name="flag" size={20} />
          </span>
          <span className="dash-stat__label">مسیر رشد</span>
        </div>
        <div className={`dash-stat__value ${activeGoals ? 'dash-stat__value--green' : 'dash-stat__value--muted'}`}>
          {fa(activeGoals)}
        </div>
        <p className="dash-stat__hint">
          {activeGoals ? `هدف فعال · ${fa(openTasks)} کار باز` : 'هنوز هدفی ثبت نشده'}
        </p>
      </Link>

      <div className="dash-stat">
        <div className="dash-stat__head">
          <span className="dash-stat__ico dash-stat__ico--gold"><Icon name="calendar" size={20} /></span>
          <span className="dash-stat__label">جلسات تکمیل‌شده</span>
        </div>
        <div className="dash-stat__value">{fa(presentCount)}</div>
        <p className="dash-stat__hint">از {fa(totalSessions)} جلسه</p>
      </div>

      <Link href="/dashboard/live-classes" className="dash-stat">
        <div className="dash-stat__head">
          <span className="dash-stat__ico dash-stat__ico--blue"><Icon name="video" size={20} /></span>
          <span className="dash-stat__label">کلاس‌های پیش رو</span>
        </div>
        <div className="dash-stat__value">{fa(upcoming)}</div>
        <p className="dash-stat__hint">{upcoming > 0 ? 'جلسهٔ باقی‌مانده' : 'جلسه‌ای ثبت نشده'}</p>
      </Link>

      <div className="dash-stat">
        <div className="dash-stat__head">
          <span className="dash-stat__ico dash-stat__ico--amber"><Icon name="sparkles" size={20} /></span>
          <span className="dash-stat__label">پیشرفت دوره</span>
        </div>
        <div className="dash-stat__value">٪{fa(progress)}</div>
        <div className="dash-progress"><div className="dash-progress__bar" style={{ width: `${progress}%` }} /></div>
      </div>
      </div>
      {latestProgressComment && (
        <div className="student-progress-comment student-progress-comment--dashboard">
          <strong>نظر استاد دربارهٔ پیشرفت شما</strong>
          <p>{latestProgressComment.content}</p>
          <small>{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(latestProgressComment.createdAt)}</small>
        </div>
      )}
    </>
  );
}

// یادآوری برای هنرجو: اگر همین حالا جلسه‌ای از کلاس خودش در حال پخش زنده است، بالای داشبورد نشانش بده.
async function LiveNowNudge({ user }) {
  if (!user.classGroupId || user.graduated) return null;
  const session = await prisma.classSession.findFirst({
    where: { groupId: user.classGroupId, liveStatus: 'live' },
    orderBy: { liveStartedAt: 'desc' },
    select: { id: true, title: true },
  });
  if (!session) return null;

  return (
    <Link href={`/dashboard/live-classes/${session.id}`} className="dash-hero" style={{ marginBottom: 14, border: '2px solid #DC2626' }}>
      <div className="dash-hero__label" style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="live-dot" /> در حال پخش زنده
      </div>
      <h2 className="dash-hero__title"><Icon name="video" size={22} /> {session.title}</h2>
      <p className="dash-hero__cta">ورود به کلاس →</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  const name = user.displayName || 'هنرجوی گرامی';
  // در سلامِ داشبورد فقط نام کوچک را می‌آوریم؛ صمیمی‌تر از نام کاملِ اداری است.
  const firstName = name.split(' ')[0];
  const welcomeSub = user.role !== 'student'
    ? 'از اینجا ثبت‌نام و حسابت را دنبال کن.'
    : user.graduated
      ? 'دوره‌ات را کامل کرده‌ای؛ گواهی‌نامه و امکانات فارغ‌التحصیلی از پنل در دسترس توست.'
      : 'امروز یک قدم به هنرمند شدن نزدیک‌تری ✨';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="dashboard" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        {isManager(user) ? (
          <ManagerDashboard user={user} />
        ) : user.role === 'filmmaker' ? (
          <FilmmakerDashboard user={user} />
        ) : (
          <>
            <div className="dash-welcome">
              <h1 className="dash-welcome__title">👋 خوش آمدی، {firstName}</h1>
              <p className="dash-welcome__sub">{welcomeSub}</p>
            </div>
            <LiveNowNudge user={user} />
            {user.role === 'student' && <div className="dash-cards" style={{ marginBottom: 14 }}><Link href="/dashboard/resume" className="dash-card"><h3 className="dash-card__title">معرفی بازیگر</h3><p className="dash-card__text">مشخصات و عکس‌های معرفی خود را برای بانک بازیگران ثبت کنید.</p><span className="dash-card__link">تکمیل معرفی →</span></Link></div>}
            {user.role === 'student' && !user.graduated && <StudentStats user={user} />}
            <div className="dash-cards" style={{ gridTemplateColumns: user.graduated ? undefined : '2fr 1fr' }}>
              {!user.graduated && (
                <Link href="/dashboard/calendar" className="dash-hero">
                  <div className="dash-hero__label">تقویم کلاس</div>
                  <h2 className="dash-hero__title">برنامه کلاس‌های شما</h2>
                  <p className="dash-hero__cta">مشاهده تقویم →</p>
                </Link>
              )}
              <div className="dash-card">
                <h3 className="dash-card__title">حساب کاربری</h3>
                <p className="dash-card__text">شماره موبایل: <span dir="ltr">{user.phone}</span></p>
                <Link href="/dashboard/profile" className="dash-card__link">تکمیل پروفایل →</Link>
              </div>
            </div>
            {/* بیمه فقط در مدت حضور فعال هنرجو در دوره نمایش داده می‌شود. */}
            {user.role === 'student' && !user.graduated && (
              <div className="dash-cards" style={{ marginTop: 14 }}>
                <Link href="/dashboard/insurance" className="dash-card" style={{ display: 'block' }}>
                  <h3 className="dash-card__title">
                    <Icon name="shield" size={16} /> بیمهٔ من
                    <span className="tag tag--green" style={{ marginRight: 8 }}>فعال</span>
                  </h3>
                  <p className="dash-card__text">
                    در طول دوره تحت پوشش بیمهٔ حوادث آموزشگاه هستید؛ کارت بیمه و روش استفاده از آن اینجاست.
                  </p>
                  <span className="dash-card__link">مشاهده بیمه →</span>
                </Link>
              </div>
            )}
            <p className="dash-foot">© خانواده برداشت — تمام حقوق محفوظ است.</p>
          </>
        )}
      </main>
    </div>
  );
}
