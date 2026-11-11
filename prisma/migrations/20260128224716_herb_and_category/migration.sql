-- CreateTable
CREATE TABLE "Herb" (
    "id" SERIAL NOT NULL,
    "nameLa" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "image" TEXT,

    CONSTRAINT "Herb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapeuticProperty" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,

    CONSTRAINT "TherapeuticProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodySystem" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,

    CONSTRAINT "BodySystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Constituent" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,

    CONSTRAINT "Constituent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contraindication" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,

    CONSTRAINT "Contraindication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HerbToTherapeuticProperty" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_HerbToTherapeuticProperty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_HerbToSymptom" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_HerbToSymptom_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BodySystemToHerb" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BodySystemToHerb_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ConstituentToHerb" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ConstituentToHerb_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContraindicationToHerb" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ContraindicationToHerb_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Herb_nameLa_key" ON "Herb"("nameLa");

-- CreateIndex
CREATE UNIQUE INDEX "TherapeuticProperty_slug_key" ON "TherapeuticProperty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BodySystem_slug_key" ON "BodySystem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Symptom_slug_key" ON "Symptom"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Constituent_slug_key" ON "Constituent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Contraindication_slug_key" ON "Contraindication"("slug");

-- CreateIndex
CREATE INDEX "_HerbToTherapeuticProperty_B_index" ON "_HerbToTherapeuticProperty"("B");

-- CreateIndex
CREATE INDEX "_HerbToSymptom_B_index" ON "_HerbToSymptom"("B");

-- CreateIndex
CREATE INDEX "_BodySystemToHerb_B_index" ON "_BodySystemToHerb"("B");

-- CreateIndex
CREATE INDEX "_ConstituentToHerb_B_index" ON "_ConstituentToHerb"("B");

-- CreateIndex
CREATE INDEX "_ContraindicationToHerb_B_index" ON "_ContraindicationToHerb"("B");

-- AddForeignKey
ALTER TABLE "_HerbToTherapeuticProperty" ADD CONSTRAINT "_HerbToTherapeuticProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HerbToTherapeuticProperty" ADD CONSTRAINT "_HerbToTherapeuticProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "TherapeuticProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HerbToSymptom" ADD CONSTRAINT "_HerbToSymptom_A_fkey" FOREIGN KEY ("A") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HerbToSymptom" ADD CONSTRAINT "_HerbToSymptom_B_fkey" FOREIGN KEY ("B") REFERENCES "Symptom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BodySystemToHerb" ADD CONSTRAINT "_BodySystemToHerb_A_fkey" FOREIGN KEY ("A") REFERENCES "BodySystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BodySystemToHerb" ADD CONSTRAINT "_BodySystemToHerb_B_fkey" FOREIGN KEY ("B") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConstituentToHerb" ADD CONSTRAINT "_ConstituentToHerb_A_fkey" FOREIGN KEY ("A") REFERENCES "Constituent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConstituentToHerb" ADD CONSTRAINT "_ConstituentToHerb_B_fkey" FOREIGN KEY ("B") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContraindicationToHerb" ADD CONSTRAINT "_ContraindicationToHerb_A_fkey" FOREIGN KEY ("A") REFERENCES "Contraindication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContraindicationToHerb" ADD CONSTRAINT "_ContraindicationToHerb_B_fkey" FOREIGN KEY ("B") REFERENCES "Herb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
