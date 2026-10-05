'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

// آیکونِ هر مرحله بر اساس ترتیب دوره انتخاب می‌شود تا مستقل از متنِ قابل‌ویرایشِ پنل، تمیز بماند.
const STEP_ICONS = ['sparkles', 'puzzle', 'tent', 'video', 'clapperboard'];

// مقادیر پیش‌فرض؛ متنِ قابل‌ویرایش از پنل روی این‌ها می‌نشیند (courses prop).
const DEFAULT_COURSES = [
  {
    num: '۰۱', title: 'مقدماتی', sub: 'شروع مسیر',
    desc: 'ورود به دنیای بازیگری، کشف استعداد درونی و پرورش بیان، بدن، خلاقیت و تمرکز.',
    items: ['شناخت استعداد درونی', 'بیان', 'بدن', 'خلاقیت', 'تمرکز'],
    grad: 'linear-gradient(135deg,#2a1e0a 0%,#4a3512 100%)',
  },
  {
    num: '۰۲', title: 'تکمیلی', sub: 'عمق مهارت',
    desc: 'تعمیق مهارت‌ها با متدهای حرفه‌ای بازیگری و ساخت و تحلیل شخصیت.',
    items: ['متد اکتینگ لی استراسبرگ', 'متد پنج سؤال طلایی', 'تحلیل شخصیت', 'شخصیت‌پردازی', 'منحنی شخصیت', 'تیپ‌سازی'],
    grad: 'linear-gradient(135deg,#241a2e 0%,#3d2a4d 100%)',
  },
  {
    num: '۰۳', title: 'اردو', sub: 'تجربه عملی',
    desc: 'اردوهای آموزشی برای زیستن با شخصیت و تجربه‌ی فضای واقعی تولید فیلم.',
    items: ['زیست با شخصیت', 'کار گروهی', 'آشنایی با قوانین تولید فیلم', 'اتودهای گروهی'],
    grad: 'linear-gradient(135deg,#0f2417 0%,#1e4030 100%)',
  },
  {
    num: '۰۴', title: 'پیشرفته', sub: 'حرفه‌ای شدن',
    desc: 'بازیگری حرفه‌ای مقابل دوربین و شناخت زبان فنی و روانی سینما.',
    items: ['بازی در قاب سینما', 'شناخت لنزها', 'تدوین برای بازیگر', 'زبان مشترک با کارگردان و عوامل', 'شناخت جایگاه‌ها در سینما', 'روان‌شناسی بازیگر و کارگردان'],
    grad: 'linear-gradient(135deg,#161629 0%,#2d2d52 100%)',
  },
  {
    num: '۰۵', title: 'فیلمسازی', sub: 'زبان سینما',
    desc: 'تجربه‌ی کامل ساخت و بازی در فیلم، از ایده تا اجرا.',
    items: ['ساخت و بازی در فیلم'],
    grad: 'linear-gradient(135deg,#2a0f0f 0%,#4a1c1c 100%)',
  },
];

export default function CoursesExplorer({
  heading = 'مسیر آموزشی خانواده برداشت',
  subheading = '۵ مرحله برای تبدیل علاقه به مهارت حرفه‌ای',
  courses = DEFAULT_COURSES,
  listHeading = 'آنچه یاد می‌گیرید',
  ctaNote = 'تمام دوره‌های اصلی خانواده برداشت بدون شهریه برگزار می‌شود.',
  ctaButton = 'ثبت‌نام در دوره‌های بازیگری',
}) {
  const [active, setActive] = useState(0);
  return (
    <>
      <section className="path-section">
        <div className="path-section__title">
          <h1>{heading}</h1>
          <p>{subheading}</p>
          {/* ثبت‌نام یک‌بار و از دورهٔ مقدماتی انجام می‌شود؛ پس دکمه مستقل از دورهٔ انتخاب‌شده
              و بالای صفحه می‌نشیند تا مسیر ورود هنرجو یکتا و از همان نگاه اول دیده شود. */}
          <Link href="/audition" className="btn btn--gold path-section__cta">{ctaButton}</Link>
          <span className="path-section__note">{ctaNote}</span>
        </div>
        <div className="path-track" role="tablist" aria-orientation="vertical">
          {courses.map((course, i) => (
            <button
              key={course.num}
              type="button"
              role="tab"
              id={`course-tab-${i}`}
              aria-selected={active === i}
              aria-controls={`course-panel-${i}`}
              className={`path-node${active === i ? ' active' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className="path-node__num">{course.num}</span>
              <span className="path-node__text">
                <span className="path-node__title">{course.title}</span>
                <span className="path-node__sub">{course.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      {/* هر پنج پنل در HTML سمت سرور رندر می‌شوند تا شرح و سرفصلِ همهٔ دوره‌ها برای خزندهٔ
          موتور جست‌وجو خوانده شود؛ فقط پنل دورهٔ فعال با کلاس CSS نمایش داده می‌شود. */}
      <section className="detail-wrap">
        {courses.map((c, i) => (
          <div
            key={c.num}
            id={`course-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`course-tab-${i}`}
            className={`course-panel${active === i ? ' active' : ''}`}
          >
            <div className="course-hero" style={{ background: c.grad }}>
              <span className="course-hero__icon"><Icon name={STEP_ICONS[i] || 'sparkles'} size={40} strokeWidth={1.6} /></span>
              <span className="course-hero__badge">دوره {c.num}</span>
              <h2 className="course-hero__title">{c.title}</h2>
              <p className="course-hero__sub">{c.sub}</p>
            </div>
            <div className="panel-head">
              <div className="panel-num">{c.num}</div>
              <div>
                {/* عنوان دوره یک‌بار و در hero تیتر h2 می‌گیرد؛ این تکرارِ بصری است، نه تیتر. */}
                <div className="panel-head__title">{c.title}</div>
                <p>{c.desc}</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="panel-list">
                <h3>{listHeading}</h3>
                <ul>{c.items.map(item => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
