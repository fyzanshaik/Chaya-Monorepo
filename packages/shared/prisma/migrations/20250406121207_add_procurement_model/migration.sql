-- CreateTable
CREATE TABLE "procurements" (
    "id" SERIAL NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "crop" TEXT NOT NULL,
    "procuredForm" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "batchCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "lotNo" INTEGER NOT NULL,
    "procuredBy" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procurements_batchCode_key" ON "procurements"("batchCode");

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
