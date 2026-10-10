import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { parseResumeBody, serializeResume } from '@/lib/resume';

// بانک رزومه‌ها کاملاً مستقل از حساب‌های کاربری است و فقط ادمین/ادیتور به آن دسترسی دارد.
async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const { user, error } = await requireManager();
  if (error) return error;

  const resumes = await prisma.actorResume.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, fullName: true, headline: true,
      userId: true, user: { select: { photoUrl: true } },
      city: true, isPublic: true, updatedAt: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { url: true, approvalStatus: true } },
      _count: { select: { videos: true } },
    },
  });

  return Response.json({
    ok: true,
    resumes: resumes.map((r) => ({
      id: r.id,
      userId: r.userId,
      fullName: r.fullName,
      headline: r.headline,
      city: r.city,
      isPublic: r.isPublic,
      updatedAt: r.updatedAt,
      coverUrl: r.userId ? r.user?.photoUrl || null : r.photos.find((photo) => photo.approvalStatus === 'approved')?.url || null,
      photoCount: r.photos.filter((photo) => photo.approvalStatus !== 'rejected').length,
      pendingCount: ['admin', 'editor'].includes(user.role) && r.userId ? r.photos.filter((photo) => photo.approvalStatus === 'pending').length : 0,
      videoCount: r._count.videos,
    })),
  });
}

export async function POST(request) {
  const { user, error } = await requireManager();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const fieldDefs = await prisma.resumeFieldDef.findMany({ orderBy: { sortOrder: 'asc' } });
  const parsed = parseResumeBody(body, fieldDefs);
  if (parsed.error) return Response.json({ ok: false, error: parsed.error }, { status: 400 });

  const resume = await prisma.actorResume.create({
    data: {
      ...parsed.data,
      photos: { create: parsed.photos },
      videos: { create: parsed.videos },
    },
    include: {
      photos: { orderBy: { sortOrder: 'asc' } },
      videos: { orderBy: { sortOrder: 'asc' } },
    },
  });

  await logAction(user, {
    action: 'resume.create',
    targetType: 'resume',
    targetId: resume.id,
    summary: `رزومهٔ «${resume.fullName}» ساخته شد.`,
  });

  return Response.json({ ok: true, resume: serializeResume(resume) });
}
