import { embedSrc } from './embed';
import { normalizeCustomValues } from './resumeFields';

const MAX_PHOTOS = 20;
const MAX_VIDEOS = 20;

function str(v, max) {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

function intOrNull(v, min, max) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(String(v).replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0)), 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

// عکس یا فایلِ آپلودشده روی همین سایت (/media/…) یا نشانیِ کاملِ بیرونی.
export function normalizeMediaUrl(value) {
  const url = String(value ?? '').trim();
  if (!url) return null;
  if (/^\/media\/[A-Za-z0-9._-]+$/.test(url)) return url;
  if (/^https?:\/\/\S+$/i.test(url)) return url.slice(0, 1000);
  return null;
}

// ورودی ویدیو می‌تواند لینک آپارات، نشانیِ امبد، کدِ کاملِ iframe یا فایلِ آپلودشده باشد.
// فقط چیزی پذیرفته می‌شود که در نهایت به یک نشانیِ امنِ http(s) یا /media/ تبدیل شود.
export function normalizeVideoUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^\/media\/[A-Za-z0-9._-]+$/.test(raw)) return raw;
  return embedSrc(raw) ? raw.slice(0, 1000) : null;
}

export function serializeResume(r) {
  if (!r) return null;
  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    fullName: r.fullName,
    headline: r.headline,
    bio: r.bio,
    gender: r.gender,
    city: r.city,
    birthYear: r.birthYear,
    age: r.age,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    contactPhone: r.contactPhone,
    skills: r.skills,
    experience: r.experience,
    showreelUrl: r.showreelUrl,
    customValues: r.customValues || {},
    isPublic: r.isPublic,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    photos: (r.photos || []).map((p) => ({ id: p.id, url: p.url, caption: p.caption, sortOrder: p.sortOrder })),
    videos: (r.videos || []).map((v) => ({ id: v.id, url: v.url, title: v.title, description: v.description, sortOrder: v.sortOrder })),
  };
}

// بدنهٔ فرم پنل را به دادهٔ آمادهٔ ذخیره تبدیل می‌کند.
// خروجی: { error } یا { data, photos, videos }
export function parseResumeBody(body, fieldDefs) {
  const firstName = str(body.firstName, 60);
  const lastName = str(body.lastName, 60);
  if (!firstName) return { error: 'نام الزامی است.' };
  if (!lastName) return { error: 'نام خانوادگی الزامی است.' };

  const { values, missing } = normalizeCustomValues(fieldDefs, body.customValues);
  if (missing.length) return { error: `این فیلدهای الزامی خالی هستند: ${missing.join('، ')}` };

  const rawPhotos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  const photos = [];
  for (const item of rawPhotos) {
    const url = normalizeMediaUrl(item?.url);
    if (!url) continue;
    photos.push({ url, caption: str(item?.caption, 200), sortOrder: photos.length });
  }

  const rawVideos = Array.isArray(body.videos) ? body.videos.slice(0, MAX_VIDEOS) : [];
  const videos = [];
  for (const item of rawVideos) {
    const url = normalizeVideoUrl(item?.url);
    if (!url) continue;
    videos.push({
      url,
      title: str(item?.title, 150),
      description: str(item?.description, 1500),
      sortOrder: videos.length,
    });
  }

  return {
    data: {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      headline: str(body.headline, 120),
      bio: str(body.bio, 1500),
      gender: ['male', 'female'].includes(body.gender) ? body.gender : null,
      city: str(body.city, 60),
      birthYear: intOrNull(body.birthYear, 1300, 1420),
      age: intOrNull(body.age, 1, 120),
      heightCm: intOrNull(body.heightCm, 50, 250),
      weightKg: intOrNull(body.weightKg, 20, 250),
      contactPhone: str(body.contactPhone, 20),
      skills: str(body.skills, 400),
      experience: str(body.experience, 3000),
      showreelUrl: normalizeMediaUrl(body.showreelUrl),
      customValues: values,
      isPublic: !!body.isPublic,
    },
    photos,
    videos,
  };
}

// نشانی‌های محلیِ یک رزومه، برای پاک‌کردن فایل‌ها هنگام حذف یا جایگزینی.
export function resumeLocalUrls(resume) {
  if (!resume) return [];
  return [
    resume.showreelUrl,
    ...(resume.photos || []).map((p) => p.url),
    ...(resume.videos || []).map((v) => v.url),
  ];
}
