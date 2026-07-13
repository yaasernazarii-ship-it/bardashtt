import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Accordion from '@/components/Accordion';

export const metadata = {
  title: 'سوالات متداول',
  description: 'پاسخ به سوالات پرتکرار درباره دوره‌ها، ثبت‌نام، آزمون و گواهینامه خانواده برداشت.',
};

const groups = [
  {
    title: 'ثبت‌نام و پذیرش', tag: 'tag--gold', items: [
      { q: 'آیا واقعاً آموزش رایگان است؟', a: 'بله، کاملاً رایگان است. خانواده برداشت از ابتدا با هدف دموکراتیزه کردن آموزش بازیگری تأسیس شده و تمام دوره‌های اصلی بدون هیچ هزینه‌ای ارائه می‌شوند.' },
      { q: 'شرط سنی برای ثبت‌نام وجود دارد؟', a: 'خیر، خانواده برداشت برای تمامی سنین پذیرنده است. از کودکان تا بزرگسالان می‌توانند در دوره‌های مناسب سن خود شرکت کنند.' },
      { q: 'آیا نیاز به تجربه قبلی دارم؟', a: 'خیر. دوره مقدماتی برای افراد بدون هیچ تجربه‌ای طراحی شده است. فقط علاقه و تعهد نیاز است.' },
      { q: 'چطور ثبت‌نام کنم؟', a: 'از طریق سایت در بخش ثبت‌نام، اطلاعات خود را وارد کنید. پس از بررسی، تیم پشتیبانی با شما تماس می‌گیرد.' },
    ],
  },
  {
    title: 'دوره‌ها و آموزش', tag: 'tag--dark', items: [
      { q: 'طول هر دوره چقدر است؟', a: 'هر دوره اصلی بسته به محتوا بین ۲ تا ۴ ماه طول می‌کشد. اردوها از ۲۴ ساعته تا ۱۰ روزه برگزار می‌شوند.' },
      { q: 'آیا گواهینامه صادر می‌شود؟', a: 'بله. پس از اتمام موفقیت‌آمیز هر دوره، گواهینامه رسمی صادر می‌شود.' },
      { q: 'آیا می‌توانم از اول وارد دوره پیشرفته شوم؟', a: 'خیر. ورود به هر مرحله نیاز به گذراندن مرحله قبلی دارد.' },
    ],
  },
  {
    title: 'بیمه و ایمنی', tag: 'tag--dark', items: [
      { q: 'آیا هنرجویان بیمه می‌شوند؟', a: 'بله. خانواده برداشت برای هنرجویان در طول دوره‌ها و اردوها بیمه صادر می‌کند.' },
    ],
  },
];

export default function FaqPage() {
  return (
    <PageLayout>
      <div className="page-header">
        <h1>سوالات متداول</h1>
        <p>پاسخ سوال‌های رایج درباره خانواده برداشت</p>
        <div className="breadcrumb"><Link href="/">خانه</Link> › سوالات متداول</div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container container--sm">
          {groups.map(group => (
            <div key={group.title} style={{ marginBottom: 48 }}>
              <span className={`tag ${group.tag}`} style={{ marginBottom: 20 }}>{group.title}</span>
              <Accordion items={group.items} />
            </div>
          ))}
          <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>سوالتان اینجا نیست؟</h3>
            <p style={{ color: 'rgba(255,255,255,.6)', marginBottom: 28 }}>مستقیم با ما تماس بگیرید</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="tel:02191090934" className="btn btn--gold">📞 تماس تلفنی</a>
              <a href="https://instagram.com/bardashtt" target="_blank" rel="noopener noreferrer" className="btn btn--outline" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>📸 اینستاگرام</a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
