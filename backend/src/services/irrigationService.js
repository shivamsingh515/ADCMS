export function getIrrigationRecommendation(moisture, minMoisture, rainExpected = false) {
  if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
    throw new Error('Moisture must be a number between 0 and 100.');
  }
  if (!Number.isFinite(minMoisture) || minMoisture < 0 || minMoisture > 100) {
    throw new Error('Minimum moisture must be a number between 0 and 100.');
  }

  if (rainExpected && moisture >= minMoisture - 10) {
    return {
      status: 'wait_for_rain',
      message: 'Rain is expected soon. Recheck the soil before irrigating.'
    };
  }
  if (moisture < minMoisture) {
    return {
      status: 'irrigation_needed',
      message: 'Soil moisture is below this crop’s configured minimum.'
    };
  }
  if (moisture > minMoisture + 25) {
    return {
      status: 'soil_moist',
      message: 'No irrigation is needed right now. Continue monitoring.'
    };
  }
  return {
    status: 'within_range',
    message: 'Moisture is within the configured range.'
  };
}

export function estimateWaterLitres(areaInAcres) {
  if (!Number.isFinite(areaInAcres) || areaInAcres <= 0) {
    throw new Error('Field area must be greater than zero.');
  }
  // Demonstration estimate only: 175 litres per acre per simulated run.
  return Math.round(areaInAcres * 175);
}
