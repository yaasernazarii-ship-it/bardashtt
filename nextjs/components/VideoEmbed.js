import { embedSrc } from '@/lib/embed';

// نمایشِ یک ویدیوی امبد (آپارات یا سرویس محدودسازیِ دامنه) داخل قابِ ۱۶:۹.
export default function VideoEmbed({ url, title }) {
  const src = embedSrc(url);
  if (!src) return null;
  return (
    <div className="post-card__video" style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <iframe src={src} title={title || 'ویدیو'} allowFullScreen allow="autoplay; fullscreen" />
    </div>
  );
}
