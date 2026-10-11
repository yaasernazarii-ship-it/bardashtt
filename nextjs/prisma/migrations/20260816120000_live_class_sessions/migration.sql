-- نام نمایشیِ استاد این کلاس (برای کارت کلاس آنلاین در پنل هنرجو)
ALTER TABLE "ClassGroup" ADD COLUMN "teacherName" TEXT;

-- کلاس آنلاین زنده روی هر جلسه (ClassSession)
ALTER TABLE "ClassSession" ADD COLUMN "liveStatus" TEXT NOT NULL DEFAULT 'scheduled';
ALTER TABLE "ClassSession" ADD COLUMN "scheduledEndAt" TIMESTAMP(3);
ALTER TABLE "ClassSession" ADD COLUMN "liveStartedAt" TIMESTAMP(3);
ALTER TABLE "ClassSession" ADD COLUMN "liveFinishedAt" TIMESTAMP(3);
ALTER TABLE "ClassSession" ADD COLUMN "liveStartedById" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "liveStartedByName" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "liveFinishedById" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "liveFinishedByName" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "recordingUrl" TEXT;

-- CreateIndex
CREATE INDEX "ClassSession_liveStatus_idx" ON "ClassSession"("liveStatus");
