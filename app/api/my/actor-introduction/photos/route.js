import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { INTRO_LOOKS, INTRO_PHOTO_LIMIT, INTRO_POSES } from '@/lib/resume';

export const runtime = 'nodejs';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') return Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 });
  let form;
  try { form = await request.formData(); }
  catch { return Response.json({ ok: false, error: 'درخواست بارگذاری معتبر نیست.' }, { status: 400 }); }
  const file = form.get('file');
  const look = form.get('look');
  const pose = form.get('pose');
  const resumeForUpload = await prisma.actorResume.findUnique({ where: { userId: user.id }, select: { gender: true } });
  if (!resumeForUpload) return Response.json({ ok: false, error: 'ابتدا مشخصات معرفی خود را ذخیره کنید.' }, { status: 400 });
  if (!INTRO_LOOKS[resumeForUpload.gender]?.includes(look) || !INTRO_POSES.includes(pose)) {
    return Response.json({ ok: false, error: 'حالت چهره و زاویهٔ عکس را انتخاب کنید.' }, { status: 400 });
  }
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 30 * 1024 * 1024) {
    return Response.json({ ok: false, error: 'فقط عکس jpg، png یا webp تا ۳۰ مگابایت پذیرفته می‌شود.' }, { status: 400 });
  }
  let output;
  try { output = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(); }
  catch { return Response.json({ ok: false, error: 'فایل تصویر معتبر نیست.' }, { status: 400 }); }
  const dir = path.join(process.cwd(), 'uploads');
  await mkdir(dir, { recursive: true });
  const name = `intro-${Date.now()}-${randomBytes(8).toString('hex')}.webp`;
  const filename = path.join(dir, name);
  await writeFile(filename, output);
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
      const resume = await tx.actorResume.findUnique({ where: { userId: user.id }, select: { id: true, gender: true } });
      if (!resume) return { error: 'ابتدا مشخصات معرفی خود را ذخیره کنید.' };
      if (resume.gender !== resumeForUpload.gender) return { error: 'مشخصات معرفی تغییر کرده است؛ صفحه را دوباره بارگذاری کنید.' };
      const count = await tx.resumePhoto.count({ where: { resumeId: resume.id, approvalStatus: { not: 'rejected' } } });
      if (count >= INTRO_PHOTO_LIMIT) return { error: 'سقف ۱۵ عکس معرفی در انتظار بررسی یا تأییدشده تکمیل شده است.' };
      const last = await tx.resumePhoto.findFirst({ where: { resumeId: resume.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
      const photo = await tx.resumePhoto.create({ data: { resumeId: resume.id, url: `/media/${name}`, look, pose, approvalStatus: 'pending', sortOrder: (last?.sortOrder ?? -1) + 1 } });
      return { photo };
    });
    if (result.error) {
      await unlink(filename);
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }
    return Response.json({ ok: true, photo: result.photo });
  } catch {
    await unlink(filename).catch(() => {});
    return Response.json({ ok: false, error: 'ثبت عکس انجام نشد.' }, { status: 500 });
  }
}
