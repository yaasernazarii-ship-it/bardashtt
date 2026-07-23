import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

function serialize(r) {
  if (!r) return null;
  return {
    fullName: r.fullName,
    headline: r.headline,
    bio: r.bio,
    gender: r.gender,
    city: r.city,
    birthYear: r.birthYear,
    heightCm: r.heightCm,
    skills: r.skills,
    experience: r.experience,
    photoUrl: r.photoUrl,
    showreelUrl: r.showreelUrl,
    selfVideoUrl: r.selfVideoUrl,
    isPublic: r.isPublic,
  };
}

function str(v, max) {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

function intOrNull(v, min, max) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  const resume = await prisma.actorResume.findUnique({ where: { userId: user.id } });
  return Response.json({ ok: true, resume: serialize(resume) });
}

export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  // هنرجو اجازه‌ی ویرایش رزومه را ندارد؛ رزومه‌ی او را خانواده برداشت می‌سازد.
  // (هنرجو فقط می‌تواند از مسیر /api/resume/video ویدیوی معرفی‌اش را بگذارد.)
  if (user.role === 'student') {
    return Response.json({ ok: false, error: 'ویرایش رزومه توسط هنرجو مجاز نیست.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const fullName = str(body.fullName, 80);
    if (!fullName) return Response.json({ ok: false, error: 'نام و نام خانوادگی الزامی است.' }, { status: 400 });

    const data = {
      fullName,
      headline: str(body.headline, 100),
      bio: str(body.bio, 600),
      gender: ['male', 'female'].includes(body.gender) ? body.gender : null,
      city: str(body.city, 60),
      birthYear: intOrNull(body.birthYear, 1300, 1420),
      heightCm: intOrNull(body.heightCm, 100, 230),
      skills: str(body.skills, 300),
      experience: str(body.experience, 1500),
      photoUrl: str(body.photoUrl, 500),
      showreelUrl: str(body.showreelUrl, 500),
      isPublic: !!body.isPublic,
    };

    const resume = await prisma.actorResume.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });
    return Response.json({ ok: true, resume: serialize(resume) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
