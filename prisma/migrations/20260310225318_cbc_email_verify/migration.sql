/*
  Warnings:

  - A unique constraint covering the columns `[emailVerifyToken]` on the table `CbcUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CbcUser" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifyToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CbcUser_emailVerifyToken_key" ON "CbcUser"("emailVerifyToken");
