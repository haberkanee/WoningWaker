-- Persoonlijk token voor de e-mailkoppeling
ALTER TABLE "User" ADD COLUMN "inboundToken" TEXT;
CREATE UNIQUE INDEX "User_inboundToken_key" ON "User"("inboundToken");
