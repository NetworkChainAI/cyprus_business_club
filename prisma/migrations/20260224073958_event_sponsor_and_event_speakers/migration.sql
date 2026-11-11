-- CreateTable
CREATE TABLE "EventSponsor" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT,
    "logoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventSponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSpeaker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "photoUrl" TEXT,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventSpeaker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSponsor_eventId_idx" ON "EventSponsor"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSponsor_eventId_brandId_key" ON "EventSponsor"("eventId", "brandId");

-- CreateIndex
CREATE INDEX "EventSpeaker_eventId_idx" ON "EventSpeaker"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSpeaker_eventId_userId_key" ON "EventSpeaker"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventSponsor" ADD CONSTRAINT "EventSponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSponsor" ADD CONSTRAINT "EventSponsor_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CbcUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
