ALTER TABLE "User"
  ADD COLUMN "staffAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "staffPermissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "staffTitle" TEXT,
  ADD COLUMN "staffAccessUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "staffAccessUpdatedBy" TEXT;

CREATE INDEX "User_role_staffAccessEnabled_idx"
ON "User" ("role", "staffAccessEnabled");
