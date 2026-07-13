import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="sf-bottom">
        <p>© ۱۴۰۳ خانواده برداشت — تمامی حقوق محفوظ است</p>
        <div className="sf-social">
          <a href="https://instagram.com/bardashtt" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام">📸</a>
          <a href="https://ble.ir/bardasht_family" target="_blank" rel="noopener noreferrer" aria-label="بله">💬</a>
          <a href="tel:02191090934" aria-label="تلفن">📞</a>
        </div>
      </div>
    </footer>
  );
}
