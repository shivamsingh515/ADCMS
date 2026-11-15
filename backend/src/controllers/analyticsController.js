import { prisma } from '../db.js';

export async function getWaterUsage(req, res, next) {
  try {
    const totals = await prisma.irrigationLog.groupBy({
      by: ['fieldId'],
      _sum: { waterUsedLitres: true },
      _count: { _all: true }
    });

    const fields = await prisma.field.findMany({
      where: { id: { in: totals.map((item) => item.fieldId) } },
      select: { id: true, name: true }
    });
    const names = new Map(fields.map((field) => [field.id, field.name]));

    const result = totals.map((item) => ({
      fieldId: item.fieldId,
      fieldName: names.get(item.fieldId) || 'Unknown field',
      totalLitres: item._sum.waterUsedLitres || 0,
      irrigationCount: item._count._all
    }));
    res.json(result);
  } catch (error) { next(error); }
}
