import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { countChatUnread } from '@/lib/staffChat';
import LogoutButton from '@/components/LogoutButton';
import DashboardSidebar from '@/components/DashboardSidebar';
import Icon from '@/components/Icon';

// پنل شخصی — نه محتوای عمومی دارد و نه باید در نتایج جست‌وجو بیاید.
// canonical هم حذف شده چون قبلاً به‌اشتباه به صفحهٔ اصلی اشاره می‌کرد.
export const metadata = {
  title: 'داشبورد',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.bardashtt.com/dashboard' },
};

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
    title: 'هنرجویان و کلاس‌ها',
    cards: [
      { href: '/dashboard/admin/signups', title: 'تأیید حساب‌ها', text: 'درخواست‌های عضویت جدید را بررسی و تأیید کنید.' },
      { href: '/dashboard/admin/enrollments', title: 'بررسی ثبت‌نام‌ها', text: 'فرم‌های ثبت‌نام دوره و ویدیوهای ارسالی.' },
      { href: '/dashboard/admin/classes', title: 'کلاس‌ها و تقویم', text: 'جلسه‌ها، حضور و غیاب و تقویم آموزشی.' },
      { href: '/dashboard/admin/live-classes', title: 'کلاس‌های آنلاین', text: 'شروع و پایان پخش زندهٔ جلسات.' },
      { href: '/dashboard/admin/exam', title: 'آزمون و بانک سوال', text: 'اجازهٔ آزمون هنرجویان و سؤال‌های آزمون پایان دوره.' },
      { href: '/dashboard/admin/certificates', title: 'گواهی‌نامه‌ها', text: 'صدور و پیگیری گواهی پایان دوره.' },
      { href: '/dashboard/admin/support', title: 'پشتیبانی آنلاین', text: 'پاسخ به گفتگوهای زندهٔ کاربران سایت.' },
    ],
  },
  {
    title: 'محتوای سایت',
    cards: [
      { href: '/dashboard/admin/posts', title: 'محتوا و انتشار', text: 'مطالب بلاگ، اخبار و گالری تصاویر.' },
      { href: '/dashboard/admin/content', title: 'متن صفحات', text: 'ویرایش متن‌های سایت، منو، فوتر و تنظیمات گوگل.' },
      { href: '/dashboard/admin/links', title: 'لینک صفحات', text: 'نشانی‌ها و لینک‌های داخلی سایت.' },
    ],
  },
  {
    title: 'فروش و مالی',
    cards: [
      { href: '/dashboard/admin/payments', title: 'پرداخت‌ها و شهریه', text: 'وضعیت پرداخت‌ها و اقساط شهریه.' },
      { href: '/dashboard/admin/courses', title: 'فروش دوره', text: 'دوره‌های آنلاین و دسترسی خریداران.' },
      { href: '/dashboard/admin/books', title: 'فروش کتاب', text: 'کتاب‌ها و سفارش‌های ثبت‌شده.' },
      { href: '/dashboard/admin/bookings', title: 'درخواست‌های ست تایم', text: 'درخواست فیلم‌سازان از بانک بازیگران.' },
    ],
  },
  {
    title: 'مدیریت سیستم',
    cards: [
      { href: '/dashboard/admin', title: 'کاربران', text: 'نقش، نام کاربری و رمز عبور کاربران را تعیین کنید.' },
      { href: '/dashboard/admin/audit', title: 'گزارش تغییرات', text: 'چه کسی، چه زمانی و چه چیزی را تغییر داده است.' },
    ],
  },
];

