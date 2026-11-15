import { describe, expect, it } from 'vitest';
import { getIrrigationRecommendation } from './irrigation.js';

describe('getIrrigationRecommendation', () => {
  it('recommends irrigation below the minimum', () => {
    expect(getIrrigationRecommendation(20, 35).status).toBe('Irrigation needed');
  });
  it('waits when rain is expected and moisture is near target', () => {
    expect(getIrrigationRecommendation(30, 35, true).status).toBe('Wait for rain');
  });
  it('does not recommend watering when soil is moist', () => {
    expect(getIrrigationRecommendation(70, 35).status).toBe('Soil is moist');
  });
  it('rejects invalid moisture values', () => {
    expect(() => getIrrigationRecommendation(120, 35)).toThrow();
  });
});
