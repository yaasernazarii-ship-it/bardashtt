-- AlterTable
ALTER TABLE "Post" ADD COLUMN "section" TEXT NOT NULL DEFAULT 'news';
ALTER TABLE "Post" ADD COLUMN "publishAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Post_section_published_publishAt_idx" ON "Post"("section", "published", "publishAt");
