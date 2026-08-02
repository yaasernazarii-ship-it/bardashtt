import PageLayout from '@/components/PageLayout';
import CoursesExplorer from '@/components/CoursesExplorer';
import PageSlider from '@/components/PageSlider';
import { loadContent, splitLines } from '@/lib/siteContent';

// شماره و رنگِ گرادیانِ هر دوره ثابت‌اند؛ متن و سرفصل‌ها از پنل می‌آیند.
const NUMS = ['۰۱', '۰۲', '۰۳', '۰۴', '۰۵'];
const GRADS = [
  'linear-gradient(135deg,#2a1e0a 0%,#4a3512 100%)',
  'linear-gradient(135deg,#241a2e 0%,#3d2a4d 100%)',
  'linear-gradient(135deg,#0f2417 0%,#1e4030 100%)',
  'linear-gradient(135deg,#161629 0%,#2d2d52 100%)',
  'linear-gradient(135deg,#2a0f0f 0%,#4a1c1c 100%)',
];

export const metadata = {
  title: 'دوره‌های بازیگری',
  description: 'دوره‌های بازیگری مقدماتی، تکمیلی، اردو، پیشرفته و فیلمسازی در خانواده برداشت. ثبت‌نام کاملاً رایگان.',
  alternates: { canonical: 'https://www.bardashtt.com/courses' },
};

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
      icon: t(`course.c${n}.icon`),
      desc: t(`course.c${n}.desc`),
      items: splitLines(t(`course.c${n}.items`)),
    };
  });
  const courseSlides = splitLines(t('courses.slides'));
  return (
    <PageLayout>
      {courseSlides.length > 0 && <PageSlider title={t('courses.title')} images={courseSlides} />}
      <CoursesExplorer
        heading={t('courses.title')}
        subheading={t('courses.subtitle')}
        courses={courses}
        listHeading={t('courses.panel.listHeading')}
        payTitle={t('courses.pay.title')}
        payText={t('courses.pay.text')}
        payButton={t('courses.pay.button')}
      />
    </PageLayout>
  );
}
