const irrigationMethods = ['drip', 'sprinkler', 'flood'];

export function prepareScheduleInput(input, now = new Date()) {
  const fieldId = Number(input.fieldId);
  const durationMinutes = Number(input.durationMinutes ?? 20);
  const scheduledFor = new Date(input.scheduledFor);
  const method = String(input.method || 'drip').toLowerCase();

  if (!Number.isInteger(fieldId) || fieldId < 1) {
    throw new Error('Choose a valid field.');
  }

  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= now) {
    throw new Error('Choose a date and time in the future.');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 240) {
    throw new Error('Duration must be between 1 and 240 minutes.');
  }

  if (!irrigationMethods.includes(method)) {
    throw new Error('Choose drip, sprinkler or flood irrigation.');
  }

  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';

  return {
    fieldId,
    scheduledFor,
    durationMinutes,
    method,
    notes: notes || null
  };
}

export function prepareScheduleStatus(status) {
  if (!['completed', 'cancelled'].includes(status)) {
    throw new Error('Status must be completed or cancelled.');
  }
  return status;
}
