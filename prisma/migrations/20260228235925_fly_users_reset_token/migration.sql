/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `FlyUsers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FlyUsers" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "FlyUsers_resetToken_key" ON "FlyUsers"("resetToken");
