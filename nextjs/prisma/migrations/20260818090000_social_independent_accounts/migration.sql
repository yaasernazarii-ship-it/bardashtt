-- برداشتگرام: جدا کردن کامل شبکهٔ اجتماعی از حساب‌های آموزشی سایت + حذف گردش‌کار تأیید مدیر.
-- داده‌های فعلی این جدول‌ها صرفاً تستی هستند (۱ پست، صفر لایک/کامنت/گزارش)، بنابراین به‌جای
-- ALTER پیچیده برای جابه‌جایی FK از User به SocialAccount، جدول‌ها بازسازی می‌شوند.

-- DropForeignKey
ALTER TABLE "SocialPost" DROP CONSTRAINT "SocialPost_authorId_fkey";
ALTER TABLE "SocialLike" DROP CONSTRAINT "SocialLike_postId_fkey";
ALTER TABLE "SocialLike" DROP CONSTRAINT "SocialLike_userId_fkey";
ALTER TABLE "SocialComment" DROP CONSTRAINT "SocialComment_postId_fkey";
ALTER TABLE "SocialComment" DROP CONSTRAINT "SocialComment_authorId_fkey";
ALTER TABLE "SocialReport" DROP CONSTRAINT "SocialReport_postId_fkey";
ALTER TABLE "SocialReport" DROP CONSTRAINT "SocialReport_commentId_fkey";
ALTER TABLE "SocialReport" DROP CONSTRAINT "SocialReport_reporterId_fkey";

-- DropTable
DROP TABLE "SocialReport";
DROP TABLE "SocialComment";
DROP TABLE "SocialLike";
DROP TABLE "SocialPost";

-- حذف کلیدهای گردش‌کار قدیمیِ تأیید مدیر روی حساب آموزشی؛ دیگر معنا ندارند.
ALTER TABLE "User" DROP COLUMN "socialTrusted";
ALTER TABLE "User" DROP COLUMN "socialBlocked";

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialOtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialOtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'post',
    "imageUrl" TEXT,
    "aparatUrl" TEXT,
    "caption" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reporterId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_phone_key" ON "SocialAccount"("phone");
CREATE UNIQUE INDEX "SocialAccount_username_key" ON "SocialAccount"("username");
CREATE UNIQUE INDEX "SocialSession_token_key" ON "SocialSession"("token");
CREATE INDEX "SocialSession_accountId_idx" ON "SocialSession"("accountId");
CREATE INDEX "SocialOtpCode_phone_purpose_createdAt_idx" ON "SocialOtpCode"("phone", "purpose", "createdAt");
CREATE INDEX "SocialPost_kind_publishedAt_idx" ON "SocialPost"("kind", "publishedAt");
CREATE INDEX "SocialPost_authorId_createdAt_idx" ON "SocialPost"("authorId", "createdAt");
CREATE INDEX "SocialPost_expiresAt_idx" ON "SocialPost"("expiresAt");
CREATE UNIQUE INDEX "SocialLike_postId_userId_key" ON "SocialLike"("postId", "userId");
CREATE INDEX "SocialLike_userId_idx" ON "SocialLike"("userId");
CREATE INDEX "SocialComment_postId_createdAt_idx" ON "SocialComment"("postId", "createdAt");
CREATE INDEX "SocialComment_authorId_idx" ON "SocialComment"("authorId");
CREATE INDEX "SocialReport_status_createdAt_idx" ON "SocialReport"("status", "createdAt");
CREATE INDEX "SocialReport_postId_idx" ON "SocialReport"("postId");

-- AddForeignKey
ALTER TABLE "SocialSession" ADD CONSTRAINT "SocialSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialLike" ADD CONSTRAINT "SocialLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialLike" ADD CONSTRAINT "SocialLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SocialComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
