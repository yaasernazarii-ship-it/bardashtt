'use client';
import { useState } from 'react';
import Link from 'next/link';

// مقادیر پیش‌فرض؛ متنِ قابل‌ویرایش از پنل روی این‌ها می‌نشیند (courses prop).
const DEFAULT_COURSES = [
  {
    num: '۰۱', title: 'مقدماتی', sub: 'شروع مسیر',
    desc: 'ورود به دنیای بازیگری، کشف استعداد درونی و پرورش بیان، بدن، خلاقیت و تمرکز.',
    items: ['شناخت استعداد درونی', 'بیان', 'بدن', 'خلاقیت', 'تمرکز'],
    icon: '🎭', grad: 'linear-gradient(135deg,#2a1e0a 0%,#4a3512 100%)',
  },
  {
    num: '۰۲', title: 'تکمیلی', sub: 'عمق مهارت',
    desc: 'تعمیق مهارت‌ها با متدهای حرفه‌ای بازیگری و ساخت و تحلیل شخصیت.',
    items: ['متد اکتینگ لی استراسبرگ', 'متد پنج سؤال طلایی', 'تحلیل شخصیت', 'شخصیت‌پردازی', 'منحنی شخصیت', 'تیپ‌سازی'],
    icon: '🧩', grad: 'linear-gradient(135deg,#241a2e 0%,#3d2a4d 100%)',
  },
  {
    num: '۰۳', title: 'اردو', sub: 'تجربه عملی',
    desc: 'اردوهای آموزشی برای زیستن با شخصیت و تجربه‌ی فضای واقعی تولید فیلم.',
    items: ['زیست با شخصیت', 'کار گروهی', 'آشنایی با قوانین تولید فیلم', 'اتودهای گروهی'],
    icon: '⛺', grad: 'linear-gradient(135deg,#0f2417 0%,#1e4030 100%)',
  },
  {
    num: '۰۴', title: 'پیشرفته', sub: 'حرفه‌ای شدن',
    desc: 'بازیگری حرفه‌ای مقابل دوربین و شناخت زبان فنی و روانی سینما.',
    items: ['بازی در قاب سینما', 'شناخت لنزها', 'تدوین برای بازیگر', 'زبان مشترک با کارگردان و عوامل', 'شناخت جایگاه‌ها در سینما', 'روانشناسی بازیگر و کارگردان'],
    icon: '🎥', grad: 'linear-gradient(135deg,#161629 0%,#2d2d52 100%)',
  },
  {
    num: '۰۵', title: 'فیلمسازی', sub: 'زبان سینما',
    desc: 'تجربه‌ی کامل ساخت و بازی در فیلم، از ایده تا اجرا.',
    items: ['ساخت و بازی در فیلم'],
    icon: '🎬', grad: 'linear-gradient(135deg,#2a0f0f 0%,#4a1c1c 100%)',
  },
];

export default function CoursesExplorer({
  heading = 'مسیر آموزشی خانواده برداشت',
  subheading = '۵ مرحله برای تبدیل علاقه به مهارت حرفه‌ای',
  courses = DEFAULT_COURSES,
  listHeading = 'آنچه یاد می‌گیرید',
  payTitle = 'ثبت‌نام رایگان',
  payText = 'تمام دوره‌های اصلی خانواده برداشت بدون شهریه برگزار می‌شود.',
  payButton = 'شروع ثبت‌نام',
}) {
  const [active, setActive] = useState(0);
  const c = courses[active];
  return (
    <>
      <section className="path-section">
        <div className="path-section__title">
          <h1>{heading}</h1>
          <p>{subheading}</p>
        </div>
        <div className="path-track">
          {courses.map((course, i) => (
            <button key={course.num} className={`path-node${active === i ? ' active' : ''}`} onClick={() => setActive(i)}>
              <span className="path-node__num">{course.num}</span>
              <span className="path-node__title">{course.title}</span>
              <span className="path-node__sub">{course.sub}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="detail-wrap">
        <div className="course-panel active">
          <div className="course-hero" style={{ background: c.grad }}>
            <span className="course-hero__icon">{c.icon}</span>
            <span className="course-hero__badge">دوره {c.num}</span>
            <h2 className="course-hero__title">{c.title}</h2>
            <p className="course-hero__sub">{c.sub}</p>
          </div>
          <div className="panel-head">
            <div className="panel-num">{c.num}</div>
            <div>
              <h2>{c.title}</h2>
              <p>{c.desc}</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-list">
              <h4>{listHeading}</h4>
              <ul>{c.items.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="payment-box">
              <h3>{payTitle}</h3>
              <p>{payText}</p>
              <Link href="/audition" className="btn btn--dark btn--full">{payButton}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
