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
const SEAL_SIGNATURE = path.join(process.cwd(), 'assets/cert-seal-signature.png');

// نشانیِ داخل QR باید همان دامنهٔ رسمی (www) باشد؛ دامنهٔ بدون www با ۳۰۱ به همین‌جا
// می‌رسد ولی یک پرشِ اضافه دارد و بعضی اسکنرهای داخلِ اپلیکیشن‌ها ریدایرکت را دنبال نمی‌کنند.
const VERIFY_BASE = 'https://www.bardashtt.com/verify';

const GOLD = '#b08d3f';
const GOLD_SOFT = '#d9c48c';
const GOLD_DEEP = '#8f7130';
const CREAM = '#fdfaf3';
const INK = '#191510';
const MUTED = '#6a6153';
// زمینهٔ ذغالیِ بیرونی و رنگِ نوارِ فیلم. نوار باید دیده شود ولی نه آن‌قدر که با متن
// رقابت کند؛ سوراخ‌هایش با رنگی تیره‌تر از خودِ زمینه بریده می‌شوند تا توخالی به نظر برسند.
const DARK = '#1a1411';
const FILM = '#392e23';
const FILM_HOLE = '#14100d';

// پنلِ کرمِ داخلی. همهٔ محتوا داخل این کادر می‌نشیند و حاشیهٔ تیرهٔ دورش قابِ طرح است.
const PAD_X = 66;
const PAD_TOP = 42;
const PAD_BOTTOM = 64;

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

// براکتِ گوشهٔ پنل: دو بازوی زاویه‌دار روی لبه‌ها، یکی ضخیم و یکی نازکِ داخلی.
// sx/sy جهت گوشه را می‌چرخاند. عمداً بدون کمان و لوزیِ داخلی است تا با عکسِ پرسنلیِ
// گوشهٔ بالا-چپ تداخل نکند.
function cornerOrnament(doc, x, y, sx, sy) {
  doc.save();
  doc.translate(x, y).scale(sx, sy);
  doc.lineJoin('miter');
  doc.moveTo(0, 66).lineTo(0, 0).lineTo(66, 0).lineWidth(2.6).strokeColor(GOLD).stroke();
  doc.moveTo(6, 46).lineTo(6, 6).lineTo(46, 6).lineWidth(0.8).strokeColor(GOLD_SOFT).stroke();
  doc.restore();
}

