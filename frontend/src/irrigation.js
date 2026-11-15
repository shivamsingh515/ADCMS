export function getIrrigationRecommendation(moisture, minMoisture, rainExpected = false) {
  if (![moisture, minMoisture].every(Number.isFinite) || moisture < 0 || moisture > 100) {
    throw new Error('Moisture must be between 0 and 100.');
  }
  if (rainExpected && moisture >= minMoisture - 10) {
    return { status: 'Wait for rain', level: 'info', message: 'Rain is expected soon. Recheck the soil before irrigating.' };
  }
  if (moisture < minMoisture) {
    return { status: 'Irrigation needed', level: 'warning', message: 'Soil moisture is below this crop’s sample minimum.' };
  }
  if (moisture > minMoisture + 25) {
    return { status: 'Soil is moist', level: 'success', message: 'No irrigation needed right now. Keep monitoring.' };
  }
  return { status: 'Within range', level: 'success', message: 'Moisture is within the configured range.' };
}
