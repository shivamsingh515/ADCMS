import { prisma } from '../db.js';
import { prepareScheduleInput, prepareScheduleStatus } from '../services/scheduleService.js';

export async function getSchedules(req, res, next) {
  try {
    const schedules = await prisma.irrigationSchedule.findMany({
      include: { field: { select: { id: true, name: true } } },
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
      take: 100
    });
    res.json(schedules);
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req, res, next) {
  let data;
  try {
    data = prepareScheduleInput(req.body);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const field = await prisma.field.findUnique({ where: { id: data.fieldId } });
    if (!field) return res.status(404).json({ message: 'Field not found.' });

    const schedule = await prisma.irrigationSchedule.create({
      data,
      include: { field: { select: { id: true, name: true } } }
    });
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
}

export async function updateScheduleStatus(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Invalid schedule ID.' });
  }

  let status;
  try {
    status = prepareScheduleStatus(req.body.status);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const updated = await prisma.irrigationSchedule.updateMany({
      where: { id, status: 'pending' },
      data: { status }
    });

    if (!updated.count) {
      const existing = await prisma.irrigationSchedule.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Schedule not found.' });
      return res.status(409).json({ message: 'Only pending schedules can be changed.' });
    }

    const schedule = await prisma.irrigationSchedule.findUnique({
      where: { id },
      include: { field: { select: { id: true, name: true } } }
    });
    res.json(schedule);
  } catch (error) {
    next(error);
  }
}
