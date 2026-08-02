// ساخت PDF فارسی از اطلاعات یک ثبت‌نام هنرجو با pdfkit.
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { shape } from './rtl';
import { QUESTIONS, courseByKey } from './enrollmentData';

const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Regular.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/Vazirmatn-Bold.ttf');
const FILMMAKER_KEY = '05';
const TEXT_OPTS = { align: 'right', features: [] };

const fmtDate = (d) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(new Date(d));
  } catch {
    return String(d ?? '');
  }
};

// یک بلوک متنی راست‌چین؛ شکست‌خط را خودِ pdfkit مدیریت می‌کند.
function line(doc, text, { size = 12, color = '#111', bold = false, gap = 4 } = {}) {
  const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(size).fillColor(color);
  doc.text(shape(text), doc.page.margins.left, doc.y, { width: maxWidth, ...TEXT_OPTS });
  doc.y += gap;
}

function divider(doc) {
  const x1 = doc.page.margins.left;
  const x2 = doc.page.width - doc.page.margins.right;
  doc.moveTo(x1, doc.y).lineTo(x2, doc.y).strokeColor('#e2e2e2').lineWidth(1).stroke();
  doc.y += 8;
}

// ساخت بافر PDF از یک رکورد ثبت‌نام.
export async function buildEnrollmentPdf(enrollment) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 48, left: 48, right: 48 } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', resolve));

  const isFilmmaker = enrollment.courseKey === FILMMAKER_KEY;
  const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  line(doc, 'خانواده برداشت — درخواست ثبت‌نام جدید', { size: 18, bold: true, color: '#0b0b0b', gap: 2 });
  line(doc, `تاریخ: ${fmtDate(enrollment.createdAt || Date.now())}`, { size: 10, color: '#666', gap: 8 });

  if (isFilmmaker) {
    doc.rect(doc.page.margins.left, doc.y, maxWidth, 28).fillColor('#fde68a').fill();
    doc.y += 6;
    line(doc, 'این هنرجو دورهٔ «فیلمسازی» را انتخاب کرده است.', { size: 12, bold: true, color: '#7c4a03', gap: 10 });
  }
  divider(doc);

  const course = courseByKey(enrollment.courseKey);
  const rows = [
    ['نام و نام خانوادگی', enrollment.fullName],
    ['شماره موبایل', enrollment.phone],
    ['کد ملی', enrollment.nationalId || '—'],
    ['دوره', `${course ? course.title : enrollment.courseTitle} — کد ${enrollment.courseKey}`],
    ['تیپ بازیگری', enrollment.actorType || '—'],
    ['وضعیت', enrollment.status || 'submitted'],
    ['لینک ویدیو', enrollment.videoUrl || '—'],
  ];
  for (const [label, value] of rows) {
    line(doc, `${label}: ${value}`, { size: 12, gap: 3 });
  }

  if (enrollment.aiAnalysis) {
    doc.y += 4;
    line(doc, 'تحلیل خانواده برداشت:', { size: 12, bold: true, gap: 2 });
    line(doc, enrollment.aiAnalysis, { size: 11, color: '#333', gap: 6 });
  }

  const answers = Array.isArray(enrollment.answers) ? enrollment.answers : null;
  if (answers) {
    divider(doc);
    line(doc, 'پاسخ‌های تست شخصیت‌شناسی:', { size: 13, bold: true, gap: 6 });
    QUESTIONS.forEach((item, i) => {
      const opt = item.options[answers[i]] ?? '—';
      line(doc, `${i + 1}. ${item.q}`, { size: 11, color: '#111', gap: 1 });
      line(doc, `پاسخ: ${opt}`, { size: 11, color: '#1d4ed8', gap: 6 });
    });
  }

  doc.end();
  await done;
  return Buffer.concat(chunks);
}
