// ساخت PDF گواهی‌نامهٔ پایان دوره با pdfkit (A4 افقی، فارسی راست‌چین).
// طرح از چند لایه ساخته می‌شود: زمینهٔ کرم، قاب دولایهٔ طلایی، گل‌آذینِ گوشه‌ها،
// رزتِ کم‌رنگِ پس‌زمینه (همان بافتِ امنیتیِ اسناد رسمی)، متن اصلی، و نوار پایین
// شامل کد استعلام، QR استعلام آنلاین و محل مهر و امضا.
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { shape } from './rtl';
import {
  SCHOOL_NAME,
  SCHOOL_PHONE,
  SCHOOL_LICENSE,
  TVTO_NAME,
  COURSE_HOURS,
  GRADUATION_BRANCH,
  GRADUATION_FIELD,
  formatScore,
  honorific,
} from './exam';
import { qrMatrix } from './qr';

const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Regular.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Bold.ttf');
const LOGO = path.join(process.cwd(), 'assets/cert-logo.png');
// نشان سازمان آموزش فنی و حرفه‌ای؛ تا وقتی فایلش روی سرور نباشد، سربرگ بدون آن کشیده می‌شود.
const LOGO_TVTO = path.join(process.cwd(), 'assets/cert-logo-tvto.png');
const SIGNATURE = path.join(process.cwd(), 'assets/cert-signature.png');
const STAMP = path.join(process.cwd(), 'assets/cert-stamp.png');

// نشانیِ داخل QR باید همان دامنهٔ رسمی (www) باشد؛ دامنهٔ بدون www با ۳۰۱ به همین‌جا
// می‌رسد ولی یک پرشِ اضافه دارد و بعضی اسکنرهای داخلِ اپلیکیشن‌ها ریدایرکت را دنبال نمی‌کنند.
const VERIFY_BASE = 'https://www.bardashtt.com/verify';

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

// فاصلهٔ چسبان: عبارت‌هایی مثل نامِ رشته نباید وسطش به سطر بعد بیفتد. متن با این نویسه
// به‌هم چسبانده می‌شود، سطربند آن را یک کلمه می‌بیند و پیش از رسم دوباره فاصلهٔ عادی می‌شود.
const GLUE = '\u00A0';
const unglue = (s) => String(s).replace(/\u00A0/g, ' ');
const glue = (s) => String(s).replace(/ /g, GLUE);

