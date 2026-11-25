import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { ok, fail, cleanText, requiredScore } from '@/lib/growthApi';

function cleanItems(input) {
  if (!Array.isArray(input)) return null;
  const items = [];
  for (const raw of input) {
    const skill = cleanText(raw?.skill, 200);
    const score = requiredScore(raw?.score);
    if (!skill || score === null) return null;
    items.push({ skill, score, comment: cleanText(raw?.comment, 2000) });
  }
  return items;
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);
  const { id } = await params;

  const student = await prisma.user.findFirst({ where: { id, role: 'student' } });
  if (!student) return fail('هنرجو یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const items = cleanItems(b.items);
  if (!items || !items.length) return fail('حداقل یک مهارت با نمرهٔ معتبر (۰ تا ۱۰۰) لازم است.', 400);

  const assessment = await prisma.assessment.create({
    data: {
      userId: id,
      createdById: user.id,
      generalComment: cleanText(b.generalComment, 5000),
      items: { create: items },
    },
    include: { items: true },
  });

  return ok({
    assessment: {
      id: assessment.id, generalComment: assessment.generalComment,
      createdAt: assessment.createdAt.toISOString(),
      items: assessment.items.map((it) => ({ id: it.id, skill: it.skill, score: it.score, comment: it.comment })),
    },
  }, 201);
}
