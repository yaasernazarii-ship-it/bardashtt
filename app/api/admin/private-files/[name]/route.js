import { readFile } from 'node:fs/promises';
import { getSessionUser, isManager } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActionStrict } from '@/lib/audit';
import { privateDocumentPath, privateDocumentRef } from '@/lib/privateDocuments';

const CONTENT_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { name } = await params;
  const ref = privateDocumentRef(name);
  const type = CONTENT_TYPE[name.split('.').pop()?.toLowerCase()];
  if (!ref || !type) return new Response('Not found', { status: 404 });

  const signup = await prisma.signupRequest.findFirst({
    where: { idCardImage: ref },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!signup) return new Response('Not found', { status: 404 });

  let buffer;
  try {
    buffer = await readFile(privateDocumentPath(name));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const logged = await logActionStrict(user, {
    action: 'signup.document.view',
    targetType: 'signupRequest',
    targetId: signup.id,
    summary: `مشاهدهٔ مدرک خصوصی درخواست ${signup.firstName} ${signup.lastName}`,
  });
  if (!logged) return Response.json({ ok: false, error: 'ثبت گزارش امنیتی انجام نشد؛ دسترسی به مدرک متوقف شد.' }, { status: 503 });

  return new Response(buffer, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': `inline; filename="identity-document.${name.split('.').pop()}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
