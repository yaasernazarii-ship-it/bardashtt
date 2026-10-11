import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanText, cleanEnum, cleanPagination } from '@/lib/growthApi';
import { JOURNAL_VISIBILITIES } from '@/lib/growthConfig';

function serialize(e) {
  return {
    id: e.id, content: e.content, visibility: e.visibility,
    createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(),
  };
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  const { searchParams } = new URL(request.url);
  const { skip, take, page, pageSize } = cleanPagination(searchParams, { defaultPageSize: 20 });

  const where = { userId: user.id };
  const visibility = searchParams.get('visibility');
  if (JOURNAL_VISIBILITIES.includes(visibility)) where.visibility = visibility;

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.journalEntry.count({ where }),
  ]);

  return ok({ entries: entries.map(serialize), page, pageSize, total });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const content = cleanText(b.content, 20000);
  if (!content) return fail('متن یادداشت الزامی است.', 400);

  const visibility = cleanEnum(b.visibility, JOURNAL_VISIBILITIES, 'private');

  const entry = await prisma.journalEntry.create({
    data: { userId: user.id, content, visibility },
  });
  return ok({ entry: serialize(entry) }, 201);
}
