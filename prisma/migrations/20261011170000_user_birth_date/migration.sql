ALTER TABLE "User" ADD COLUMN "birthDate" TEXT;

UPDATE "User" AS u
SET "birthDate" = s."birthDate"
FROM "SignupRequest" AS s
WHERE s."userId" = u.id
  AND s.role = 'student'
  AND s."birthDate" IS NOT NULL
  AND u."birthDate" IS NULL;
