ALTER TABLE "ResumePhoto" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'approved';
CREATE INDEX "ResumePhoto_resumeId_approvalStatus_idx" ON "ResumePhoto"("resumeId", "approvalStatus");
CREATE INDEX "ResumePhoto_url_idx" ON "ResumePhoto"("url");
