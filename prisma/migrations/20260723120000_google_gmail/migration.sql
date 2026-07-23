-- Google/Gmail-koppeling
ALTER TABLE "User" ADD COLUMN "gmailRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "gmailEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "gmailConnectedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "gmailLastSyncAt" TIMESTAMP(3);
