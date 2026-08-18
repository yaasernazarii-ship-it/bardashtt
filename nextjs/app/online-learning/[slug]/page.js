import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import VideoEmbed from '@/components/VideoEmbed';
import BuyCourseButton from '@/components/BuyCourseButton';
import Icon from '@/components/Icon';
import { getSessionUser } from '@/lib/auth';
import { courseBySlug, userHasCourseAccess } from '@/lib/onlineCourses';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await courseBySlug(slug);
  if (!course) return { title: 'دوره یافت نشد' };
  const site = await siteUrl();
  const url = `${site}/online-learning/${course.slug}`;
  return {
    title: `${course.title} | دورهٔ آنلاین خانواده برداشت`,
    description: course.description ? String(course.description).slice(0, 160) : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: course.title,
      description: course.description ? String(course.description).slice(0, 160) : undefined,
      url,
      images: course.coverImage ? [{ url: `${site}${course.coverImage}` }] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const course = await courseBySlug(slug);
  if (!course) notFound();

  const user = await getSessionUser();
  const hasAccess = user ? await userHasCourseAccess(user.id, course.id) : false;
  const isManagerUser = user && (user.role === 'admin' || user.role === 'editor');
  // مدیران برای بازبینی، دسترسیِ کامل دارند.
  const canWatch = hasAccess || isManagerUser;

  // لینکِ ویدیوهای محافظت‌شده فقط برای کسی که دسترسی دارد از دیتابیس خوانده و به کلاینت فرستاده می‌شود.
  const lessons = canWatch ? ((await courseBySlug(slug, { withLessons: true }))?.lessons || []) : [];
  const lessonCount = course._count.lessons;

  const site = await siteUrl();
  const url = `${site}/online-learning/${course.slug}`;
  const priceLabel = course.price > 0 ? `${course.price.toLocaleString('fa-IR')} تومان` : 'رایگان';
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'خانه', url: site },
    { name: 'یادگیری آنلاین', url: `${site}/online-learning` },
    { name: course.title, url },
  ]);

  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">دورهٔ آنلاین</div>
          <h1>{course.title}</h1>
          <div className="breadcrumb">
            <Link href="/">خانه</Link> › <Link href="/online-learning">یادگیری آنلاین</Link> › {course.title}
          </div>
        </div>
      </div>

      <section style={{ background: 'var(--bg)' }}>
        <div className="container container--sm">
          {course.description && (
            <div className="stack-card" style={{ marginBottom: 22 }}>
              {course.description.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="body-lg" style={{ marginBottom: 8 }}>{p.trim()}</p>
              ))}
            </div>
          )}

          {/* تیزرِ رایگان — برای همه */}
          {course.teaserUrl && (
            <div style={{ marginBottom: 24 }}>
              <h2 className="subheading" style={{ marginBottom: 12 }}>تیزر معرفی دوره</h2>
              <VideoEmbed url={course.teaserUrl} title={`تیزر ${course.title}`} />
            </div>
          )}

          {canWatch ? (
            /* دسترسیِ کامل: همهٔ ویدیوهای دوره */
            <div>
              {isManagerUser && !hasAccess && (
                <div className="alert" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  نمای مدیریت: شما به‌عنوان مدیر همهٔ ویدیوها را می‌بینید (این نما برای کاربر عادی قفل است).
                </div>
              )}
              <h2 className="subheading" style={{ margin: '8px 0 14px' }}>
                ویدیوهای دوره ({lessons.length.toLocaleString('fa-IR')} ویدیو)
              </h2>
              {lessons.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>ویدیوهای این دوره به‌زودی بارگذاری می‌شوند.</p>
              ) : (
                <div style={{ display: 'grid', gap: 24 }}>
                  {lessons.map((lesson, i) => (
                    <div key={lesson.id} className="course-lesson">
                      <h3 className="course-lesson__title">
                        <span className="course-lesson__num">{(i + 1).toLocaleString('fa-IR')}</span>
                        {lesson.title}
                      </h3>
                      <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* قفل: خرید نکرده — سرفصل‌ها را می‌بیند ولی ویدیوها بسته است */
            <div className="course-locked">
              <div className="course-locked__badge"><Icon name="lock" size={15} /> برای دیدن ویدیوها این دوره را تهیه کنید</div>
              <p style={{ color: 'var(--muted)', margin: '8px 0 18px' }}>
                این دوره شامل {lessonCount.toLocaleString('fa-IR')} ویدیوی آموزشی است. پس از خرید، همهٔ ویدیوها برای شما باز می‌شود.
              </p>
              <div style={{ maxWidth: 360 }}>
                <BuyCourseButton
                  slug={course.slug}
                  price={course.price}
                  loggedIn={!!user}
                  nextPath={`/online-learning/${course.slug}`}
                />
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 14 }}>
                قیمت دوره: <strong style={{ color: 'var(--dark)' }}>{priceLabel}</strong>
              </p>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/online-learning" className="btn btn--ghost">← بازگشت به دوره‌ها</Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
