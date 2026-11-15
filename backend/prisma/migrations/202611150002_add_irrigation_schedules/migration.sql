-- Store planned irrigation runs separately from completed irrigation logs.
CREATE TABLE "IrrigationSchedule" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 20,
    "method" TEXT NOT NULL DEFAULT 'drip',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IrrigationSchedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "IrrigationSchedule_duration_check"
      CHECK ("durationMinutes" >= 1 AND "durationMinutes" <= 240),
    CONSTRAINT "IrrigationSchedule_status_check"
      CHECK ("status" IN ('pending', 'completed', 'cancelled'))
);

CREATE INDEX "IrrigationSchedule_status_scheduledFor_idx"
  ON "IrrigationSchedule"("status", "scheduledFor");

CREATE INDEX "IrrigationSchedule_fieldId_scheduledFor_idx"
  ON "IrrigationSchedule"("fieldId", "scheduledFor");

ALTER TABLE "IrrigationSchedule"
  ADD CONSTRAINT "IrrigationSchedule_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "Field"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
