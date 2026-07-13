'use client';
import { useState } from 'react';
import Link from 'next/link';

const courses = [
  {
    num: '۰۱', title: 'مقدماتی', sub: 'شروع مسیر',
    desc: 'ورود به دنیای بازیگری، شناخت بدن، بیان، تمرکز و کشف توانایی‌های شخصی.',
    items: ['شناخت بدن و بیان', 'تمرین تمرکز و مشاهده', 'بداهه‌پردازی پایه', 'آشنایی با متن و نقش'],
  },
  {
    num: '۰۲', title: 'تکمیلی', sub: 'عمق مهارت',
    desc: 'تعمیق مهارت‌های پایه، کار با متن‌های حرفه‌ای و ساخت شخصیت.',
    items: ['تحلیل متن و شخصیت', 'تمرین دیالوگ', 'کار گروهی و پارتنر', 'تمرین‌های پیشرفته بیان'],
  },
  {
    num: '۰۳', title: 'اردو', sub: 'تجربه عملی',
    desc: 'اردوهای آموزشی ۲۴ ساعته تا ۱۰ روزه برای تجربه فضای واقعی تولید.',
    items: ['تجربه محیط تولید', 'تمرین جلوی دوربین', 'هماهنگی گروه تولید', 'آشنایی با نظم آفیش'],
  },
  {
    num: '۰۴', title: 'پیشرفته', sub: 'حرفه‌ای شدن',
    desc: 'بازیگری حرفه‌ای با تکنیک‌های استاندارد و آماده‌سازی برای پروژه‌های جدی.',
    items: ['تکنیک‌های استانیسلاوسکی', 'تحلیل پیشرفته نقش', 'تمرین صحنه‌های جدی', 'آمادگی برای تست بازیگری'],
  },
  {
    num: '۰۵', title: 'فیلمسازی', sub: 'زبان سینما',
    desc: 'آشنایی با زبان سینما، بازی مقابل دوربین و فرآیند تولید آثار تصویری.',
    items: ['بازی مقابل دوربین', 'شناخت قاب و میزانسن', 'تعامل با کارگردان', 'تولید تمرین‌های کوتاه'],
  },
];

export default function CoursesExplorer() {
  const [active, setActive] = useState(0);
  const c = courses[active];
  return (
    <>
      <section className="path-section">
        <div className="path-section__title">
          <h1>مسیر آموزشی خانواده برداشت</h1>
          <p>۵ مرحله برای تبدیل علاقه به مهارت حرفه‌ای</p>
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
          <div className="panel-head">
            <div className="panel-num">{c.num}</div>
            <div>
              <h2>{c.title}</h2>
              <p>{c.desc}</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-list">
              <h4>آنچه یاد می‌گیرید</h4>
              <ul>{c.items.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="payment-box">
              <h3>ثبت‌نام رایگان</h3>
              <p>تمام دوره‌های اصلی خانواده برداشت بدون شهریه برگزار می‌شود.</p>
              <Link href="/audition" className="btn btn--dark btn--full">شروع ثبت‌نام</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
