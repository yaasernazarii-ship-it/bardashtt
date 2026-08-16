// ساخت PDF گواهی‌نامهٔ پایان دوره با pdfkit (A4 افقی، فارسی راست‌چین).
// طرح از چند لایه ساخته می‌شود: زمینهٔ کرم، قاب دولایهٔ طلایی، گل‌آذینِ گوشه‌ها،
// رزتِ کم‌رنگِ پس‌زمینه (همان بافتِ امنیتیِ اسناد رسمی)، متن اصلی، و نوار پایین
// شامل کد استعلام، QR استعلام آنلاین و محل مهر و امضا.
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { shape } from './rtl';
import { SCHOOL_NAME, SCHOOL_PHONE, COURSE_HOURS, GRADUATION_FIELD, formatScore, honorific } from './exam';
import { qrMatrix } from './qr';

const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Regular.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Bold.ttf');
const LOGO = path.join(process.cwd(), 'assets/cert-logo.png');
// نشان سازمان آموزش فنی و حرفه‌ای؛ تا وقتی فایلش روی سرور نباشد، سربرگ بدون آن کشیده می‌شود.
const LOGO_TVTO = path.join(process.cwd(), 'assets/cert-logo-tvto.png');
const SIGNATURE = path.join(process.cwd(), 'assets/cert-signature.png');
const STAMP = path.join(process.cwd(), 'assets/cert-stamp.png');

const VERIFY_BASE = 'https://bardashtt.com/verify';

const GOLD = '#b08d3f';
const GOLD_SOFT = '#d9c48c';
const CREAM = '#fdfaf3';
const INK = '#191510';
const MUTED = '#6a6153';

// ارقام لاتین به فارسی؛ نقطهٔ اعشار هم به جداکنندهٔ فارسی تبدیل می‌شود.
const fa = (value) => String(value ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g, '٫');

const fmtDate = (d) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long', timeZone: 'Asia/Tehran' }).format(new Date(d));
  } catch {
    return String(d ?? '');
  }
};

// ── ابزارهای متن ────────────────────────────────────────────────
// raw برای رشته‌هایی که فقط لاتین‌اند (مثل نشانی سایت)؛ آن‌ها نباید از shape رد شوند
// چون در نبودِ متن فارسی، pdfkit معکوسشان نمی‌کند و از پیش‌معکوس‌سازی وارونه درمی‌آیند.
function write(doc, text, x, y, width, { size = 12, bold = false, color = INK, align = 'right', raw = false } = {}) {
  doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(size).fillColor(color);
  doc.text(raw ? String(text) : shape(text), x, y, { width, align, features: [], lineBreak: false });
  return doc.y;
}

function center(doc, text, y, { size = 12, bold = false, color = INK } = {}) {
  const W = doc.page.width;
  return write(doc, text, 40, y, W - 80, { size, bold, color, align: 'center' });
}

function textWidth(doc, text, size, bold) {
  doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(size);
  return doc.widthOfString(shape(text), { features: [] });
}

// ── اجزای تزئینی ────────────────────────────────────────────────
function diamond(doc, cx, cy, r, color = GOLD) {
  doc.moveTo(cx, cy - r).lineTo(cx + r, cy).lineTo(cx, cy + r).lineTo(cx - r, cy).closePath().fillColor(color).fill();
}

// خط تزئینیِ وسط‌چین با لوزیِ میانی
function divider(doc, cx, cy, half) {
  doc.moveTo(cx - half, cy).lineTo(cx - 9, cy).lineWidth(0.9).strokeColor(GOLD).stroke();
  doc.moveTo(cx + 9, cy).lineTo(cx + half, cy).lineWidth(0.9).strokeColor(GOLD).stroke();
  diamond(doc, cx, cy, 3.6);
}

// گل‌آذینِ گوشه: دو کمانِ هم‌مرکز و یک لوزی. sx/sy جهت گوشه را می‌چرخاند.
function cornerOrnament(doc, x, y, sx, sy) {
  doc.save();
  doc.translate(x, y).scale(sx, sy);
  doc.path('M 0 46 A 46 46 0 0 1 46 0').lineWidth(1.1).strokeColor(GOLD).stroke();
  doc.path('M 0 32 A 32 32 0 0 1 32 0').lineWidth(0.5).strokeColor(GOLD_SOFT).stroke();
  diamond(doc, 27, 27, 3);
  doc.restore();
}

