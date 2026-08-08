import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import {
  EXAM_DURATION_MIN,
  EXAM_PASS_PERCENT,
  EXAM_QUESTION_COUNT,
  pickRandom,
} from '@/lib/exam';

// آزمون فارغ‌التحصیلی مخصوص هنرجوست؛ مدیر هم برای بازبینی می‌تواند آن را باز کند.
function canTakeExam(user) {
  return user.role === 'student' || isManager(user);
}

// سوالِ ارسالی به مرورگر هرگز پاسخ درست را همراه ندارد.
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

// سوالات یک تلاش را به همان ترتیبِ ذخیره‌شده برمی‌گرداند.
async function questionsOfAttempt(attempt) {
  const ids = Array.isArray(attempt.questionIds) ? attempt.questionIds : [];
  const rows = await prisma.examQuestion.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!canTakeExam(user)) {
    return Response.json({ ok: false, error: 'آزمون فارغ‌التحصیلی فقط برای هنرجویان است.' }, { status: 403 });
  }

  const now = new Date();
  const [bankSize, attempts, certificate] = await Promise.all([
    prisma.examQuestion.count({ where: { active: true } }),
    prisma.examAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: 'desc' }, take: 10 }),
    prisma.certificate.findFirst({ where: { userId: user.id, revoked: false }, orderBy: { issuedAt: 'desc' } }),
  ]);

  // تلاشِ باز = ثبت‌نشده و هنوز در مهلت. تلاشِ منقضی‌شده در همین درخواست تصحیح نمی‌شود؛
  // فقط در submit تصحیح می‌شود تا منطق نمره‌دهی یک‌جا بماند.
  const open = attempts.find((a) => !a.submittedAt && a.expiresAt > now) || null;
  const expired = attempts.find((a) => !a.submittedAt && a.expiresAt <= now) || null;
  const passedBefore = attempts.some((a) => a.passed);

  let current = null;
  if (open) {
    const qs = await questionsOfAttempt(open);
    current = {
      id: open.id,
      total: open.total,
      expiresAt: open.expiresAt.toISOString(),
      answers: open.answers && typeof open.answers === 'object' ? open.answers : {},
      questions: qs.map(publicQuestion),
    };
  }

  return Response.json({
    ok: true,
    config: {
      questionCount: EXAM_QUESTION_COUNT,
      durationMin: EXAM_DURATION_MIN,
      passPercent: EXAM_PASS_PERCENT,
    },
    bankSize,
    canStart: !open && !passedBefore && bankSize > 0,
    passedBefore,
    expiredAttemptId: expired ? expired.id : null,
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

  const pool = await prisma.examQuestion.findMany({ where: { active: true }, select: { id: true } });
  if (pool.length === 0) {
    return Response.json({ ok: false, error: 'هنوز سوالی در بانک آزمون ثبت نشده است.' }, { status: 409 });
  }

  const chosen = pickRandom(pool.map((q) => q.id), EXAM_QUESTION_COUNT);
  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user.id,
      questionIds: chosen,
      answers: {},
      total: chosen.length,
      expiresAt: new Date(Date.now() + EXAM_DURATION_MIN * 60 * 1000),
    },
  });

  const qs = await questionsOfAttempt(attempt);
  return Response.json({
    ok: true,
    current: {
      id: attempt.id,
      total: attempt.total,
      expiresAt: attempt.expiresAt.toISOString(),
      answers: {},
      questions: qs.map(publicQuestion),
    },
  });
}
