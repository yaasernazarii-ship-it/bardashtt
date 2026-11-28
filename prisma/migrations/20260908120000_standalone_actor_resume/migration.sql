-- رزومهٔ بازیگری از حساب کاربری جدا می‌شود و چند عکس/چند ویدیو و فیلدهای دلخواه می‌گیرد.
-- داده‌های موجود حفظ می‌شوند: عکس و ویدیوی فعلی به جدول‌های تازه منتقل می‌شوند.

-- ۱) عکس‌های رزومه
CREATE TABLE "ResumePhoto" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumePhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResumePhoto_resumeId_sortOrder_idx" ON "ResumePhoto"("resumeId", "sortOrder");

ALTER TABLE "ResumePhoto" ADD CONSTRAINT "ResumePhoto_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "ActorResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ۲) ویدیوهای رزومه
CREATE TABLE "ResumeVideo" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResumeVideo_resumeId_sortOrder_idx" ON "ResumeVideo"("resumeId", "sortOrder");

ALTER TABLE "ResumeVideo" ADD CONSTRAINT "ResumeVideo_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "ActorResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ۳) تعریف فیلدهای دلخواهی که مدیر از پنل می‌سازد
CREATE TABLE "ResumeFieldDef" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" TEXT,
    "hint" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeFieldDef_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResumeFieldDef_key_key" ON "ResumeFieldDef"("key");
CREATE INDEX "ResumeFieldDef_active_sortOrder_idx" ON "ResumeFieldDef"("active", "sortOrder");

-- ۴) ستون‌های تازهٔ رزومه
ALTER TABLE "ActorResume" ADD COLUMN "firstName" TEXT;
ALTER TABLE "ActorResume" ADD COLUMN "lastName" TEXT;
ALTER TABLE "ActorResume" ADD COLUMN "age" INTEGER;
ALTER TABLE "ActorResume" ADD COLUMN "weightKg" INTEGER;
ALTER TABLE "ActorResume" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "ActorResume" ADD COLUMN "customValues" JSONB;

-- نام کامل به نام و نام خانوادگی شکسته می‌شود؛ اولین واژه نام، بقیه نام خانوادگی.
UPDATE "ActorResume"
SET "firstName" = COALESCE(NULLIF(split_part(trim("fullName"), ' ', 1), ''), trim("fullName")),
    "lastName" = COALESCE(NULLIF(trim(substr(trim("fullName"), length(split_part(trim("fullName"), ' ', 1)) + 1)), ''), '—');

ALTER TABLE "ActorResume" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "ActorResume" ALTER COLUMN "lastName" SET NOT NULL;

-- ۵) انتقال عکس و ویدیوی فعلی به جدول‌های تازه
INSERT INTO "ResumePhoto" ("id", "resumeId", "url", "sortOrder")
SELECT md5(random()::text || "id"), "id", "photoUrl", 0
FROM "ActorResume"
WHERE "photoUrl" IS NOT NULL AND "photoUrl" <> '';

INSERT INTO "ResumeVideo" ("id", "resumeId", "url", "title", "sortOrder")
SELECT md5(random()::text || "id"), "id", "selfVideoUrl", 'ویدیوی معرفی', 0
FROM "ActorResume"
WHERE "selfVideoUrl" IS NOT NULL AND "selfVideoUrl" <> '';

-- ۶) قطع کامل رابطه با حساب کاربری و حذف ستون‌های جایگزین‌شده
ALTER TABLE "ActorResume" DROP CONSTRAINT IF EXISTS "ActorResume_userId_fkey";
DROP INDEX IF EXISTS "ActorResume_userId_key";
ALTER TABLE "ActorResume" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "ActorResume" DROP COLUMN IF EXISTS "photoUrl";
ALTER TABLE "ActorResume" DROP COLUMN IF EXISTS "selfVideoUrl";

CREATE INDEX "ActorResume_fullName_idx" ON "ActorResume"("fullName");