// شکستنِ دستیِ بند به سطر. سطربندیِ خودِ pdfkit اینجا کار نمی‌کند، چون متن پیش از رسم
// با shape() معکوس و چسبانده شده و pdfkit آن را رشته‌ای بی‌معنا می‌بیند؛ اگر خودش
// بشکند، کلمه‌ها جابه‌جا می‌افتند. پس عرض هر سطر را قبل از shape اندازه می‌گیریم.
function wrapLines(doc, text, maxWidth, size, bold) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/[^\S\u00A0]+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidth(doc, unglue(candidate), size, bold) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// سطربندیِ متوازن: اول کمترین تعداد سطرِ ممکن گرفته می‌شود، بعد باریک‌ترین عرضی که باز
// هم با همان تعداد سطر جا می‌شود. بدون این کار سطر آخر یک‌کلمه‌ای می‌افتد و متنِ
// وسط‌چینِ گواهی نامتوازن دیده می‌شود.
function balancedLines(doc, text, maxWidth, size, bold) {
  const target = wrapLines(doc, text, maxWidth, size, bold).length;
  // کفِ جست‌وجو نمی‌تواند از پهن‌ترین کلمه (یا عبارتِ چسبان) کمتر باشد، وگرنه سطربند
  // در عرض‌های خیلی کوچک هم همان تعداد سطر را برمی‌گرداند و نتیجه بی‌معنا می‌شود.
  const widest = Math.max(
    ...String(text).split(/[^\S\u00A0]+/).filter(Boolean).map((w) => textWidth(doc, unglue(w), size, bold)),
  );
  let lo = Math.ceil(widest);
  let hi = maxWidth;
  let best = maxWidth;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (wrapLines(doc, text, mid, size, bold).length <= target) {
      best = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return wrapLines(doc, text, best, size, bold);
}

// بند وسط‌چینِ چندسطری؛ ارتفاعِ اشغال‌شده برمی‌گردد تا اجزای بعدی زیرش بنشینند.
function paragraph(doc, text, y, maxWidth, { size = 12.5, bold = false, color = INK, lineHeight = 24 } = {}) {
  const W = doc.page.width;
  const lines = balancedLines(doc, text, maxWidth, size, bold);
  lines.forEach((line, i) => {
    write(doc, unglue(line), 40, y + i * lineHeight, W - 80, { size, bold, color, align: 'center' });
  });
  return lines.length * lineHeight;
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

// ── عکس پرسنلیِ دارنده ──────────────────────────────────────────
const PHOTO_W = 68; // نسبت ۳×۴ در واحد pt؛ روی A4 حدود ۲٫۴ در ۳٫۲ سانتی‌متر می‌شود
const PHOTO_H = 90;
const PHOTO_DPI_SCALE = 4; // رزولوشن چاپ حدود ۲۹۰dpi

// عکس پروفایل به فرمت webp ذخیره می‌شود و pdfkit فقط JPEG و PNG می‌فهمد؛
// اینجا به JPEG تبدیل و هم‌زمان به نسبت ۳×۴ برش داده می‌شود.
async function loadPhoto(photoUrl) {
  const m = /^\/media\/([A-Za-z0-9._-]+)$/.exec(photoUrl || '');
  if (!m) return null;
  const file = path.join(process.cwd(), 'uploads', m[1]);
  if (!fs.existsSync(file)) return null;
  try {
    return await sharp(file)
      .resize(PHOTO_W * PHOTO_DPI_SCALE, PHOTO_H * PHOTO_DPI_SCALE, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    // عکسِ خراب نباید جلوی صدور فایل گواهی را بگیرد؛ گواهی بدون عکس ساخته می‌شود.
    return null;
  }
}

// قاب طلاییِ عکس، هم‌خانوادهٔ قاب اصلی گواهی: یک خط پررنگ و یک خط نازکِ بیرونی.
function drawPhoto(doc, buf, x, y) {
  doc.image(buf, x, y, { width: PHOTO_W, height: PHOTO_H });
  doc.rect(x, y, PHOTO_W, PHOTO_H).lineWidth(1.1).strokeColor(GOLD).stroke();
  doc.rect(x - 4, y - 4, PHOTO_W + 8, PHOTO_H + 8).lineWidth(0.5).strokeColor(GOLD_SOFT).stroke();
  diamond(doc, x - 4, y - 4, 2.2, GOLD_SOFT);
  diamond(doc, x + PHOTO_W + 4, y - 4, 2.2, GOLD_SOFT);
  diamond(doc, x - 4, y + PHOTO_H + 4, 2.2, GOLD_SOFT);
  diamond(doc, x + PHOTO_W + 4, y + PHOTO_H + 4, 2.2, GOLD_SOFT);
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
  // پیش از شروع رسم خوانده می‌شود تا وسط ساختِ سند await نیفتد.
  const photo = await loadPhoto(cert.photoUrl);

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
  // عکس در گوشهٔ بالا-چپ می‌نشیند؛ سمت راستِ سربرگ جای نشانِ فنی و حرفه‌ای است و
  // مرکز جای نشانِ آموزشگاه. فاصله از گوشه طوری است که به گل‌آذینِ گوشه نخورد.
  if (photo) drawPhoto(doc, photo, 96, 46);
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

  // متنِ اصلیِ گواهی. کد ملی و معدل فقط وقتی ثبت شده باشند در جمله می‌آیند، وگرنه
  // همان جمله بدون آن بخش روان می‌ماند. فقط نمرهٔ نهایی (جمع آزمون و نمرهٔ کلاسی)
  // درج می‌شود؛ ریز نمره عمداً نمی‌آید و فقط در پنل مدیریت و کارنامهٔ هنرجو دیده می‌شود.
  // عبارت‌هایی که وسطشان نباید بشکند (کد ملی، نام آموزشگاه، نام شاخه و رشته) با فاصلهٔ
  // چسبان بسته می‌شوند تا سطربند آن‌ها را یک واحد ببیند.
  const body = [
    cert.nationalId ? `به کد ملی ${fa(cert.nationalId)}` : null,
    `در ${glue(SCHOOL_NAME)} به شمارهٔ شناسه ${fa(SCHOOL_LICENSE)} زیر نظر ${glue(TVTO_NAME)}`,
    Number.isFinite(cert.percent) ? `با معدل ${fa(formatScore(cert.percent))} از ۱۰۰` : null,
    `در ${glue(`شاخهٔ ${GRADUATION_BRANCH}`)} ${glue(`رشتهٔ ${GRADUATION_FIELD}`)}`,
    `با گذراندن ${fa(COURSE_HOURS)} ساعت آموزش عملی و تئوری فارغ‌التحصیل گردیده است.`,
  ].filter(Boolean).join('، ').replace('،،', '،');

  const bodyH = paragraph(doc, body, 296, W - 250, { size: 13, lineHeight: 25 });

  divider(doc, CX, 296 + bodyH + 16, 46);

  // ── نوار پایین ───────────────────────────────────────────────
  const footY = H - 160;

  // راست: شناسهٔ گواهی
  const infoW = 250;
  const infoX = W - 58 - infoW;
  let infoY = footY;
  write(doc, `کد استعلام: ${cert.serial}`, infoX, infoY, infoW, { size: 12, bold: true });
  infoY += 21;
  write(doc, `تاریخ صدور: ${fmtDate(cert.issuedAt)}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });
  // کد ملی داخل خودِ متنِ گواهی آمده و شعبه روی برگه درج نمی‌شود؛ هر دو در استعلام
  // آنلاین و سوابق پنل باقی‌اند.
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
  // امضا و مهر کمی روی خطِ امضا می‌نشینند، همان‌طور که روی کاغذ واقعی زده می‌شوند.
  // مهر ایستاده است (نقشِ خانه + نام + شمارهٔ ثبت)، پس ارتفاعش مبنای اندازه است و کمی
  // بالاتر از خط می‌ایستد تا شمارهٔ ثبتِ پایینِ مهر روی خط نیفتد.
  if (fs.existsSync(SIGNATURE)) doc.image(SIGNATURE, signX - 2, footY - 6, { fit: [128, 74] });
  if (fs.existsSync(STAMP)) {
    doc.save();
    doc.opacity(0.9);
    doc.image(STAMP, signX + 134, footY - 32, { fit: [78, 82] });
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
