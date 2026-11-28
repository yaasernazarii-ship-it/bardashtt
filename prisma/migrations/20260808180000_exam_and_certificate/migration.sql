-- جنسیت کاربر (مبنای «آقای/خانم» روی گواهی)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;

-- بانک سوالات آزمون فارغ‌التحصیلی
CREATE TABLE IF NOT EXISTS "ExamQuestion" (
  "id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correct" INTEGER NOT NULL,
  "topic" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ExamQuestion_active_idx" ON "ExamQuestion"("active");
CREATE INDEX IF NOT EXISTS "ExamQuestion_topic_idx" ON "ExamQuestion"("topic");

-- یک بار شرکت هنرجو در آزمون
CREATE TABLE IF NOT EXISTS "ExamAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questionIds" JSONB NOT NULL,
  "answers" JSONB NOT NULL DEFAULT '{}',
  "total" INTEGER NOT NULL,
  "score" INTEGER,
  "percent" INTEGER,
  "passed" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ExamAttempt_userId_startedAt_idx" ON "ExamAttempt"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "ExamAttempt_submittedAt_idx" ON "ExamAttempt"("submittedAt");

-- گواهی‌نامهٔ پایان دوره
CREATE TABLE IF NOT EXISTS "Certificate" (
  "id" TEXT NOT NULL,
  "serial" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "attemptId" TEXT,
  "fullName" TEXT NOT NULL,
  "gender" TEXT,
  "nationalId" TEXT,
  "courseTitle" TEXT,
  "branch" TEXT,
  "percent" INTEGER,
  "revoked" BOOLEAN NOT NULL DEFAULT false,
  "issuedById" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_serial_key" ON "Certificate"("serial");
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_attemptId_key" ON "Certificate"("attemptId");
CREATE INDEX IF NOT EXISTS "Certificate_userId_idx" ON "Certificate"("userId");

ALTER TABLE "ExamAttempt" DROP CONSTRAINT IF EXISTS "ExamAttempt_userId_fkey";
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_userId_fkey";
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_attemptId_fkey";
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
