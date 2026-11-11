-- CreateTable
CREATE TABLE "HerbFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "herbId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HerbFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HerbFavorite_userId_idx" ON "HerbFavorite"("userId");

-- CreateIndex
CREATE INDEX "HerbFavorite_herbId_idx" ON "HerbFavorite"("herbId");

-- CreateIndex
CREATE UNIQUE INDEX "HerbFavorite_userId_herbId_key" ON "HerbFavorite"("userId", "herbId");

-- AddForeignKey
ALTER TABLE "HerbFavorite" ADD CONSTRAINT "HerbFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "HerbUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HerbFavorite" ADD CONSTRAINT "HerbFavorite_herbId_fkey" FOREIGN KEY ("herbId") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
