import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { prisma } from './prisma';

function escape(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}

function artwork(certificate) {
  const name = escape(certificate.fullName);
  const serial = escape(certificate.serial);
  return `<svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1400" height="900" fill="#171511"/>
    <rect x="32" y="32" width="1336" height="836" rx="16" fill="#f7f0df" stroke="#b58a28" stroke-width="8"/>
    <rect x="52" y="52" width="1296" height="796" rx="10" fill="none" stroke="#d5ba70" stroke-width="2"/>
    <text x="700" y="188" text-anchor="middle" font-family="serif" font-size="66" font-weight="700" fill="#8d6718">BARDASHT</text>
    <text x="700" y="266" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#554a35">GRADUATION CERTIFICATE</text>
    <line x1="360" y1="315" x2="1040" y2="315" stroke="#b58a28" stroke-width="3"/>
    <text x="700" y="422" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#554a35">AWARDED TO</text>
    <text x="700" y="500" text-anchor="middle" font-family="sans-serif" font-size="52" font-weight="700" fill="#252018">${name}</text>
    <text x="700" y="590" text-anchor="middle" font-family="sans-serif" font-size="27" fill="#554a35">Acting program completion verified by Bardasht</text>
    <circle cx="700" cy="700" r="72" fill="#b58a28"/>
    <path d="M665 700l23 23 48-55" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="700" y="810" text-anchor="middle" font-family="monospace" font-size="24" fill="#554a35">${serial}</text>
  </svg>`;
}

export async function syncCertificatePortfolio(userId) {
  const [certificate, resume] = await Promise.all([
    prisma.certificate.findFirst({ where: { userId, revoked: false }, orderBy: { issuedAt: 'desc' } }),
    prisma.actorResume.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  if (!certificate || !resume) return null;
  const existing = await prisma.actorPortfolioItem.findFirst({ where: { resumeId: resume.id, type: 'certificate' }, select: { id: true } });
  if (existing) return existing;

  const uploads = path.join(process.cwd(), 'uploads');
  await mkdir(uploads, { recursive: true });
  const name = `portfolio-certificate-${Date.now()}-${randomBytes(8).toString('hex')}.webp`;
  await sharp(Buffer.from(artwork(certificate))).webp({ quality: 92 }).toFile(path.join(uploads, name));
  try {
    return await prisma.actorPortfolioItem.create({
      data: {
        resumeId: resume.id,
        type: 'certificate',
        sourceUrl: `/media/${name}`,
        title: 'گواهی‌نامهٔ فارغ‌التحصیلی',
        description: `کد استعلام: ${certificate.serial}`,
        status: 'pending',
      },
    });
  } catch (error) {
    await unlink(path.join(uploads, name)).catch(() => {});
    throw error;
  }
}
