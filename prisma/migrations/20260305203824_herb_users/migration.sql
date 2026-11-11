-- CreateTable
CREATE TABLE "HerbUsers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HerbUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HerbUsers_email_key" ON "HerbUsers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HerbUsers_googleId_key" ON "HerbUsers"("googleId");
