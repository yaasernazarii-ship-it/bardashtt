import { liveBooks } from '@/lib/books';
import { aparatEmbedUrl } from '@/lib/aparat';
import BookOrderForm from '@/components/BookOrderForm';

// فهرست کتاب‌های فروشی + فرم ثبت سفارش برای هر کتاب.
export default async function BookList() {
  const books = await liveBooks();
  if (books.length === 0) {
    return <p style={{ color: 'var(--muted)' }}>هنوز کتابی برای فروش ثبت نشده است.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {books.map((b) => {
        const paragraphs = (b.description || '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
        const embed = aparatEmbedUrl(b.aparatUrl);
        return (
          <div key={b.id} className="stack-card book-card">
            <div className="book-card__head">
              {b.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="book-card__cover" src={b.coverImage} alt={b.title} loading="lazy" />
              )}
              <div className="book-card__info">
                <h3 className="subheading" style={{ marginBottom: 4 }}>{b.title}</h3>
                {b.author && <p style={{ color: 'var(--muted)', marginBottom: 8 }}>نویسنده: {b.author}</p>}
                <div className="book-card__price">
                  {b.price > 0 ? `${b.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}
                </div>
                {paragraphs.map((para, i) => (
                  <p key={i} className="post-article__p" style={{ marginTop: 8 }}>{para}</p>
                ))}
              </div>
            </div>
            {embed && (
              <div className="book-card__video">
                <iframe src={embed} title={b.title} allowFullScreen allow="autoplay; fullscreen" />
              </div>
            )}
            {b.audioUrl && (
              <audio className="book-card__audio" src={b.audioUrl} controls preload="none" />
            )}
            <BookOrderForm slug={b.slug} price={b.price} />
          </div>
        );
      })}
    </div>
  );
}
