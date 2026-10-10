import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { normalizeCustomValues } from '@/lib/resumeFields';

const number = (raw, min, max) => {
  if (raw === '' || raw === null || raw === undefined) return null;
  const value = Number(String(raw).replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)));
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
};
const text = (raw, limit) => typeof raw === 'string' ? raw.trim().slice(0, limit) : '';

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') return Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 });
  const [resume, fields] = await Promise.all([
    prisma.actorResume.findUnique({ where: { userId: user.id }, include: { photos: { orderBy: { createdAt: 'asc' } } } }),
    prisma.resumeFieldDef.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
  ]);
  return Response.json({ ok: true, resume, fields, profilePhotoUrl: user.photoUrl });
}

export async function PUT(request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') return Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }
  const firstName = text(body.firstName, 60);
  const lastName = text(body.lastName, 60);
  if (!firstName || !lastName) return Response.json({ ok: false, error: 'نام و نام خانوادگی الزامی است.' }, { status: 400 });
  if (!['male', 'female'].includes(body.gender)) return Response.json({ ok: false, error: 'جنسیت را انتخاب کنید.' }, { status: 400 });
  const age = number(body.age, 1, 120);
  const heightCm = number(body.heightCm, 50, 250);
  const weightKg = number(body.weightKg, 20, 250);
  for (const [key, value] of Object.entries({ age, heightCm, weightKg })) {
    if (body[key] !== '' && body[key] != null && value === null) return Response.json({ ok: false, error: 'سن، قد یا وزن معتبر نیست.' }, { status: 400 });
  }
  const fields = await prisma.resumeFieldDef.findMany({ where: { active: true } });
  const { values, missing } = normalizeCustomValues(fields, body.customValues);
  if (missing.length) return Response.json({ ok: false, error: `فیلدهای الزامی: ${missing.join('، ')}` }, { status: 400 });
  const data = { firstName, lastName, fullName: `${firstName} ${lastName}`, gender: body.gender, age, heightCm, weightKg, city: text(body.city, 60) || null, customValues: values };
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
    const existing = await tx.actorResume.findUnique({ where: { userId: user.id }, select: { gender: true, _count: { select: { photos: true } } } });
    if (existing?._count.photos && existing.gender !== body.gender) return { error: 'برای تغییر جنسیت پس از ثبت عکس، با مدیریت تماس بگیرید.' };
    const resume = await tx.actorResume.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data, isPublic: true },
    });
    return { resume };
  });
  if (result.error) return Response.json({ ok: false, error: result.error }, { status: 400 });
  return Response.json({ ok: true, resume: result.resume });
}
