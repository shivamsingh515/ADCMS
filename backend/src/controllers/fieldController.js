import { prisma } from '../db.js';
import { getIrrigationRecommendation } from '../services/irrigationService.js';

export async function getCrops(req, res, next) {
  try {
    const crops = await prisma.crop.findMany({ orderBy: { name: 'asc' } });
    res.json(crops);
  } catch (error) { next(error); }
}

export async function getFields(req, res, next) {
  try {
    const fields = await prisma.field.findMany({
      include: {
        crop: true,
        soilReadings: { orderBy: { recordedAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'asc' }
    });

    const result = fields.map((field) => {
      const latest = field.soilReadings[0];
      const moisture = latest?.moisture ?? 0;
      const recommendation = getIrrigationRecommendation(moisture, field.crop.minMoisture);
      return {
        id: field.id,
        name: field.name,
        crop: field.crop.name,
        area: field.area,
        soil: field.soilType,
        moisture,
        threshold: field.crop.minMoisture,
        status: recommendation.status,
        updated: latest?.recordedAt ?? field.createdAt
      };
    });
    res.json(result);
  } catch (error) { next(error); }
}

export async function createField(req, res, next) {
  try {
    const { name, cropId, area, soilType, userId = 1 } = req.body;
    if (!name?.trim() || !Number.isInteger(Number(cropId)) || !Number.isFinite(Number(area)) || Number(area) <= 0 || !soilType?.trim()) {
      return res.status(400).json({ message: 'Name, crop, positive area and soil type are required.' });
    }

    const crop = await prisma.crop.findUnique({ where: { id: Number(cropId) } });
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });

    const field = await prisma.field.create({
      data: {
        name: name.trim(), cropId: Number(cropId), area: Number(area),
        soilType: soilType.trim(), userId: Number(userId)
      },
      include: { crop: true }
    });
    res.status(201).json(field);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'This field name is already used by this farmer.' });
    next(error);
  }
}

export async function createSoilReading(req, res, next) {
  try {
    const { fieldId, moisture, rainExpected = false } = req.body;
    const value = Number(moisture);
    if (!Number.isInteger(Number(fieldId)) || !Number.isFinite(value) || value < 0 || value > 100) {
      return res.status(400).json({ message: 'A valid field ID and moisture value from 0 to 100 are required.' });
    }

    const field = await prisma.field.findUnique({ where: { id: Number(fieldId) }, include: { crop: true } });
    if (!field) return res.status(404).json({ message: 'Field not found.' });

    const recommendation = getIrrigationRecommendation(value, field.crop.minMoisture, Boolean(rainExpected));
    const [reading, savedRecommendation] = await prisma.$transaction([
      prisma.soilReading.create({ data: { fieldId: field.id, moisture: value, source: 'manual' } }),
      prisma.recommendation.create({
        data: { fieldId: field.id, status: recommendation.status, message: recommendation.message, rainExpected: Boolean(rainExpected) }
      })
    ]);
    res.status(201).json({ reading, recommendation: savedRecommendation });
  } catch (error) { next(error); }
}

export async function getSoilReadings(req, res, next) {
  try {
    const fieldId = Number(req.params.fieldId);
    if (!Number.isInteger(fieldId)) return res.status(400).json({ message: 'Invalid field ID.' });
    const readings = await prisma.soilReading.findMany({
      where: { fieldId }, orderBy: { recordedAt: 'desc' }, take: 50
    });
    res.json(readings);
  } catch (error) { next(error); }
}

export async function getRecommendations(req, res, next) {
  try {
    const fieldId = Number(req.params.fieldId);
    const recommendations = await prisma.recommendation.findMany({
      where: { fieldId }, orderBy: { createdAt: 'desc' }, take: 20
    });
    res.json(recommendations);
  } catch (error) { next(error); }
}
