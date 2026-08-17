// رندرِ یک گواهیِ نمونه با همان کدِ لایو، فقط برای بازبینیِ نشانِ فنی و حرفه‌ای.
// روی سرور داخل مسیرِ لایو اجرا می‌شود و هیچ چیزی در دیتابیس تغییر نمی‌دهد.
import fs from 'node:fs';
import { buildCertificatePdf } from './lib/certificatePdf.js';

const cert = {
  serial: '1397-8452-3106',
  fullName: 'مریم رضایی‌فرد',
  gender: 'female',
  nationalId: '0021548796',
  percent: 91.5,
  photoUrl: null,
  revoked: false,
  issuedAt: new Date('2026-08-16T12:00:00Z'),
};

const pdf = await buildCertificatePdf(cert);
fs.writeFileSync('/tmp/live-check.pdf', pdf);
console.log('OK', pdf.length);
