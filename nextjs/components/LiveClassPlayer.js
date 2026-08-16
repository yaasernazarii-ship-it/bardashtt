// پلیرِ Responsive برای پخش زنده/ضبط‌شدهٔ کلاس آنلاین. src از سرور (فقط پس از تأیید دسترسی) می‌آید.
export default function LiveClassPlayer({ src, title = 'پخش کلاس' }) {
  if (!src) return null;
  return (
    <div className="live-player">
      <span className="live-player__ratio" />
      <iframe
        className="live-player__frame"
        src={src}
        title={title}
        scrolling="no"
        allowFullScreen
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
