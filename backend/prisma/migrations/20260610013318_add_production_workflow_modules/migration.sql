-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'verifying', 'active', 'completed', 'hold', 'cancelled');

-- CreateEnum
CREATE TYPE "QcStatus" AS ENUM ('pass', 'fail', 'hold');

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_jobs" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "machineName" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "totalPrinted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_verifications" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "scannedCylinders" TEXT NOT NULL,
    "scannedInkBatches" TEXT NOT NULL,
    "requiresOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "machineName" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "startMeter" DOUBLE PRECISION NOT NULL,
    "endMeter" DOUBLE PRECISION NOT NULL,
    "totalPrinted" DOUBLE PRECISION NOT NULL,
    "scrapQuantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspections" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "shadeResult" TEXT NOT NULL,
    "barcodePassed" BOOLEAN NOT NULL,
    "colorSequencePassed" BOOLEAN NOT NULL,
    "adhesionPassed" BOOLEAN NOT NULL,
    "status" "QcStatus" NOT NULL DEFAULT 'pass',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_orderNumber_key" ON "sales_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "production_jobs_jobNumber_key" ON "production_jobs"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "job_verifications_jobNumber_key" ON "job_verifications"("jobNumber");
