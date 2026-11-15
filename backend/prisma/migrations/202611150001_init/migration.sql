-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'farmer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "minMoisture" DOUBLE PRECISION NOT NULL,
    "maxMoisture" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "soilType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilReading" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "moisture" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoilReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationLog" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "waterUsedLitres" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'drip',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IrrigationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rainExpected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_name_key" ON "Crop"("name");

-- CreateIndex
CREATE INDEX "Field_userId_idx" ON "Field"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Field_userId_name_key" ON "Field"("userId", "name");

-- CreateIndex
CREATE INDEX "SoilReading_fieldId_recordedAt_idx" ON "SoilReading"("fieldId", "recordedAt");

-- CreateIndex
CREATE INDEX "IrrigationLog_fieldId_createdAt_idx" ON "IrrigationLog"("fieldId", "createdAt");

-- CreateIndex
CREATE INDEX "Recommendation_fieldId_createdAt_idx" ON "Recommendation"("fieldId", "createdAt");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilReading" ADD CONSTRAINT "SoilReading_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationLog" ADD CONSTRAINT "IrrigationLog_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data quality constraints maintained alongside the Prisma schema.
ALTER TABLE "Field" ADD CONSTRAINT "Field_area_check" CHECK ("area" > 0);
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_moisture_range_check"
  CHECK ("minMoisture" >= 0 AND "maxMoisture" <= 100 AND "minMoisture" < "maxMoisture");
ALTER TABLE "SoilReading" ADD CONSTRAINT "SoilReading_moisture_check"
  CHECK ("moisture" >= 0 AND "moisture" <= 100);
ALTER TABLE "IrrigationLog" ADD CONSTRAINT "IrrigationLog_water_check"
  CHECK ("waterUsedLitres" > 0);
ALTER TABLE "IrrigationLog" ADD CONSTRAINT "IrrigationLog_duration_check"
  CHECK ("durationMinutes" > 0);