// رزتِ کم‌رنگِ پس‌زمینه: بیضی‌های چرخانِ هم‌مرکز، همان بافتی که روی اسناد بهادار دیده می‌شود.
function rosette(doc, cx, cy, rx, ry, count) {
  doc.save();
  doc.opacity(0.05);
  doc.translate(cx, cy);
  for (let i = 0; i < count; i++) {
    doc.save();
    doc.rotate((180 / count) * i);
    doc.ellipse(0, 0, rx, ry).lineWidth(0.5).strokeColor(GOLD).stroke();
    doc.restore();
  }
  doc.restore();
  doc.opacity(1);
}

// ── QR استعلام ─────────────────────────────────────────────────
function drawQr(doc, payload, x, y, box) {
  const m = qrMatrix(payload);
  const n = m.length;
  const quiet = 3; // حاشیهٔ سفیدِ لازم برای خوانده‌شدن کد
  const unit = box / (n + quiet * 2);

  doc.rect(x, y, box, box).fillColor('#ffffff').fill();
  doc.rect(x, y, box, box).lineWidth(0.6).strokeColor(GOLD_SOFT).stroke();

  doc.fillColor(INK);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!m[r][c]) continue;
      doc.rect(x + (c + quiet) * unit, y + (r + quiet) * unit, unit + 0.2, unit + 0.2).fill();
    }
  }
}

