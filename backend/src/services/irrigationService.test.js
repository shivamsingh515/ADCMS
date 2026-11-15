import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateWaterLitres, getIrrigationRecommendation } from './irrigationService.js';

test('recommends irrigation when moisture is below the crop minimum', () => {
  assert.equal(getIrrigationRecommendation(20, 35).status, 'irrigation_needed');
});

test('waits for expected rain when moisture is close to target', () => {
  assert.equal(getIrrigationRecommendation(30, 35, true).status, 'wait_for_rain');
});

test('does not recommend irrigation when the soil is already moist', () => {
  assert.equal(getIrrigationRecommendation(70, 35).status, 'soil_moist');
});

test('returns within range for a normal moisture value', () => {
  assert.equal(getIrrigationRecommendation(45, 35).status, 'within_range');
});

test('rejects invalid moisture', () => {
  assert.throws(() => getIrrigationRecommendation(120, 35), /between 0 and 100/);
});

test('calculates the simulated water estimate', () => {
  assert.equal(estimateWaterLitres(2.4), 420);
});

test('rejects zero or negative field area', () => {
  assert.throws(() => estimateWaterLitres(0), /greater than zero/);
});
