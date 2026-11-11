-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "communityId" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
