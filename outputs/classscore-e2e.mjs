// آزمایش زندهٔ نمرهٔ کلاسی: ثبت نمره پیش از آزمون، جمع‌شدن با نمرهٔ آزمون و صدور گواهی طبق نمرهٔ نهایی.
// همهٔ دادهٔ ساخته‌شده در پایان پاک می‌شود.
import { readFileSync } from 'node:fs';
import { scryptSync, randomBytes } from 'node:crypto';

const env = readFileSync('/var/www/bardasht-nextjs/.env', 'utf8');
process.env.DATABASE_URL = env.match(/^DATABASE_URL="?([^"\n]+)"?/m)[1];

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:3000';

const hash = (p) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(String(p), salt, 64).toString('hex')}`;
};

const ok = [];
const bad = [];
const check = (name, pass, detail = '') => (pass ? ok : bad).push(`${name}${detail ? ` — ${detail}` : ''}`);

async function login(username, password) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  return { data: await res.json(), cookie };
}

const api = (cookie) => async (path, method = 'GET', body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};

const stamp = Date.now();
const editorName = `zz_test_editor_${stamp}`;
const studentName = `zz_test_student_${stamp}`;
const PASS = 'Test-Pass-9137!';
const CLASS_SCORE = 20;
const CORRECT_TARGET = 65; // نمرهٔ آزمون عمداً زیر حد نصاب انتخاب شده تا اثر نمرهٔ کلاسی دیده شود
let editor, student;

try {
  editor = await prisma.user.create({
    data: { phone: `0912${String(stamp).slice(-7)}`, username: editorName, passwordHash: hash(PASS), displayName: 'ادیتور آزمایشی', role: 'editor', active: true },
  });
  student = await prisma.user.create({
    data: { phone: `0913${String(stamp).slice(-7)}`, username: studentName, passwordHash: hash(PASS), displayName: 'هنرجوی آزمایشی', role: 'student', active: true, gender: 'female', courseTitle: 'بازیگری', branch: 'مرکزی' },
  });

  const ed = api((await login(editorName, PASS)).cookie);
  const st = api((await login(studentName, PASS)).cookie);

  // ۱) نمرهٔ کلاسی الزامی است
  let r = await ed('/api/admin/exam/permits', 'POST', { userId: student.id, days: 7 });
  check('اجازه بدون نمرهٔ کلاسی رد می‌شود', r.status === 400, `status=${r.status}`);

  // ۲) نمرهٔ بیرون از بازه رد می‌شود
  r = await ed('/api/admin/exam/permits', 'POST', { userId: student.id, days: 7, classScore: 25 });
  check('نمرهٔ بالای ۲۰ رد می‌شود', r.status === 400, `status=${r.status}`);

  // ۳) صدور اجازه با نمرهٔ کلاسی
  r = await ed('/api/admin/exam/permits', 'POST', { userId: student.id, days: 7, classScore: 12 });
  check('صدور اجازه با نمرهٔ کلاسی', r.data.ok === true && r.data.item.classScore === 12, `classScore=${r.data.item?.classScore}`);
  const permitId = r.data.item.id;

  // ۴) اصلاح نمره پیش از شروع آزمون
  r = await ed('/api/admin/exam/permits', 'PATCH', { id: permitId, classScore: CLASS_SCORE });
  check('اصلاح نمرهٔ کلاسی پیش از آزمون', r.data.ok === true && r.data.item.classScore === CLASS_SCORE, `classScore=${r.data.item?.classScore}`);

  // ۵) هنرجو نمرهٔ ثبت‌شده را می‌بیند
  r = await st('/api/exam');
  check('هنرجو نمرهٔ کلاسی خود را می‌بیند', r.data.permit?.classScore === CLASS_SCORE && r.data.canStart === true, `classScore=${r.data.permit?.classScore} canStart=${r.data.canStart}`);
  check('سهم آزمون و سقف نمرهٔ کلاسی در تنظیمات', r.data.config.examWeight === 80 && r.data.config.classScoreMax === 20);

  // ۶) شروع آزمون و پاسخ‌دهی کنترل‌شده
  r = await st('/api/exam', 'POST');
  check('شروع آزمون', r.data.ok === true, r.data.error || '');
  const attemptId = r.data.attempt?.id || (await st('/api/exam')).data.current.id;

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  check('نمرهٔ کلاسی در لحظهٔ شروع در آزمون کپی شد', attempt.classScore === CLASS_SCORE, `classScore=${attempt.classScore}`);

  const qs = await prisma.examQuestion.findMany({ where: { id: { in: attempt.questionIds } }, select: { id: true, correct: true } });
  const correctOf = Object.fromEntries(qs.map((q) => [q.id, q.correct]));

  let answeredCorrect = 0;
  for (let i = 0; i < attempt.total; i++) {
    const cur = (await st('/api/exam')).data.current;
    if (!cur?.question) break;
    const right = correctOf[cur.question.id];
    const choice = answeredCorrect < CORRECT_TARGET ? right : (right + 1) % 4;
    const a = await st('/api/exam/answer', 'PATCH', { attemptId, questionId: cur.question.id, choice });
    if (a.data.ok && choice === right) answeredCorrect++;
    const n = await st('/api/exam/next', 'POST', { attemptId, cursor: cur.cursor });
    if (n.data.finished) break;
  }

  const sub = await st('/api/exam/submit', 'POST', { attemptId });
  const res = sub.data.result;
  const expectedFinal = Math.round((res.percent * 80) / 100) + CLASS_SCORE;

  check('درصد آزمون برابر پاسخ‌های درست', res.percent === CORRECT_TARGET, `percent=${res.percent} correct=${res.score}`);
  check('نمرهٔ کلاسی در نتیجه برگشت', res.classScore === CLASS_SCORE, `classScore=${res.classScore}`);
  check('نمرهٔ نهایی = سهم آزمون + نمرهٔ کلاسی', res.finalPercent === expectedFinal, `final=${res.finalPercent} expected=${expectedFinal}`);
  check('قبولی روی نمرهٔ نهایی سنجیده شد (آزمون زیر حد نصاب بود)', res.passed === true && res.percent < 70 && res.finalPercent >= 70, `exam=${res.percent} final=${res.finalPercent} passed=${res.passed}`);
  check('گواهی صادر شد', !!sub.data.certificate, sub.data.certificate?.serial || 'بدون گواهی');

  const serial = sub.data.certificate?.serial;
  if (serial) {
    const cert = await prisma.certificate.findUnique({ where: { serial } });
    check('نمرهٔ روی گواهی همان نمرهٔ نهایی است', cert.percent === res.finalPercent, `cert=${cert.percent}`);
    check('ریز نمره روی گواهی ثبت شد', cert.examPercent === res.percent && cert.classScore === CLASS_SCORE, `exam=${cert.examPercent} class=${cert.classScore}`);

    const v = await fetch(`${BASE}/api/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serial }) });
    const vd = await v.json();
    check('استعلام عمومی نمرهٔ نهایی و ریز نمره را نشان می‌دهد', vd.certificate?.percent === res.finalPercent && vd.certificate?.classScore === CLASS_SCORE, `percent=${vd.certificate?.percent}`);

    const pdf = await fetch(`${BASE}/api/certificate/${serial}`, { headers: { cookie: (await login(studentName, PASS)).cookie } });
    check('فایل PDF گواهی ساخته می‌شود', pdf.status === 200 && (pdf.headers.get('content-type') || '').includes('pdf'), `status=${pdf.status}`);
  }

  // ۷) نمرهٔ کلاسیِ آزمونِ برگزارشده دیگر تغییر نمی‌کند
  r = await ed('/api/admin/exam/permits', 'PATCH', { id: permitId, classScore: 5 });
  check('تغییر نمرهٔ کلاسی پس از برگزاری آزمون رد می‌شود', r.status === 409, `status=${r.status}`);

  // ۸) کارنامهٔ مدیر ریز نمره را نشان می‌دهد
  r = await ed('/api/admin/exam/attempts');
  const row = r.data.items.find((x) => x.id === attemptId);
  check('کارنامهٔ پنل مدیریت ریز نمره دارد', row?.classScore === CLASS_SCORE && row?.finalPercent === res.finalPercent, `class=${row?.classScore} final=${row?.finalPercent}`);
} catch (err) {
  bad.push(`خطای اجرا: ${err.message}`);
} finally {
  // پاک‌سازی کامل دادهٔ آزمایشی
  const ids = [editor?.id, student?.id].filter(Boolean);
  if (ids.length) {
    await prisma.certificate.deleteMany({ where: { userId: { in: ids } } });
    await prisma.examPermit.deleteMany({ where: { userId: { in: ids } } });
    await prisma.examAttempt.deleteMany({ where: { userId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
}

console.log('\n== نتیجه ==');
ok.forEach((l) => console.log('PASS ✓', l));
bad.forEach((l) => console.log('FAIL ✗', l));
console.log(`\n${ok.length} تأیید، ${bad.length} خطا`);
process.exit(bad.length ? 1 : 0);
