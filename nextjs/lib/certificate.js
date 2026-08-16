import { copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { buildSerial } from '@/lib/exam';
import { normalizeNationalId, isValidNationalId } from '@/lib/enrollmentData';

const UPLOADS = path.join(process.cwd(), 'uploads');
const MEDIA_URL = /^\/media\/([A-Za-z0-9._-]+)$/;

// عکس پروفایل با هر آپلود تازه از دیسک پاک می‌شود، پس گواهی نمی‌تواند به همان فایل ارجاع
// بدهد؛ یک کپیِ جداگانه می‌گیریم که فقط به گواهی تعلق دارد. اگر کپی نگرفت، صدور گواهی
// نباید متوقف شود و گواهی بدون عکس صادر می‌شود.
async function snapshotPhoto(photoUrl) {
  const m = MEDIA_URL.exec(photoUrl || '');
  if (!m) return null;
  const ext = path.extname(m[1]) || '.webp';
  const name = `cert-${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
  try {
    await copyFile(path.join(UPLOADS, m[1]), path.join(UPLOADS, name));
  } catch {
    return null;
  }
  // عکسی که مدیر در فرم آپلود کرده فقط یک فایلِ موقت است و بعد از گرفتنِ کپیِ گواهی
  // مصرفش تمام می‌شود. عکس پروفایلِ هنرجو (photo-…) هرگز اینجا پاک نمی‌شود.
  if (m[1].startsWith('certphoto-')) await unlink(path.join(UPLOADS, m[1])).catch(() => {});
  return `/media/${name}`;
}

// جایگزینی یا حذفِ عکسِ یک گواهیِ صادرشده. عکس تازه هم مثل لحظهٔ صدور کپیِ مستقلِ خودش را
// می‌گیرد تا با تغییر بعدیِ پروفایلِ هنرجو عوض نشود، و کپیِ قبلی از دیسک پاک می‌شود.
// sourceUrl خالی یعنی گواهی بدون عکس شود.
export async function setCertificatePhoto(id, sourceUrl) {
  const current = await prisma.certificate.findUnique({ where: { id }, select: { photoUrl: true } });
  if (!current) return null;

  const photoUrl = sourceUrl ? await snapshotPhoto(sourceUrl) : null;
  if (sourceUrl && !photoUrl) throw new Error('photo_copy_failed');

  const updated = await prisma.certificate.update({ where: { id }, data: { photoUrl } });

  const old = MEDIA_URL.exec(current.photoUrl || '');
  if (old && current.photoUrl !== photoUrl) {
    await unlink(path.join(UPLOADS, old[1])).catch(() => {});
  }
  return updated;
}

// صدور گواهی برای یک کاربر. اطلاعات هویتی در لحظهٔ صدور کپی می‌شود تا تغییر بعدیِ پروفایل،
// گواهیِ صادرشده را عوض نکند. اگر برای همان تلاشِ آزمون قبلاً گواهی صادر شده باشد، همان برگردانده می‌شود.
export async function issueCertificate(user, {
  attemptId = null,
  percent = null,
  examPercent = null,
  classScore = null,
  issuedById = null,
  // جنسیتِ انتخاب‌شده در لحظهٔ صدور؛ مبنای درج «آقای/خانم» روی گواهی است و بر
  // مقدار پروفایل مقدم است، چون پروفایلِ هنرجویان قدیمی اغلب ناقص ثبت شده.
  gender = null,
  // کد ملیِ تأییدشده در لحظهٔ صدور؛ کد استعلام از روی آن ساخته می‌شود.
  nationalId = null,
  // بازنویسی‌های صدور دستی. هرکدام خالی بماند، همان مقدارِ پروفایل استفاده می‌شود.
  // نامِ روی گواهی باید دقیقاً نامِ شناسنامه‌ای باشد و همیشه با نامِ نمایشیِ پروفایل یکی نیست.
  fullName = null,
  courseTitle = null,
  branch = null,
  // عکسِ انتخابیِ مدیر؛ برای هنرجویی که در پروفایلش عکس نگذاشته است.
  photoUrl: photoOverride = null,
  // تاریخ صدور برای گواهیِ دوره‌های گذشته؛ خالی یعنی همین حالا.
  issuedAt = null,
} = {}) {
  if (attemptId) {
    const existing = await prisma.certificate.findUnique({ where: { attemptId } });
    if (existing) return existing;
  }

  const code = normalizeNationalId(nationalId || user.nationalId);
  if (!isValidNationalId(code)) throw new Error('national_id_required');

  const photoUrl = await snapshotPhoto(photoOverride || user.photoUrl);

  try {
    // کد استعلام باید یکتا باشد؛ برای گواهی دوم همان شخص، شمارهٔ ترتیبی بالا می‌رود.
    for (let seq = 1; seq <= 20; seq++) {
      const serial = buildSerial(code, seq);
      try {
        return await prisma.certificate.create({
          data: {
            serial,
            userId: user.id,
            attemptId,
            fullName: fullName || user.displayName || user.username || user.phone,
            gender: gender || user.gender || null,
            nationalId: code,
            courseTitle: courseTitle || user.courseTitle || null,
            branch: branch || user.branch || null,
            photoUrl,
            percent,
            examPercent,
            classScore,
            issuedById,
            ...(issuedAt ? { issuedAt } : {}),
          },
        });
      } catch (err) {
        // فقط برخورد شمارهٔ تکراری قابل تکرار است؛ بقیهٔ خطاها باید بالا بروند.
        if (err?.code !== 'P2002') throw err;
      }
    }
    throw new Error('serial_generation_failed');
  } catch (err) {
    // گواهی ثبت نشد، پس کپیِ عکس هم بی‌صاحب می‌ماند و باید پاک شود.
    if (photoUrl) await unlink(path.join(UPLOADS, photoUrl.slice('/media/'.length))).catch(() => {});
    throw err;
  }
}
