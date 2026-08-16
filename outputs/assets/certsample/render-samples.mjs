// ساخت نمونهٔ گواهی بدون دیتابیس: رکورد گواهی دستی ساخته می‌شود و مستقیم به سازندهٔ PDF می‌رود.
import fs from 'node:fs';
import path from 'node:path';
import { buildCertificatePdf } from '../../../nextjs/lib/certificatePdf.js';

const OUT = '/project/outputs';
const UPLOADS = path.join(process.cwd(), 'uploads');

// عکس نمونه در پوشهٔ uploadsِ نکست گذاشته می‌شود، همان جایی که عکس واقعی کاربر می‌نشیند.
fs.mkdirSync(UPLOADS, { recursive: true });
fs.copyFileSync('/project/outputs/assets/certsample/sample-photo.webp', path.join(UPLOADS, 'sample-photo.webp'));

const base = {
  serial: '1397-0021234566',
  fullName: 'مریم رضایی',
  gender: 'female',
  nationalId: '0021234566',
  branch: 'تهران — سعادت‌آباد',
  photoUrl: '/media/sample-photo.webp',
  percent: 87.5,
  revoked: false,
  issuedAt: new Date('2026-08-16T09:00:00Z'),
};

const samples = [
  ['gavahi-nemune', base],
  ['gavahi-nemune-aghaye', { ...base, serial: '1397-0079452183', fullName: 'امیرحسین کریمی', gender: 'male', nationalId: '0079452183', percent: 92 }],
  ['gavahi-nemune-batel', { ...base, serial: '1397-0021234566-2', revoked: true }],
];

for (const [name, cert] of samples) {
  const pdf = await buildCertificatePdf(cert);
  fs.writeFileSync(`${OUT}/${name}.pdf`, pdf);
  console.log(name, `${(pdf.length / 1024).toFixed(0)}K`);
}
