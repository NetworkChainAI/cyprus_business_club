/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `LibertyUsers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LibertyUsers" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LibertyUsers_referralCode_key" ON "LibertyUsers"("referralCode");

-- AddForeignKey
ALTER TABLE "LibertyUsers" ADD CONSTRAINT "LibertyUsers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "LibertyUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