// نوارِ فیلمِ مورب برای زمینهٔ تیره. سوراخ‌های حاشیه بدون ماسک و فقط با پرکردنِ
// مستطیل‌های تیره بریده می‌شوند. بخشی که زیر پنلِ کرم بیفتد بعداً پوشانده می‌شود.
function filmStrip(doc, x, y, angle, len, w = 46) {
  doc.save();
  doc.translate(x, y).rotate(angle);
  doc.rect(0, 0, len, w).fillColor(FILM).fill();
  // دو خطِ باریکِ داخلی، مرزِ ناحیهٔ فریم‌ها روی نوارِ فیلمِ واقعی
  doc.rect(0, 12.5, len, 0.7).fillColor(FILM_HOLE).fill();
  doc.rect(0, w - 13.2, len, 0.7).fillColor(FILM_HOLE).fill();
  const hw = 7.5;
  const hh = 5;
  for (let i = 9; i + hw < len; i += 15.5) {
    doc.roundedRect(i, 3.8, hw, hh, 1.3).fillColor(FILM_HOLE).fill();
    doc.roundedRect(i, w - 3.8 - hh, hw, hh, 1.3).fillColor(FILM_HOLE).fill();
  }
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
  const quiet = 4; // حاشیهٔ استانداردِ چهار ماژولی برای خوانده‌شدن در اسکنرهای موبایل
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

  // ── زمینهٔ ذغالی با بافتِ نوارِ فیلم در گوشه‌ها ────────────────
  const PX = PAD_X;
  const PY = PAD_TOP;
  const PW = W - PAD_X * 2;
  const PH = H - PAD_TOP - PAD_BOTTOM;

  doc.rect(0, 0, W, H).fillColor(DARK).fill();
  // بافتِ فیلم مثل طرحِ مرجع در گوشهٔ بالا-چپ و لبهٔ راست می‌نشیند؛ دو نوارِ موازیِ
  // بالا-چپ حسِ حلقهٔ فیلمِ بازشده را می‌دهد و نوارِ راست تعادلِ قطریِ کادر را می‌سازد.
  filmStrip(doc, -46, 8, 44, 250);
  filmStrip(doc, -30, 96, 30, 190, 34);
  filmStrip(doc, W + 34, 6, 116, 300);
  filmStrip(doc, W + 26, H - 200, 108, 230, 36);
  doc.rect(12, 12, W - 24, H - 24).lineWidth(1.7).strokeColor(GOLD_DEEP).stroke();
  doc.rect(17.5, 17.5, W - 35, H - 35).lineWidth(0.5).strokeColor(GOLD_DEEP).stroke();

  // پنلِ کرمِ داخلی با قابِ دولایهٔ طلایی
  doc.rect(PX, PY, PW, PH).fillColor(CREAM).fill();
  doc.rect(PX, PY, PW, PH).lineWidth(2.8).strokeColor(GOLD).stroke();
  doc.rect(PX + 7, PY + 7, PW - 14, PH - 14).lineWidth(0.7).strokeColor(GOLD_SOFT).stroke();

  cornerOrnament(doc, PX + 16, PY + 16, 1, 1);
  cornerOrnament(doc, PX + PW - 16, PY + 16, -1, 1);
  cornerOrnament(doc, PX + 16, PY + PH - 16, 1, -1);
  cornerOrnament(doc, PX + PW - 16, PY + PH - 16, -1, -1);

  rosette(doc, CX, PY + PH / 2 + 4, 162, 56, 18);

  // نشانی سایت روی نوارِ تیرهٔ پایین، مثل طرحِ چاپیِ آموزشگاه
  const urlY = PY + PH + 21;
  write(doc, 'www.bardashtt.com', CX - 120, urlY, 240, { size: 10.5, color: GOLD_SOFT, align: 'center', raw: true });
  diamond(doc, CX - 84, urlY + 6, 2.6, GOLD_DEEP);
  diamond(doc, CX + 84, urlY + 6, 2.6, GOLD_DEEP);

  // سربرگ
  doc.image(LOGO, CX - 27, PY + 16, { height: 52 });
  // نشانِ فنی و حرفه‌ای پایین‌تر از بازوی افقیِ براکتِ گوشه می‌نشیند تا رویش نیفتد.
  if (fs.existsSync(LOGO_TVTO)) doc.image(LOGO_TVTO, PX + PW - 118, PY + 30, { height: 46 });
  // عکس در گوشهٔ بالا-چپِ پنل می‌نشیند؛ سمت راستِ سربرگ جای نشانِ فنی و حرفه‌ای است و
  // مرکز جای نشانِ آموزشگاه. فاصله از گوشه طوری است که به براکتِ گوشه نخورد.
  if (photo) drawPhoto(doc, photo, PX + 42, PY + 36);
  center(doc, SCHOOL_NAME, PY + 76, { size: 12.5, bold: true, color: MUTED });
  center(doc, 'گواهی‌نامهٔ فارغ‌التحصیلی', PY + 95, { size: 26, bold: true, color: GOLD });
  divider(doc, CX, PY + 140, 112);

  // متن اصلی
  center(doc, 'گواهی می‌شود', PY + 154, { size: 11, color: MUTED });

  const title = honorific(cert.gender);
  const holder = title ? `${title} ${cert.fullName}` : cert.fullName;
  center(doc, holder, PY + 172, { size: 23, bold: true, color: INK });

  // زیرخطِ نامِ دارنده، به اندازهٔ خودِ نام
  const nameHalf = Math.min(Math.max(textWidth(doc, holder, 23, true) / 2 + 32, 104), (PW - 120) / 2);
  const underlineY = PY + 208;
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

  const bodyY = PY + 224;
  const bodyH = paragraph(doc, body, bodyY, PW - 130, { size: 12.5, lineHeight: 23.5 });

  divider(doc, CX, bodyY + bodyH + 14, 44);

  // ── نوار پایین ───────────────────────────────────────────────
  const footY = PY + PH - 140;

  // راست: شناسهٔ گواهی
  const infoW = 244;
  const infoX = PX + PW - 28 - infoW;
  let infoY = footY;
  write(doc, `کد استعلام: ${cert.serial}`, infoX, infoY, infoW, { size: 12, bold: true });
  infoY += 21;
  write(doc, `تاریخ صدور: ${fmtDate(cert.issuedAt)}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });
  // کد ملی داخل خودِ متنِ گواهی آمده و شعبه روی برگه درج نمی‌شود؛ هر دو در استعلام
  // آنلاین و سوابق پنل باقی‌اند.
  infoY += 18;
  write(doc, `تلفن آموزشگاه: ${SCHOOL_PHONE}`, infoX, infoY, infoW, { size: 10.5, color: MUTED });

  // وسط: QR استعلام آنلاین
  const qrBox = 88;
  drawQr(doc, `${VERIFY_BASE}?code=${cert.serial}`, CX - qrBox / 2, footY - 10, qrBox);
  write(doc, 'استعلام آنلاین اعتبار', CX - 95, footY + qrBox - 3, 190, { size: 9, color: MUTED, align: 'center' });
  write(doc, 'bardashtt.com/verify', CX - 95, footY + qrBox + 10, 190, { size: 9, color: MUTED, align: 'center', raw: true });

  // چپ: نشانِ یکپارچهٔ مهر، امضا و شمارهٔ ثبتِ مدیریت آموزشگاه.
  const signW = 214;
  const signX = PX + 28;
  if (fs.existsSync(SEAL_SIGNATURE)) {
    doc.image(SEAL_SIGNATURE, signX + 20, footY - 25, { fit: [174, 130], align: 'center', valign: 'center' });
  }
  write(doc, 'مهر و امضای مدیریت آموزشگاه', signX, footY + 72, signW, { size: 10.5, color: MUTED, align: 'center' });

  if (cert.revoked) {
    doc.save();
    doc.translate(CX, PY + PH / 2).rotate(-16);
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
