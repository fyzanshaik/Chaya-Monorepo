-- CreateTable
CREATE TABLE "processing" (
    "id" SERIAL NOT NULL,
    "procurementId" INTEGER NOT NULL,
    "lotNo" INTEGER NOT NULL,
    "batchNo" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "procuredForm" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "speciality" TEXT NOT NULL,
    "processMethod" TEXT NOT NULL,
    "dateOfProcessing" TIMESTAMP(3) NOT NULL,
    "dateOfCompletion" TIMESTAMP(3),
    "quantityAfterProcess" DOUBLE PRECISION,
    "doneBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drying" (
    "id" SERIAL NOT NULL,
    "processingId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pH" DOUBLE PRECISION NOT NULL,
    "moistureQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drying_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processing_batchNo_key" ON "processing"("batchNo");

-- AddForeignKey
ALTER TABLE "processing" ADD CONSTRAINT "processing_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drying" ADD CONSTRAINT "drying_processingId_fkey" FOREIGN KEY ("processingId") REFERENCES "processing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
