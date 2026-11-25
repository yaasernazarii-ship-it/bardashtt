import { mkdir, readdir, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';
import { privateDocumentName, privateDocumentPath, privateDocumentRef } from '../lib/privateDocuments.js';

const PUBLIC_RE = /^\/media\/(idcard-[A-Za-z0-9._-]+)$/;
const MAX_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

async function migrateLegacyDocuments() {
  const rows = await prisma.signupRequest.findMany({
    where: { idCardImage: { startsWith: '/media/idcard-' } },
    select: { id: true, idCardImage: true },
  });
  let migrated = 0;
  await mkdir(path.dirname(privateDocumentPath('placeholder')), { recursive: true, mode: 0o700 });
  for (const row of rows) {
    const match = PUBLIC_RE.exec(row.idCardImage || '');
    if (!match) continue;
    const source = path.join(process.cwd(), 'uploads', match[1]);
    const destination = privateDocumentPath(match[1]);
    try {
      await rename(source, destination);
      await prisma.signupRequest.update({ where: { id: row.id }, data: { idCardImage: privateDocumentRef(match[1]) } });
      migrated += 1;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return migrated;
}

async function cleanupOrphans() {
  const dir = path.dirname(privateDocumentPath('placeholder'));
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const referenced = new Set(
    (await prisma.signupRequest.findMany({
      where: { idCardImage: { startsWith: 'private:idcard:' } },
      select: { idCardImage: true },
    })).map((row) => privateDocumentName(row.idCardImage)).filter(Boolean),
  );

  let removed = 0;
  for (const name of await readdir(dir)) {
    if (referenced.has(name) || !privateDocumentName(privateDocumentRef(name))) continue;
    const file = privateDocumentPath(name);
    const info = await stat(file).catch(() => null);
    if (info && Date.now() - info.mtimeMs > MAX_ORPHAN_AGE_MS) {
      await unlink(file);
      removed += 1;
    }
  }
  return removed;
}

try {
  const migrated = await migrateLegacyDocuments();
  const removed = await cleanupOrphans();
  console.log(`${new Date().toISOString()} migrated=${migrated} orphaned_removed=${removed}`);
} finally {
  await prisma.$disconnect();
}