export async function buildCertificatePdf(cert) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    // همهٔ اجزا با مختصات مطلق چیده می‌شوند؛ حاشیهٔ صفر جلوی صفحهٔ اضافیِ ناخواسته را می‌گیرد.
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: `گواهی‌نامهٔ فارغ‌التحصیلی — ${cert.serial}`,
      Author: SCHOOL_NAME,
      Subject: `گواهی‌نامهٔ فارغ‌التحصیلی رشتهٔ ${GRADUATION_FIELD}`,
    },
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', resolve));

  const W = doc.page.width;
  const H = doc.page.height;
  const CX = W / 2;

  // زمینه و قاب
  doc.rect(20, 20, W - 40, H - 40).fillColor(CREAM).fill();
  doc.rect(20, 20, W - 40, H - 40).lineWidth(2.6).strokeColor(GOLD).stroke();
  doc.rect(29, 29, W - 58, H - 58).lineWidth(0.6).strokeColor(GOLD_SOFT).stroke();

  cornerOrnament(doc, 38, 38, 1, 1);
  cornerOrnament(doc, W - 38, 38, -1, 1);
  cornerOrnament(doc, 38, H - 38, 1, -1);
  cornerOrnament(doc, W - 38, H - 38, -1, -1);

  rosette(doc, CX, H / 2 + 6, 168, 58, 18);

  // سربرگ
  doc.image(LOGO, CX - 30, 46, { height: 64 });
  if (fs.existsSync(LOGO_TVTO)) doc.image(LOGO_TVTO, W - 178, 50, { height: 58 });
  center(doc, SCHOOL_NAME, 120, { size: 13.5, bold: true, color: MUTED });
  center(doc, 'گواهی‌نامهٔ فارغ‌التحصیلی', 142, { size: 29, bold: true, color: GOLD });
  divider(doc, CX, 194, 118);

  // متن اصلی
  center(doc, 'گواهی می‌شود', 212, { size: 11.5, color: MUTED });

  const title = honorific(cert.gender);
  const holder = title ? `${title} ${cert.fullName}` : cert.fullName;
  center(doc, holder, 236, { size: 25, bold: true, color: INK });

  // زیرخطِ نامِ دارنده، به اندازهٔ خودِ نام
  const nameHalf = Math.min(Math.max(textWidth(doc, holder, 25, true) / 2 + 34, 110), (W - 160) / 2);
  const underlineY = 276;
  doc.moveTo(CX - nameHalf, underlineY).lineTo(CX + nameHalf, underlineY).lineWidth(0.8).strokeColor(GOLD_SOFT).stroke();
  diamond(doc, CX - nameHalf, underlineY, 2.4, GOLD_SOFT);
  diamond(doc, CX + nameHalf, underlineY, 2.4, GOLD_SOFT);

  center(doc, `در ${SCHOOL_NAME} ${fa(COURSE_HOURS)} ساعت آموزش گذرانده`, 296, { size: 13, color: INK });

  // فقط نمرهٔ نهایی (جمع آزمون و نمرهٔ کلاسی) روی گواهی درج می‌شود؛
  // ریز نمره عمداً نمی‌آید و فقط در پنل مدیریت و کارنامهٔ خود هنرجو دیده می‌شود.
  const scoreLine = Number.isFinite(cert.percent)
    ? `و با نمرهٔ ${fa(formatScore(cert.percent))} از ۱۰۰ از رشتهٔ ${GRADUATION_FIELD} فارغ‌التحصیل گردید.`
    : `از رشتهٔ ${GRADUATION_FIELD} فارغ‌التحصیل گردید.`;
  center(doc, scoreLine, 322, { size: 13, color: INK });

  divider(doc, CX, 372, 46);

  // ── نوار پایین ───────────────────────────────────────────────
  const footY = H - 160;

  // راست: شناسهٔ گواهی
  const infoW = 250;
  const infoX = W - 58 - infoW;
  let infoY = footY;
  write(doc, `کد استعلام: ${cert.serial}`, infoX, infoY, infoW, { size: 12, bold: true });
  infoY += 21;
  write(doc, `تاریخ صدور: ${fmtDate(cert.issuedAt)}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });
  if (cert.nationalId) {
    infoY += 18;
    write(doc, `کد ملی: ${fa(cert.nationalId)}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });
  }
  if (cert.branch) {
    infoY += 18;
    write(doc, `شعبه: ${cert.branch}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });
  }
  infoY += 18;
  write(doc, `تلفن آموزشگاه: ${SCHOOL_PHONE}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });

  // وسط: QR استعلام آنلاین
  const qrBox = 76;
  drawQr(doc, `${VERIFY_BASE}?code=${cert.serial}`, CX - qrBox / 2, footY - 10, qrBox);
  write(doc, 'استعلام آنلاین اعتبار', CX - 95, footY + qrBox - 3, 190, { size: 9, color: MUTED, align: 'center' });
  write(doc, 'bardashtt.com/verify', CX - 95, footY + qrBox + 10, 190, { size: 9, color: MUTED, align: 'center', raw: true });

  // چپ: محل مهر و امضا. تصویر امضا و مهر اختیاری است؛ تا وقتی اسکنشان روی سرور
  // قرار نگرفته، فقط خط و عنوانِ محلِ امضا چاپ می‌شود و گواهی دستی مهر می‌خورد.
  const signW = 214;
  const signX = 58;
  if (fs.existsSync(SIGNATURE)) doc.image(SIGNATURE, signX + 20, footY + 6, { fit: [112, 46] });
  if (fs.existsSync(STAMP)) {
    doc.save();
    doc.opacity(0.88);
    doc.image(STAMP, signX + signW - 74, footY - 6, { fit: [70, 70] });
    doc.opacity(1);
    doc.restore();
  }
  doc.moveTo(signX + 12, footY + 58).lineTo(signX + signW - 12, footY + 58).lineWidth(0.7).strokeColor('#b9b1a2').stroke();
  write(doc, 'مهر و امضای مدیریت آموزشگاه', signX, footY + 66, signW, { size: 10.5, color: MUTED, align: 'center' });

  if (cert.revoked) {
    doc.save();
    doc.translate(CX, H / 2).rotate(-16);
    doc.opacity(0.2);
    doc.font(FONT_BOLD).fontSize(74).fillColor('#dc2626');
    doc.text(shape('باطل شد'), -220, -46, { width: 440, align: 'center', features: [], lineBreak: false });
    doc.opacity(1);
    doc.restore();
  }

  doc.end();
  await done;
  return Buffer.concat(chunks);
}
