import PageLayout from '@/components/PageLayout';
import CoursesExplorer from '@/components/CoursesExplorer';
import PageSlider from '@/components/PageSlider';
import { loadContent, splitLines } from '@/lib/siteContent';
import { courseListJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/siteUrl';
import { pageMetadata } from '@/lib/pageMeta';

// شماره و رنگِ گرادیانِ هر دوره ثابت‌اند؛ متن و سرفصل‌ها از پنل می‌آیند.
const NUMS = ['۰۱', '۰۲', '۰۳', '۰۴', '۰۵'];
const GRADS = [
  'linear-gradient(135deg,#2a1e0a 0%,#4a3512 100%)',
  'linear-gradient(135deg,#241a2e 0%,#3d2a4d 100%)',
  'linear-gradient(135deg,#0f2417 0%,#1e4030 100%)',
  'linear-gradient(135deg,#161629 0%,#2d2d52 100%)',
  'linear-gradient(135deg,#2a0f0f 0%,#4a1c1c 100%)',
];

export async function generateMetadata() {
  return pageMetadata('courses');
}

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const t = await loadContent();
  const courses = NUMS.map((num, i) => {
    const n = i + 1;
    return {
      num,
      grad: GRADS[i],
      title: t(`course.c${n}.title`),
      sub: t(`course.c${n}.sub`),
      desc: t(`course.c${n}.desc`),
      items: splitLines(t(`course.c${n}.items`)),
    };
  });
  const courseSlides = splitLines(t('courses.slides'));
  const site = await siteUrl();
  const url = `${site}/courses`;
  const courseLd = courseListJsonLd(
    courses.map((c) => ({ name: c.title, description: c.desc, items: c.items })),
    { site, url },
  );
  const breadcrumbLd = breadcrumbJsonLd([{ name: 'خانه', url: site }, { name: t('courses.title') }]);
  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(courseLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      {courseSlides.length > 0 && <PageSlider title={t('courses.title')} images={courseSlides} />}
      <CoursesExplorer
        heading={t('courses.title')}
        subheading={t('courses.subtitle')}
        courses={courses}
        listHeading={t('courses.panel.listHeading')}
        ctaNote={t('courses.cta.note')}
        ctaButton={t('courses.cta.button')}
      />
    </PageLayout>
  );
}
