import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { CONTENT_GROUPS, isKnownKey } from '@/lib/siteContent';

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  let rows = [];
  try { rows = await prisma.siteContent.findMany(); } catch { rows = []; }
  const saved = new Map(rows.map((r) => [r.key, r.value]));

  const groups = CONTENT_GROUPS.map((grp) => ({
    id: grp.id,
    title: grp.title,
    fields: grp.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      value: saved.has(f.key) ? saved.get(f.key) : f.default,
    })),
  }));
  return Response.json({ ok: true, groups });
}

export async function POST(request) {
  const g = await guard();
  if (g.error) return g.error;

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }

  const updates = body?.updates;
  if (!updates || typeof updates !== 'object') {
    return Response.json({ ok: false, error: 'داده‌ای برای ذخیره ارسال نشد.' }, { status: 400 });
  }

  const ops = [];
  for (const [key, raw] of Object.entries(updates)) {
    if (!isKnownKey(key)) continue;
    const value = String(raw ?? '').slice(0, 8000);
    ops.push(
      prisma.siteContent.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    );
  }
  if (ops.length === 0) return Response.json({ ok: false, error: 'تغییری برای ذخیره یافت نشد.' }, { status: 400 });

  await prisma.$transaction(ops);
  return Response.json({ ok: true, saved: ops.length });
}