async function ManagerDashboard({ user }) {
  const name = user.displayName || 'همکار گرامی';
  const roleLabel = user.role === 'admin' ? 'مدیر' : 'ادیتور';

  // تابلوی گزارش کار تیمی: چند مورد از آخرین بازدیدِ همین مدیر تازه است، چند کار به خودش ارجاع شده،
  // چند کار باز مانده و چند پیام گفت‌وگوی تیمی خوانده نشده است.
  const seenAt = user.staffReportsSeenAt || new Date(0);
  const [newReports, newComments, openReports, myOpenTasks, latestReport, chatUnread, liveCount] = await Promise.all([
    prisma.staffReport.count({ where: { createdAt: { gt: seenAt }, authorId: { not: user.id } } }),
    prisma.staffReportComment.count({ where: { createdAt: { gt: seenAt }, authorId: { not: user.id } } }),
    prisma.staffReport.count({ where: { status: 'open' } }),
    prisma.staffReport.count({ where: { status: 'open', targetId: user.id } }),
    prisma.staffReport.findFirst({ orderBy: { createdAt: 'desc' }, select: { title: true, authorName: true } }),
    countChatUnread(user),
    prisma.classSession.count({ where: { liveStatus: 'live' } }),
  ]);
  const unread = newReports + newComments;

  return (
    <>
      <div className="dash-head">
        <div className="dash-head__id">
          {user.photoUrl && <UserPhoto user={user} />}
          <div>
            <h1 className="dash-head__title">خانهٔ مدیریت</h1>
            <p className="dash-head__sub">خوش آمدید {name} — شما با نقش «{roleLabel}» وارد شده‌اید. از کارت‌های زیر یا منوی کنار صفحه به بخش‌های پنل بروید.</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* بنر پخش زنده؛ فقط وقتی حداقل یک جلسه هم‌اکنون در حال برگزاری است نمایش داده می‌شود. */}
      {liveCount > 0 && (
        <Link href="/dashboard/admin/live-classes" className="dash-hero" style={{ marginBottom: 14, border: '2px solid #DC2626' }}>
          <div className="dash-hero__label" style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="live-dot" /> اکنون در حال پخش
          </div>
          <h2 className="dash-hero__title"><Icon name="video" size={22} /> {liveCount.toLocaleString('fa-IR')} کلاس آنلاین اکنون در حال برگزاری است</h2>
          <p className="dash-hero__cta">مشاهدهٔ کلاس‌های آنلاین →</p>
        </Link>
      )}

      {/* دفترِ کار مشترک مدیر و ادیتور؛ فقط همین دو نقش این بخش را می‌بینند. */}
      <Link href="/dashboard/admin/reports" className="dash-hero" style={{ marginBottom: 26 }}>
        <div className="dash-hero__label">فقط مدیر و ادیتور</div>
        <h2 className="dash-hero__title">
          <Icon name="users" size={22} /> گزارش کار و گفت‌وگوی تیمی
          {unread > 0 && <span className="tag tag--gold" style={{ marginRight: 8 }}>{unread.toLocaleString('fa-IR')} مورد تازه</span>}
          {chatUnread > 0 && <span className="tag tag--gold" style={{ marginRight: 8 }}>{chatUnread.toLocaleString('fa-IR')} پیام نخوانده</span>}
        </h2>
        <p className="dash-hero__cta">
          {latestReport
            ? `${openReports.toLocaleString('fa-IR')} کار باز${myOpenTasks > 0 ? ` (${myOpenTasks.toLocaleString('fa-IR')} ارجاع به شما)` : ''} · آخرین گزارش: «${latestReport.title}» از ${latestReport.authorName} →`
            : 'اولین گزارش کار را ثبت کنید یا با همکارتان گفت‌وگو را شروع کنید →'}
        </p>
      </Link>

      {MANAGER_GROUPS.map((group) => (
        <section key={group.title} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 12px' }}>{group.title}</h2>
          <div className="dash-cards">
            {group.cards.map((card) => (
              <Link key={card.href} href={card.href} className="dash-card" style={{ display: 'block' }}>
                <h3 className="dash-card__title">{card.title}</h3>
                <p className="dash-card__text">{card.text}</p>
                <span className="dash-card__link">ورود به بخش →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
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
        <LogoutButton />
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

// یادآوری برای هنرجو: رزومه‌اش را مدیریت می‌نویسد، اما ویدیوی معرفی را باید خودش بگذارد؛
// بدون ویدیو، رزومه در بانک بازیگران برای فیلم‌سازان کم‌جان دیده می‌شود.
async function StudentResumeNudge({ user }) {
  const resume = await prisma.actorResume.findUnique({
    where: { userId: user.id },
    select: { isPublic: true, selfVideoUrl: true },
  });

  if (!resume) {
    return (
      <div className="alert alert--info" style={{ marginBottom: 14 }}>
        <Icon name="masks" size={16} /> هنوز رزومهٔ بازیگری برای شما ثبت نشده است. رزومه را مدیریت آموزشگاه تنظیم می‌کند؛ برای پیگیری با پشتیبانی در تماس باشید.
      </div>
    );
  }

  if (!resume.selfVideoUrl) {
    return (
      <div className="alert alert--warning" style={{ marginBottom: 14 }}>
        <Icon name="video" size={16} /> رزومهٔ شما ویدیوی معرفی ندارد. با یک ویدیوی کوتاه، شانس دیده‌شدن شما توسط فیلم‌سازان بیشتر می‌شود.{' '}
        <Link href="/dashboard/resume" style={{ fontWeight: 700 }}>بارگذاری ویدیوی معرفی ←</Link>
      </div>
    );
  }

  if (!resume.isPublic) {
    return (
      <div className="alert alert--info" style={{ marginBottom: 14 }}>
        <Icon name="masks" size={16} /> رزومهٔ شما هنوز در بانک بازیگران منتشر نشده است. انتشار آن را مدیریت آموزشگاه انجام می‌دهد.
      </div>
    );
  }

  return null;
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
            <div className="dash-head">
              <div className="dash-head__id">
                <UserPhoto user={user} />
                <div>
                  <h1 className="dash-head__title">داشبورد هنرجو</h1>
                  <p className="dash-head__sub">خوش آمدید {name}؛ وضعیت آموزشی شما اینجاست.</p>
                </div>
              </div>
              <LogoutButton />
            </div>
            <LiveNowNudge user={user} />
            {user.role === 'student' && <StudentResumeNudge user={user} />}
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
          </>
        )}
      </main>
    </div>
  );
}
