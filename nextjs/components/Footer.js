import Icon from './Icon';

// متن و لینک‌های فوتر از پنل («متن صفحات» ← «فوتر») می‌آیند. مقادیر زیر فقط
// پشتیبانِ حالتی هستند که کامپوننت بدون content رندر شود.
const FALLBACK = {
  copyright: '© ۱۴۰۵ خانواده برداشت — تمامی حقوق محفوظ است',
  instagram: 'https://instagram.com/bardashtt',
  bale: 'https://ble.ir/bardasht_family',
  phone: '02191090934',
  enamadId: '6904582',
  enamadCode: 'jrlGjZiXKgnOIz1eCEqYDxlgu851c6iO',
};

// فقط نشانی‌های http(s) پذیرفته می‌شوند تا از راه پنل نتوان javascript: تزریق کرد.
function safeUrl(value) {
  const v = String(value || '').trim();
  return /^https?:\/\//i.test(v) ? v : '';
}

export default function Footer({ content }) {
  const c = { ...FALLBACK, ...(content || {}) };

  // شناسه و کد نماد فقط رقم/حرف مجازند؛ این پاک‌سازی جلوی تزریق HTML از راه پنل را می‌گیرد.
  const enamadId = String(c.enamadId || '').replace(/[^0-9]/g, '');
  const enamadCode = String(c.enamadCode || '').replace(/[^A-Za-z0-9]/g, '');
  const showEnamad = Boolean(enamadId && enamadCode);
  const enamadSeal = showEnamad
    ? `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=${enamadId}&Code=${enamadCode}'><img referrerpolicy='origin' loading='lazy' src='https://trustseal.enamad.ir/logo.aspx?id=${enamadId}&Code=${enamadCode}' alt='نماد اعتماد الکترونیکی' style='cursor:pointer' code='${enamadCode}'></a>`
    : '';

  const instagram = safeUrl(c.instagram);
  const bale = safeUrl(c.bale);
  const phone = String(c.phone || '').replace(/[^0-9+]/g, '');

  return (
    <footer className="site-footer">
      {showEnamad && (
        <div className="sf-seals">
          <div className="sf-enamad" dangerouslySetInnerHTML={{ __html: enamadSeal }} />
        </div>
      )}
      <div className="sf-bottom">
        <p>{c.copyright}</p>
        <div className="sf-social">
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"><Icon name="instagram" size={20} /></a>
          )}
          {bale && (
            <a href={bale} target="_blank" rel="noopener noreferrer" aria-label="بله"><Icon name="chat" size={20} /></a>
          )}
          {phone && <a href={`tel:${phone}`} aria-label="تلفن"><Icon name="phone" size={20} /></a>}
        </div>
      </div>
    </footer>
  );
}
