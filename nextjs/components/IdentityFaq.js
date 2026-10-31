export default function IdentityFaq({ heading, items = [] }) {
  const QUESTIONS = items
    .map((line) => {
      const i = line.indexOf('|');
      return i < 0 ? null : { question: line.slice(0, i).trim(), answer: line.slice(i + 1).trim() };
    })
    .filter((q) => q && q.question && q.answer);
  if (!QUESTIONS.length) return null;
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
        <h2 id="identity-faq-title" className="heading">{heading}</h2>
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
