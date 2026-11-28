import { liveBooks } from '@/lib/books';
import { aparatEmbedUrl } from '@/lib/aparat';
import BookOrderForm from '@/components/BookOrderForm';

function shortDescription(description) {
  const text = (description || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 220) return text;
  return `${text.slice(0, 217).trimEnd()}…`;
}

export default async function BookList() {
  const books = await liveBooks();
  if (books.length === 0) {
    return <p style={{ color: 'var(--muted)' }}>هنوز کتابی برای فروش ثبت نشده است.</p>;
  }

  return (
    <div className="book-list">
      {books.map((b) => {
        const paragraphs = (b.description || '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
        const embed = aparatEmbedUrl(b.aparatUrl);
        return (
          <article key={b.id} className="stack-card book-card">
            <div className="book-card__head">
              {b.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="book-card__cover" src={b.coverImage} alt={`جلد کتاب ${b.title}`} loading="lazy" />
              )}
              <div className="book-card__info">
                <span className="book-card__eyebrow">معرفی کتاب</span>
                <h3 className="subheading">{b.title}</h3>
                {b.author && <p className="book-card__author">نویسنده: {b.author}</p>}
                {shortDescription(b.description) && (
                  <p className="book-card__summary">{shortDescription(b.description)}</p>
                )}
                <div className="book-card__price">
                  {b.price > 0 ? `${b.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}
                </div>
              </div>
            </div>

            {(paragraphs.length > 0 || embed || b.audioUrl) && (
              <details className="book-card__details">
                <summary>بیشتر دربارهٔ کتاب</summary>
                <div className="book-card__details-body">
                  {paragraphs.map((para, i) => (
                    <p key={i} className="post-article__p">{para}</p>
                  ))}
                  {embed && (
                    <div className="book-card__video">
                      <iframe src={embed} title={`ویدیوی معرفی ${b.title}`} allowFullScreen allow="autoplay; fullscreen" />
                    </div>
                  )}
                  {b.audioUrl && <audio className="book-card__audio" src={b.audioUrl} controls preload="none" />}
                </div>
              </details>
            )}

            <BookOrderForm slug={b.slug} title={b.title} price={b.price} />
          </article>
        );
      })}
    </div>
  );
}
