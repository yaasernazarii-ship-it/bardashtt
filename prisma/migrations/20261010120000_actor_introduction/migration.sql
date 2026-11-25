ALTER TABLE "ActorResume" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "ActorResume_userId_key" ON "ActorResume"("userId");
ALTER TABLE "ActorResume" ADD CONSTRAINT "ActorResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumePhoto" ADD COLUMN "pose" TEXT;
ALTER TABLE "ResumePhoto" ADD COLUMN "look" TEXT;
