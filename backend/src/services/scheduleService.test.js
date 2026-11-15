import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareScheduleInput, prepareScheduleStatus } from './scheduleService.js';

const now = new Date('2026-11-15T10:00:00.000Z');

test('accepts a future irrigation schedule', () => {
  const result = prepareScheduleInput({
    fieldId: '2',
    scheduledFor: '2026-11-16T06:30:00.000Z',
    durationMinutes: '30',
    method: 'Sprinkler',
    notes: 'Water the east section'
  }, now);

  assert.equal(result.fieldId, 2);
  assert.equal(result.durationMinutes, 30);
  assert.equal(result.method, 'sprinkler');
  assert.equal(result.notes, 'Water the east section');
  assert.equal(result.scheduledFor.toISOString(), '2026-11-16T06:30:00.000Z');
});

test('rejects a schedule in the past', () => {
  assert.throws(() => prepareScheduleInput({
    fieldId: 1,
    scheduledFor: '2026-11-14T06:30:00.000Z'
  }, now), /future/);
});

test('rejects invalid durations and irrigation methods', () => {
  const base = { fieldId: 1, scheduledFor: '2026-11-16T06:30:00.000Z' };
  assert.throws(() => prepareScheduleInput({ ...base, durationMinutes: 0 }, now), /between 1 and 240/);
  assert.throws(() => prepareScheduleInput({ ...base, method: 'unknown' }, now), /Choose drip/);
});

test('only completed or cancelled are valid final states', () => {
  assert.equal(prepareScheduleStatus('completed'), 'completed');
  assert.equal(prepareScheduleStatus('cancelled'), 'cancelled');
  assert.throws(() => prepareScheduleStatus('pending'), /completed or cancelled/);
});
