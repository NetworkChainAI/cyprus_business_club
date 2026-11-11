-- CreateTable
CREATE TABLE "LibertyUsers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibertyUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibertyEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "agenda" TEXT,
    "categoryId" TEXT,
    "location" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "coverUrl" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibertyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibertyEventCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LibertyEventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibertyUsers_email_key" ON "LibertyUsers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LibertyUsers_googleId_key" ON "LibertyUsers"("googleId");

-- CreateIndex
CREATE INDEX "LibertyUsers_role_idx" ON "LibertyUsers"("role");

-- CreateIndex
CREATE INDEX "LibertyEvent_isActive_startAt_idx" ON "LibertyEvent"("isActive", "startAt");

-- CreateIndex
CREATE INDEX "LibertyEvent_categoryId_idx" ON "LibertyEvent"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibertyEventCategory_name_key" ON "LibertyEventCategory"("name");

-- AddForeignKey
ALTER TABLE "LibertyEvent" ADD CONSTRAINT "LibertyEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LibertyEventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
