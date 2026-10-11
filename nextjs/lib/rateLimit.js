import { createHash } from 'crypto';
import { prisma } from './prisma';

function keyHash(key) {
  return createHash('sha256').update(String(key || ''), 'utf8').digest('hex');
}

export async function isLocked(key, { max = 5 } = {}) {
  const hash = keyHash(key);
  const record = await prisma.rateLimitBucket.findUnique({ where: { keyHash: hash } });
  if (!record) return false;
  if (record.resetAt <= new Date()) {
    await prisma.rateLimitBucket.deleteMany({ where: { keyHash: hash, resetAt: { lte: new Date() } } });
    return false;
  }
  return record.count >= max;
}

export async function recordFailure(key, { windowMs = 5 * 60 * 1000 } = {}) {
  const hash = keyHash(key);
  const resetAt = new Date(Date.now() + windowMs);
  await prisma.$executeRaw`
    INSERT INTO "RateLimitBucket" ("keyHash", "count", "resetAt", "updatedAt")
    VALUES (${hash}, 1, ${resetAt}, NOW())
    ON CONFLICT ("keyHash") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN EXCLUDED."resetAt"
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = NOW()
  `;
}

export async function clearAttempts(key) {
  await prisma.rateLimitBucket.deleteMany({ where: { keyHash: keyHash(key) } });
}
