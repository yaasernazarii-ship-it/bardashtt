-- Hash every existing session token in place. The browser keeps the raw token,
-- while only its SHA-256 digest remains searchable in the database.
ALTER TABLE "Session" RENAME COLUMN "token" TO "tokenHash";
UPDATE "Session"
SET "tokenHash" = encode(sha256(convert_to("tokenHash", 'UTF8')), 'hex');

ALTER TABLE "Session"
  ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "ipAddress" TEXT;

-- There is currently one admin. Mark the oldest active admin as the immutable
-- primary manager and enforce that at most one such account can exist.
ALTER TABLE "User" ADD COLUMN "isPrimaryAdmin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User"
SET "isPrimaryAdmin" = true
WHERE "id" = (
  SELECT "id" FROM "User"
  WHERE "role" = 'admin' AND "active" = true AND "deletedAt" IS NULL
  ORDER BY "createdAt" ASC
  LIMIT 1
);
CREATE UNIQUE INDEX "User_single_primary_admin"
ON "User" ("isPrimaryAdmin")
WHERE "isPrimaryAdmin" = true;

ALTER TABLE "SocialSession" RENAME COLUMN "token" TO "tokenHash";
UPDATE "SocialSession"
SET "tokenHash" = encode(sha256(convert_to("tokenHash", 'UTF8')), 'hex');
