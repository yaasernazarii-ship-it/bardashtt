import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { normalizeCustomValues } from '@/lib/resumeFields';

export const runtime = 'nodejs';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Map([
  ['video/mp4', 'mp4'], ['video/webm', 'webm'], ['video/quicktime', 'mov'],
]);

function text(value, limit) {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, limit) || null;
}

const REQUIRED_POSES = ['front', 'profile', 'threeQuarter'];

async function hasCompleteIntroduction(userId) {
  const [user, resume, fields] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } }),
    prisma.actorResume.findUnique({
      where: { userId },
      select: {
        firstName: true, lastName: true, gender: true, age: true, heightCm: true, weightKg: true, city: true, customValues: true,
        photos: { where: { approvalStatus: { in: ['pending', 'approved'] } }, select: { pose: true } },
      },
    }),
    prisma.resumeFieldDef.findMany({ where: { active: true } }),
  ]);
  const { missing } = normalizeCustomValues(fields, resume?.customValues);
  return !!(
    user?.photoUrl
    && resume?.firstName && resume.lastName && resume.gender && resume.age && resume.heightCm && resume.weightKg && resume.city
    && missing.length === 0
    && REQUIRED_POSES.every((pose) => resume.photos.some((photo) => photo.pose === pose))
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') return Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 });
  const ready = await hasCompleteIntroduction(user.id);
  const resume = await prisma.actorResume.findUnique({
    where: { userId: user.id },
    select: { id: true, portfolioItems: { orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] } },
  });
  return Response.json({ ok: true, ready, items: resume?.portfolioItems || [] });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') return Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 });
  if (!await hasCompleteIntroduction(user.id)) return Response.json({ ok: false, error: 'ابتدا مشخصات معرفی، عکس پروفایل و عکس‌های تمام‌رخ، نیم‌رخ و سه‌رخ را ثبت کنید.' }, { status: 400 });
  let form;
  try { form = await request.formData(); }
  catch { return Response.json({ ok: false, error: 'درخواست بارگذاری معتبر نیست.' }, { status: 400 }); }

  const file = form.get('file');
  const type = form.get('type');
  const title = text(form.get('title'), 150);
  const description = text(form.get('description'), 1500);
  if (!file || !['image', 'video'].includes(type)) return Response.json({ ok: false, error: 'نوع نمونه‌کار معتبر نیست.' }, { status: 400 });
  if (type === 'image' && (!IMAGE_TYPES.has(file.type) || file.size > 30 * 1024 * 1024)) return Response.json({ ok: false, error: 'فقط عکس JPG، PNG یا WebP تا ۳۰ مگابایت پذیرفته می‌شود.' }, { status: 400 });
  if (type === 'video' && (!VIDEO_TYPES.has(file.type) || file.size > 200 * 1024 * 1024)) return Response.json({ ok: false, error: 'فقط ویدئوی MP4، WebM یا MOV تا ۲۰۰ مگابایت پذیرفته می‌شود.' }, { status: 400 });

  let bytes;
  let extension;
  if (type === 'image') {
    try { bytes = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(); }
    catch { return Response.json({ ok: false, error: 'فایل تصویر معتبر نیست.' }, { status: 400 }); }
    extension = 'webp';
  } else {
    bytes = Buffer.from(await file.arrayBuffer());
    extension = VIDEO_TYPES.get(file.type);
  }

  const uploads = path.join(process.cwd(), 'uploads');
  await mkdir(uploads, { recursive: true });
  const name = `portfolio-${Date.now()}-${randomBytes(8).toString('hex')}.${extension}`;
  const filename = path.join(uploads, name);
  await writeFile(filename, bytes);
  try {
    const item = await prisma.$transaction(async (tx) => {
      const resume = await tx.actorResume.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!resume) return null;
      const last = await tx.actorPortfolioItem.findFirst({ where: { resumeId: resume.id, type }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
      return tx.actorPortfolioItem.create({ data: { resumeId: resume.id, type, sourceUrl: `/media/${name}`, title, description, sortOrder: (last?.sortOrder ?? -1) + 1 } });
    });
    if (!item) {
      await unlink(filename);
      return Response.json({ ok: false, error: 'ابتدا مشخصات معرفی خود را ذخیره کنید.' }, { status: 400 });
    }
    return Response.json({ ok: true, item });
  } catch {
    await unlink(filename).catch(() => {});
    return Response.json({ ok: false, error: 'ثبت نمونه‌کار انجام نشد.' }, { status: 500 });
  }
}
