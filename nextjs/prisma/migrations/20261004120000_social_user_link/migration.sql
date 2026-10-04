ALTER TABLE "SocialAccount" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "SocialAccount_userId_key" ON "SocialAccount"("userId");
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
