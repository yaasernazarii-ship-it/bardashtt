import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import CourseList from '@/components/CourseList';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'یادگیری آنلاین',
  description: 'منابع آنلاین آموزشی خانواده برداشت برای تمرین بازیگری در خانه.',
  alternates: { canonical: 'https://www.bardashtt.com/online-learning' },
};

export const dynamic = 'force-dynamic';

const lessons = [
  ['تمرین بیان', 'تمرین‌های روزانه برای وضوح صدا، ریتم و کنترل نفس'],
  ['تمرین بدن', 'آمادگی بدنی، حضور صحنه و هماهنگی حرکت'],
  ['تحلیل متن', 'خواندن درست دیالوگ، شناخت کنش و ساخت شخصیت'],
  ['تمرین مقابل دوربین', 'آشنایی با قاب، نگاه، سکوت و بازی مینیمال'],
];

export default async function OnlineLearningPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('online.title')} subtitle={t('online.subtitle')} tag={t('online.tag')}>
      <div className="stack-card" style={{ marginBottom: 22 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>{t('online.heading')}</h2>
        <p className="body-lg">{t('online.body')}</p>
      </div>
      <div className="responsive-grid-4">
        {lessons.map(([title, text], index) => (
          <div key={title} className="content-card">
            <div className="content-card__icon">{index + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <h2 className="subheading" style={{ margin: '32px 0 16px' }}>دوره‌های آنلاین</h2>
      <CourseList />

      <SectionPosts section="course-video" variant="media" heading="ویدیوهای دورهٔ آنلاین" />
    </SimplePage>
  );
}
