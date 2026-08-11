// ساخت PDF گواهی‌نامهٔ پایان دوره با pdfkit (A4 افقی، فارسی راست‌چین).
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { shape } from './rtl';
import { SCHOOL_NAME, honorific } from './exam';

const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Regular.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Bold.ttf');

const GOLD = '#b08d3f';
const INK = '#12100c';
const MUTED = '#5b5449';

const fmtDate = (d) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long', timeZone: 'Asia/Tehran' }).format(new Date(d));
  } catch {
    return String(d ?? '');
  }
};

// یک خط متنِ وسط‌چین در عرض کاملِ صفحه.
function center(doc, text, y, { size = 14, bold = false, color = INK } = {}) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(size).fillColor(color);
  doc.text(shape(text), left, y, { width, align: 'center', features: [] });
  return doc.y;
}

export async function buildCertificatePdf(cert) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', resolve));

  const W = doc.page.width;
  const H = doc.page.height;

  // قاب طلایی دولایه
  doc.rect(24, 24, W - 48, H - 48).lineWidth(3).strokeColor(GOLD).stroke();
  doc.rect(34, 34, W - 68, H - 68).lineWidth(0.8).strokeColor(GOLD).stroke();

  let y = 70;
  y = center(doc, SCHOOL_NAME, y, { size: 22, bold: true, color: INK });
  y = center(doc, 'گواهی‌نامهٔ پایان دوره', y + 10, { size: 30, bold: true, color: GOLD });

  doc.moveTo(W / 2 - 90, y + 16).lineTo(W / 2 + 90, y + 16).lineWidth(1).strokeColor(GOLD).stroke();

  y = center(doc, 'بدین‌وسیله گواهی می‌شود', y + 34, { size: 13, color: MUTED });

  const title = honorific(cert.gender);
  const holder = title ? `${title} ${cert.fullName}` : cert.fullName;
  y = center(doc, holder, y + 12, { size: 26, bold: true, color: INK });

  const course = cert.courseTitle ? `دورهٔ ${cert.courseTitle}` : 'دورهٔ آموزشی بازیگری';
  const branch = cert.branch ? ` (شعبهٔ ${cert.branch})` : '';
  y = center(doc, `${course}${branch} را با موفقیت به پایان رسانده`, y + 14, { size: 14, color: INK });

  const scoreLine = Number.isInteger(cert.percent)
    ? `و با کسب نمرهٔ نهایی ${cert.percent} از ۱۰۰ پذیرفته شده است.`
    : 'و در آزمون پایان دوره پذیرفته شده است.';
  y = center(doc, scoreLine, y + 8, { size: 14, color: INK });

  // ریز نمره فقط وقتی درج می‌شود که نمرهٔ کلاسی ثبت شده باشد.
  if (Number.isInteger(cert.classScore) && Number.isInteger(cert.examPercent)) {
    y = center(doc, `(آزمون کتبی: ${cert.examPercent} درصد — تکلیف و فعالیت کلاسی: ${cert.classScore} از ۲۰)`, y + 6, { size: 11, color: MUTED });
  }

  // نوار پایین: کد استعلام، تاریخ صدور، محل امضا
  const baseY = H - 150;
  doc.font(FONT_BOLD).fontSize(12).fillColor(INK);
  doc.text(shape(`کد استعلام: ${cert.serial}`), 56, baseY, { width: 240, align: 'right', features: [] });
  doc.font(FONT_REGULAR).fontSize(11).fillColor(MUTED);
  doc.text(shape(`تاریخ صدور: ${fmtDate(cert.issuedAt)}`), 56, baseY + 20, { width: 240, align: 'right', features: [] });
  doc.text(shape('اعتبار این گواهی از bardashtt.com/verify قابل استعلام است.'), 56, baseY + 38, {
    width: 300,
    align: 'right',
    features: [],
  });

  doc.moveTo(W - 250, baseY + 34).lineTo(W - 90, baseY + 34).lineWidth(0.8).strokeColor('#999').stroke();
  doc.font(FONT_REGULAR).fontSize(11).fillColor(MUTED);
  doc.text(shape('مهر و امضای مدیریت آموزشگاه'), W - 300, baseY + 42, { width: 210, align: 'center', features: [] });

  if (cert.revoked) {
    doc.font(FONT_BOLD).fontSize(60).fillColor('#dc2626').opacity(0.25);
    doc.text(shape('باطل شد'), 0, H / 2 - 30, { width: W, align: 'center', features: [] });
    doc.opacity(1);
  }

  doc.end();
  await done;
  return Buffer.concat(chunks);
}
