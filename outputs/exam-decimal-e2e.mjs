// آزمون سرتاسری روی سایت زنده: نمرهٔ کلاسیِ اعشاری و نمرهٔ نهایی.
// روی سرور و داخل /var/www/bardasht-nextjs اجرا می‌شود. همهٔ دادهٔ آزمایشی در پایان پاک می‌شود.
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const BASE = 'https://www.bardashtt.com';

let pass = 0;
const fails = [];
function check(cond, label, extra = '') {
  if (cond) { pass++; console.log(`PASS  ${label}`); }
  else { fails.push(label); console.log(`FAIL  ${label}  ${extra}`); }
}

const req = (path, { method = 'GET', token, body } = {}) =>
  fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { cookie: `bsid=${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const json = async (r) => { try { return await r.json(); } catch { return {}; } };

const stamp = Date.now().toString().slice(-6);
const made = { users: [], sessions: [] };

async function mkUser(role, name, phone) {
  const u = await p.user.create({
    data: { phone, displayName: name, role, active: true, gender: 'female', branch: 'تهران', courseTitle: 'مقدماتی' },
  });
  const token = `E2E-${stamp}-${role}`;
  await p.session.create({ data: { token, userId: u.id, expiresAt: new Date(Date.now() + 3600e3) } });
  made.users.push(u.id);
  made.sessions.push(token);
  return { ...u, token };
}

try {
  const editor = await mkUser('editor', 'ادیتور آزمایشی E2E', `0900${stamp}1`);
  const student = await mkUser('student', 'هنرجوی آزمایشی E2E', `0900${stamp}2`);

  // ── ۱) اعتبارسنجی نمرهٔ کلاسی هنگام صدور اجازه ───────────────────
  let r = await req('/api/admin/exam/permits', { method: 'POST', token: editor.token, body: { userId: student.id } });
  let d = await json(r);
  check(r.status === 400 && !d.ok, 'اجازه بدون نمرهٔ کلاسی رد می‌شود', JSON.stringify(d));

  r = await req('/api/admin/exam/permits', { method: 'POST', token: editor.token, body: { userId: student.id, classScore: '20.5' } });
  d = await json(r);
  check(r.status === 400, 'نمرهٔ کلاسی بالاتر از ۲۰ رد می‌شود (20.5)', JSON.stringify(d));

  r = await req('/api/admin/exam/permits', { method: 'POST', token: editor.token, body: { userId: student.id, classScore: '18.55' } });
  d = await json(r);
  check(r.status === 400, 'بیش از یک رقم اعشار رد می‌شود (18.55)', JSON.stringify(d));

  r = await req('/api/admin/exam/permits', { method: 'POST', token: editor.token, body: { userId: student.id, classScore: '-2' } });
  d = await json(r);
  check(r.status === 400, 'نمرهٔ منفی رد می‌شود', JSON.stringify(d));

  // ── ۲) صدور اجازه با نمرهٔ اعشاری ────────────────────────────────
  r = await req('/api/admin/exam/permits', { method: 'POST', token: editor.token, body: { userId: student.id, classScore: '12.5' } });
  d = await json(r);
  check(r.ok && d.ok && d.item.classScore === 12.5, 'اجازه با نمرهٔ اعشاری ۱۲٫۵ صادر شد', JSON.stringify(d));
  const permitId = d.item?.id;

  let permitRow = await p.examPermit.findUnique({ where: { id: permitId } });
  check(permitRow?.classScore === 12.5, 'نمرهٔ ۱۲٫۵ عیناً در دیتابیس ذخیره شد', String(permitRow?.classScore));

  // ── ۳) اصلاح نمره پیش از شروع آزمون، با نگارش فارسی ۱۸/۵ ─────────
  r = await req('/api/admin/exam/permits', { method: 'PATCH', token: editor.token, body: { id: permitId, classScore: '۱۸/۵' } });
  d = await json(r);
  check(r.ok && d.item?.classScore === 18.5, 'اصلاح نمره با نگارش فارسی «۱۸/۵» → ۱۸٫۵', JSON.stringify(d));

  // ── ۴) نمایش نمره برای هنرجو پیش از شروع ─────────────────────────
  r = await req('/api/exam', { token: student.token });
  d = await json(r);
  check(d.permit?.classScore === 18.5, 'هنرجو نمرهٔ کلاسی ۱۸٫۵ خود را می‌بیند', JSON.stringify(d.permit));
  check(d.canStart === true, 'دکمهٔ شروع برای هنرجو فعال است');
  check(d.bankSize === 211 && d.config.questionCount === 100, `آزمون ۱۰۰ سوال تصادفی از بانک ${d.bankSize} سوالی`, JSON.stringify(d.config));

  // ── ۵) شروع آزمون و پاسخ‌دهی برای رسیدن به دقیقاً ۶۵ درصد ────────
  r = await req('/api/exam', { method: 'POST', token: student.token });
  d = await json(r);
  check(d.ok, 'آزمون شروع شد', JSON.stringify(d));

  const attempt0 = await p.examAttempt.findFirst({ where: { userId: student.id }, orderBy: { startedAt: 'desc' } });
  check(attempt0.classScore === 18.5, 'نمرهٔ کلاسی در لحظهٔ شروع داخل آزمون قفل شد (۱۸٫۵)', String(attempt0.classScore));
  check(attempt0.total === 100, 'آزمون ۱۰۰ سوالی است', String(attempt0.total));
  check(new Set(attempt0.questionIds).size === 100, 'هر ۱۰۰ سوال یکتا هستند');

  // تلاش برای دست‌کاری نمره پس از شروع آزمون
  r = await req('/api/admin/exam/permits', { method: 'PATCH', token: editor.token, body: { id: permitId, classScore: '20' } });
  d = await json(r);
  check(r.status === 409, 'تغییر نمره پس از شروع آزمون رد می‌شود', JSON.stringify(d));
  const attemptAfter = await p.examAttempt.findUnique({ where: { id: attempt0.id } });
  check(attemptAfter.classScore === 18.5, 'نمرهٔ داخل آزمون دست‌نخورده ماند');

  const bank = await p.examQuestion.findMany({ where: { id: { in: attempt0.questionIds } }, select: { id: true, correct: true } });
  const correctOf = Object.fromEntries(bank.map((q) => [q.id, q.correct]));

  const TARGET_CORRECT = 65;
  for (let i = 0; i < 100; i++) {
    const st = await json(await req('/api/exam', { token: student.token }));
    const q = st.current?.question;
    if (!q) break;
    const right = correctOf[q.id];
    const choice = i < TARGET_CORRECT ? right : (right + 1) % 4;
    await req('/api/exam/answer', { method: 'PATCH', token: student.token, body: { attemptId: attempt0.id, questionId: q.id, choice } });
    await req('/api/exam/next', { method: 'POST', token: student.token, body: { attemptId: attempt0.id, cursor: st.current.cursor } });
  }

  // ── ۶) تصحیح و نمرهٔ نهایی ───────────────────────────────────────
  r = await req('/api/exam/submit', { method: 'POST', token: student.token, body: { attemptId: attempt0.id } });
  d = await json(r);
  const res = d.result || {};
  check(res.percent === 65, 'درصد آزمون دقیقاً ۶۵ شد', JSON.stringify(res));
  check(res.classScore === 18.5, 'نمرهٔ کلاسی در نتیجه ۱۸٫۵ است', JSON.stringify(res));
  check(res.finalPercent === 70.5, 'نمرهٔ نهایی = ۵۲ + ۱۸٫۵ = ۷۰٫۵', JSON.stringify(res));
  check(res.passed === true, 'با ۶۵ درصدِ آزمون و نمرهٔ کلاسی اعشاری، قبول شد');
  check(!!d.certificate?.serial, 'گواهی صادر شد', JSON.stringify(d.certificate));

  const serial = d.certificate?.serial;
  const cert = await p.certificate.findUnique({ where: { serial } });
  check(cert?.percent === 70.5, 'نمرهٔ روی گواهی ۷۰٫۵ ذخیره شد', String(cert?.percent));
  check(cert?.examPercent === 65 && cert?.classScore === 18.5, 'ریز نمرهٔ گواهی درست است', JSON.stringify({ e: cert?.examPercent, c: cert?.classScore }));

  // ── ۷) استعلام عمومی و فایل PDF ─────────────────────────────────
  r = await req('/api/verify', { method: 'POST', body: { serial } });
  d = await json(r);
  const v = d.certificate || {};
  check(v?.percent === 70.5 && v?.classScore === 18.5, 'استعلام عمومی نمرهٔ ۷۰٫۵ و کلاسی ۱۸٫۵ را نشان می‌دهد', JSON.stringify(d).slice(0, 300));

  const pdf = await req(`/api/certificate/${encodeURIComponent(serial)}`, { token: student.token });
  const buf = Buffer.from(await pdf.arrayBuffer());
  check(pdf.status === 200 && buf.slice(0, 4).toString() === '%PDF' && buf.length > 5000, 'فایل PDF گواهی سالم ساخته می‌شود', `status=${pdf.status} size=${buf.length}`);
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/cert-e2e.pdf', buf); // برای بازبینی چشمی نمرهٔ اعشاری روی گواهی

  // ── ۸) کارنامهٔ پنل مدیریت ───────────────────────────────────────
  r = await req('/api/admin/exam/attempts', { token: editor.token });
  d = await json(r);
  const row = (d.items || []).find((a) => a.id === attempt0.id);
  check(row?.percent === 65 && row?.classScore === 18.5 && row?.finalPercent === 70.5, 'کارنامهٔ پنل هر سه نمره را درست نشان می‌دهد', JSON.stringify(row));

  // ── ۹) صدور دستی گواهی با نمرهٔ اعشاری ──────────────────────────
  r = await req('/api/admin/certificates', { method: 'POST', token: editor.token, body: { userId: student.id, percent: '101' } });
  check(r.status === 400, 'صدور دستی با نمرهٔ بالای ۱۰۰ رد می‌شود');
  r = await req('/api/admin/certificates', { method: 'POST', token: editor.token, body: { userId: student.id, percent: '82.5' } });
  d = await json(r);
  check(r.ok && d.item?.percent === 82.5, 'صدور دستی گواهی با نمرهٔ ۸۲٫۵ کار می‌کند', JSON.stringify(d).slice(0, 200));
} finally {
  // ── پاک‌سازی کامل دادهٔ آزمایشی ─────────────────────────────────
  await p.certificate.deleteMany({ where: { userId: { in: made.users } } });
  await p.examAttempt.deleteMany({ where: { userId: { in: made.users } } });
  await p.examPermit.deleteMany({ where: { userId: { in: made.users } } });
  await p.notification.deleteMany({ where: { userId: { in: made.users } } });
  await p.session.deleteMany({ where: { token: { in: made.sessions } } });
  await p.auditLog.deleteMany({ where: { OR: [{ targetId: { in: made.users } }, { actorId: { in: made.users } }] } });
  await p.user.deleteMany({ where: { id: { in: made.users } } });

  const left = {
    users: await p.user.count({ where: { id: { in: made.users } } }),
    certs: await p.certificate.count(),
    attempts: await p.examAttempt.count(),
    permits: await p.examPermit.count(),
  };
  console.log('\nپاک‌سازی:', JSON.stringify(left));
  console.log(`\nنتیجه: ${pass} بررسی موفق، ${fails.length} ناموفق`);
  if (fails.length) console.log('ناموفق‌ها:\n- ' + fails.join('\n- '));
  await p.$disconnect();
  process.exit(fails.length ? 1 : 0);
}
