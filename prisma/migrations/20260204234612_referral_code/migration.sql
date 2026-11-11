/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `FlyUsers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referralCode` to the `FlyUsers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlyUsers" ADD COLUMN     "referralCode" TEXT NOT NULL,
ADD COLUMN     "referredById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FlyUsers_referralCode_key" ON "FlyUsers"("referralCode");

-- AddForeignKey
ALTER TABLE "FlyUsers" ADD CONSTRAINT "FlyUsers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "FlyUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
