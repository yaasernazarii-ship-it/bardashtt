import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import {
  EXAM_PASS_PERCENT,
  EXAM_QUESTION_COUNT,
  EXAM_SECONDS_PER_QUESTION,
  pickRandom,
} from '@/lib/exam';
import { findUsablePermit, isAttemptOver, syncCursor } from '@/lib/examRun';

// آزمون فارغ‌التحصیلی مخصوص هنرجوست؛ مدیر هم برای بازبینی می‌تواند آن را باز کند.
// اما باز کردنِ صفحه کافی نیست: شروع آزمون به مجوزِ صادرشده توسط مدیر/ادیتور نیاز دارد.
function canTakeExam(user) {
  return user.role === 'student' || isManager(user);
}

// سوالِ ارسالی به مرورگر نه پاسخ درست را همراه دارد و نه سوال‌های بعدی را،
// چون با جلو رفتن آزمون دیگر بازگشتی در کار نیست.
function publicQuestion(q, index) {
  return {
    id: q.id,
    index: index + 1,
    text: q.text,
    topic: q.topic,
    options: Array.isArray(q.options) ? q.options : [],
  };
}

function attemptSummary(a) {
  return {
    id: a.id,
    total: a.total,
    score: a.score,
    percent: a.percent,
    passed: a.passed,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
  };
}

function permitInfo(p) {
  if (!p) return null;
  return {
    id: p.id,
    grantedByName: p.grantedByName,
    grantedAt: p.grantedAt.toISOString(),
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    note: p.note,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!canTakeExam(user)) {
    return Response.json({ ok: false, error: 'آزمون فارغ‌التحصیلی فقط برای هنرجویان است.' }, { status: 403 });
  }

  const now = new Date();
  const [bankSize, attempts, certificate, permit] = await Promise.all([
    prisma.examQuestion.count({ where: { active: true } }),
    prisma.examAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: 'desc' }, take: 10 }),
    prisma.certificate.findFirst({ where: { userId: user.id, revoked: false }, orderBy: { issuedAt: 'desc' } }),
    findUsablePermit(user.id, now),
  ]);

  const passedBefore = attempts.some((a) => a.passed);
  let open = attempts.find((a) => !a.submittedAt) || null;

  // مکان‌نما را با زمان واقعی هماهنگ می‌کنیم؛ سوال‌هایی که مهلتشان در نبودِ هنرجو گذشته، رد می‌شوند.
  if (open) open = await syncCursor(open, now);

  // تلاشِ تمام‌شده اما تصحیح‌نشده در همین درخواست نمره‌گذاری نمی‌شود؛
  // مرورگر آن را به مسیر submit می‌فرستد تا منطق نمره‌دهی یک‌جا بماند.
  const over = open ? isAttemptOver(open, now) : false;

  let current = null;
  if (open && !over) {
    const ids = Array.isArray(open.questionIds) ? open.questionIds : [];
    const qid = ids[open.cursor];
    const q = qid ? await prisma.examQuestion.findUnique({ where: { id: qid } }) : null;
    const answers = open.answers && typeof open.answers === 'object' ? open.answers : {};
    current = {
      id: open.id,
      total: open.total,
      cursor: open.cursor,
      answeredCount: Object.keys(answers).length,
      perQuestionSec: open.perQuestionSec,
      questionEndsAt: open.questionEndsAt ? open.questionEndsAt.toISOString() : null,
      expiresAt: open.expiresAt.toISOString(),
      // پاسخِ همین سوال، تا اگر صفحه رفرش شد گزینهٔ انتخابی گم نشود.
      choice: q && answers[q.id] !== undefined ? answers[q.id] : null,
      question: q ? publicQuestion(q, open.cursor) : null,
      isLast: open.cursor >= open.total - 1,
    };
  }

  return Response.json({
    ok: true,
    config: {
      questionCount: EXAM_QUESTION_COUNT,
      secondsPerQuestion: EXAM_SECONDS_PER_QUESTION,
      passPercent: EXAM_PASS_PERCENT,
    },
    bankSize,
    permit: permitInfo(permit),
    canStart: !open && !passedBefore && bankSize > 0 && !!permit,
    passedBefore,
    expiredAttemptId: open && over ? open.id : null,
    current,
    history: attempts.filter((a) => a.submittedAt).map(attemptSummary),
    certificate: certificate
      ? { serial: certificate.serial, issuedAt: certificate.issuedAt.toISOString(), percent: certificate.percent }
      : null,
  });
}

// شروع آزمون: سوالات همین‌جا قفل می‌شوند تا رفرش صفحه، سوال‌ها را عوض نکند.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!canTakeExam(user)) {
    return Response.json({ ok: false, error: 'آزمون فارغ‌التحصیلی فقط برای هنرجویان است.' }, { status: 403 });
  }

  const now = new Date();
  const open = await prisma.examAttempt.findFirst({
    where: { userId: user.id, submittedAt: null, expiresAt: { gt: now } },
  });
  if (open) return Response.json({ ok: false, error: 'یک آزمون باز دارید؛ ابتدا همان را کامل کنید.' }, { status: 409 });

  const passed = await prisma.examAttempt.findFirst({ where: { userId: user.id, passed: true } });
  if (passed) return Response.json({ ok: false, error: 'شما قبلاً در این آزمون قبول شده‌اید.' }, { status: 409 });

  // بدون اجازهٔ مدیر یا ادیتور، آزمون باز نمی‌شود.
  const permit = await findUsablePermit(user.id, now);
  if (!permit) {
    return Response.json({
      ok: false,
      error: 'برای شرکت در آزمون باید مدیر یا ادیتور به شما اجازه بدهد. پس از صدور اجازه، همین صفحه دکمهٔ شروع را نشان می‌دهد.',
      needsPermit: true,
    }, { status: 403 });
  }

  const pool = await prisma.examQuestion.findMany({ where: { active: true }, select: { id: true } });
  if (pool.length === 0) {
    return Response.json({ ok: false, error: 'هنوز سوالی در بانک آزمون ثبت نشده است.' }, { status: 409 });
  }

  const chosen = pickRandom(pool.map((q) => q.id), EXAM_QUESTION_COUNT);
  const perMs = EXAM_SECONDS_PER_QUESTION * 1000;

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user.id,
      questionIds: chosen,
      answers: {},
      total: chosen.length,
      cursor: 0,
      perQuestionSec: EXAM_SECONDS_PER_QUESTION,
      questionEndsAt: new Date(now.getTime() + perMs),
      expiresAt: new Date(now.getTime() + chosen.length * perMs),
    },
  });

  // مجوز همین‌جا خرج می‌شود. شرط usedAt در updateMany جلوی مصرف دوباره‌ی
  // یک مجوز را در دو درخواست هم‌زمان می‌گیرد.
  const spent = await prisma.examPermit.updateMany({
    where: { id: permit.id, usedAt: null, revoked: false },
    data: { usedAt: now, attemptId: attempt.id },
  });
  if (spent.count === 0) {
    await prisma.examAttempt.delete({ where: { id: attempt.id } });
    return Response.json({ ok: false, error: 'اجازهٔ آزمون شما معتبر نیست. با پشتیبانی تماس بگیرید.' }, { status: 403 });
  }

  return Response.json({ ok: true });
}
