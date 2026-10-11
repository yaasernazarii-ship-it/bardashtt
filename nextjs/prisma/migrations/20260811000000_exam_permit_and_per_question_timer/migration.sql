-- مجوز شرکت در آزمون: بدون مجوزِ صادرشده توسط مدیر/ادیتور، آزمون باز نمی‌شود.
CREATE TABLE "ExamPermit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "grantedByName" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "attemptId" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "ExamPermit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamPermit_attemptId_key" ON "ExamPermit"("attemptId");
CREATE INDEX "ExamPermit_userId_revoked_idx" ON "ExamPermit"("userId", "revoked");
CREATE INDEX "ExamPermit_grantedAt_idx" ON "ExamPermit"("grantedAt");

ALTER TABLE "ExamPermit" ADD CONSTRAINT "ExamPermit_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- آزمون تک‌سواله و بدون بازگشت: مکان‌نمای سوال جاری و مهلت مستقل هر سوال.
ALTER TABLE "ExamAttempt" ADD COLUMN "cursor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExamAttempt" ADD COLUMN "perQuestionSec" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "ExamAttempt" ADD COLUMN "questionEndsAt" TIMESTAMP(3);
