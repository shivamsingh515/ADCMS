import { prisma } from '../db.js';
import { estimateWaterLitres } from '../services/irrigationService.js';

export async function createIrrigation(req, res, next) {
  try {
    const { fieldId, durationMinutes = 20, method = 'drip' } = req.body;
    if (!Number.isInteger(Number(fieldId)) || !Number.isInteger(Number(durationMinutes)) || Number(durationMinutes) < 1 || Number(durationMinutes) > 240) {
      return res.status(400).json({ message: 'A valid field ID and duration from 1 to 240 minutes are required.' });
    }

    const field = await prisma.field.findUnique({
      where: { id: Number(fieldId) },
      include: { crop: true, soilReadings: { orderBy: { recordedAt: 'desc' }, take: 1 } }
    });
    if (!field) return res.status(404).json({ message: 'Field not found.' });

    const litres = estimateWaterLitres(field.area);
    const latestMoisture = field.soilReadings[0]?.moisture ?? 0;
    const updatedMoisture = Math.min(100, latestMoisture + 18);

    const [log, reading] = await prisma.$transaction([
      prisma.irrigationLog.create({
        data: {
          fieldId: field.id, waterUsedLitres: litres,
          durationMinutes: Number(durationMinutes), method: String(method).toLowerCase()
        }
      }),
      prisma.soilReading.create({
        data: { fieldId: field.id, moisture: updatedMoisture, source: 'simulation' }
      })
    ]);

    res.status(201).json({
      message: 'Simulated irrigation recorded. No physical pump was activated.',
      log,
      reading
    });
  } catch (error) { next(error); }
}

export async function getIrrigationHistory(req, res, next) {
  try {
    const logs = await prisma.irrigationLog.findMany({
      include: { field: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) { next(error); }
}
