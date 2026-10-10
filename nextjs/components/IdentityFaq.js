const QUESTIONS = [
  {
    question: 'خانواده برداشت، خانه برداشت و تک برداشت چه ارتباطی با هم دارند؟',
    answer: 'خانواده برداشت نام جامعه مخاطبان مجموعه است؛ خانه برداشت مرکز آموزشی و تولیدی مجموعه و آموزشگاه آزاد سینمایی تک برداشت نام رسمی آموزشی دارای مجوز آن است.',
  },
  {
    question: 'چرا آموزش اولیه بازیگری در خانه برداشت رایگان است؟',
    answer: 'آموزش اولیه رایگان است تا علاقه‌مندان بتوانند بدون مانع مالی، استعداد و مسیر آموزشی خود را در بازیگری سینما آغاز کنند.',
  },
  {
    question: 'دوره‌ها و شعب خانه برداشت در کدام شهرها فعال است؟',
    answer: 'خانه برداشت در تهران و ساری فعالیت آموزشی دارد و اطلاعات دوره‌ها و زمان ثبت‌نام از طریق وب‌سایت منتشر می‌شود.',
  },
  {
    question: 'متد آموزشی آموزشگاه چیست و توسط چه کسی هدایت می‌شود؟',
    answer: 'مسیر آموزشی بر متد پنج سؤال طلایی استوار است؛ این متد توسط یاسر نظری طراحی و هدایت می‌شود.',
  },
];

export default function IdentityFaq() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: QUESTIONS.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <section className="seo-intro" aria-labelledby="identity-faq-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <div className="container" style={{ maxWidth: 920 }}>
        <h2 id="identity-faq-title" className="heading">پرسش‌های متداول خانه برداشت</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {QUESTIONS.map(({ question, answer }) => (
            <article key={question} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>{question}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 2, margin: 0 }}>{answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
