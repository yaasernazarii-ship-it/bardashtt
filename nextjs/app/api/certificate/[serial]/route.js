import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { normalizeSerial } from '@/lib/exam';
import { buildCertificatePdf } from '@/lib/certificatePdf';

// ساخت PDF به pdfkit و sharp نیاز دارد؛ هر دو فقط روی Node اجرا می‌شوند.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// دانلود فایل گواهی. فقط دارندهٔ گواهی و مدیران دسترسی دارند؛
// استعلام عمومی از مسیر جدا (/api/verify) انجام می‌شود و فایل نمی‌دهد.
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const { serial: raw } = await params;
  const serial = normalizeSerial(decodeURIComponent(raw || ''));
  const cert = await prisma.certificate.findUnique({ where: { serial } });
  if (!cert) return Response.json({ ok: false, error: 'گواهی یافت نشد.' }, { status: 404 });
  if (cert.userId !== user.id && !isManager(user)) {
    return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });
  }

  const pdf = await buildCertificatePdf(cert);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificate-${cert.serial}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
