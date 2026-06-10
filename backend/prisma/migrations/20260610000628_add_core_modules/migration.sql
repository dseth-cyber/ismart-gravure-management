-- CreateEnum
CREATE TYPE "CylinderStatus" AS ENUM ('available', 'inProduction', 'reserved', 'repair', 'inspection', 'hold');

-- CreateEnum
CREATE TYPE "InkFormulaStatus" AS ENUM ('active', 'superseded');

-- CreateEnum
CREATE TYPE "InkBatchStatus" AS ENUM ('active', 'nearExpiry', 'expired');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cylinders" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "status" "CylinderStatus" NOT NULL DEFAULT 'available',
    "location" TEXT NOT NULL,
    "meter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'Dedicated',
    "size" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cylinders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ink_formulas" (
    "code" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "pantone" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'Rev.01',
    "status" "InkFormulaStatus" NOT NULL DEFAULT 'active',
    "viscosity" TEXT NOT NULL,
    "labTarget" TEXT NOT NULL,
    "solvent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ink_formulas_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ink_batches" (
    "id" TEXT NOT NULL,
    "formulaCode" TEXT,
    "productCode" TEXT,
    "color" TEXT NOT NULL,
    "mixDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "remaining" DOUBLE PRECISION NOT NULL,
    "operator" TEXT NOT NULL,
    "status" "InkBatchStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ink_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
