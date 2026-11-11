/*
  Warnings:

  - You are about to drop the column `categoryId` on the `LibertyEvent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LibertyEvent" DROP CONSTRAINT "LibertyEvent_categoryId_fkey";

-- DropIndex
DROP INDEX "LibertyEvent_categoryId_idx";

-- AlterTable
ALTER TABLE "LibertyEvent" DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "_LibertyEventToLibertyEventCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LibertyEventToLibertyEventCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LibertyEventToLibertyEventCategory_B_index" ON "_LibertyEventToLibertyEventCategory"("B");

-- AddForeignKey
ALTER TABLE "_LibertyEventToLibertyEventCategory" ADD CONSTRAINT "_LibertyEventToLibertyEventCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "LibertyEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibertyEventToLibertyEventCategory" ADD CONSTRAINT "_LibertyEventToLibertyEventCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "LibertyEventCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
