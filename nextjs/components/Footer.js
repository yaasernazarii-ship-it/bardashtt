const ENAMAD_SEAL = `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=6904582&Code=jrlGjZiXKgnOIz1eCEqYDxlgu851c6iO'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=6904582&Code=jrlGjZiXKgnOIz1eCEqYDxlgu851c6iO' alt='نماد اعتماد الکترونیکی' style='cursor:pointer' code='jrlGjZiXKgnOIz1eCEqYDxlgu851c6iO'></a>`;

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="sf-seals">
        <div className="sf-enamad" dangerouslySetInnerHTML={{ __html: ENAMAD_SEAL }} />
      </div>
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
