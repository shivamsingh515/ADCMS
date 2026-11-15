export const initialFields = [
  { id: 1, name: 'North Farm', crop: 'Tomato', area: 2.4, soil: 'Loamy', moisture: 24, threshold: 35, status: 'Needs water', updated: 'Today, 9:10 AM' },
  { id: 2, name: 'Green Valley', crop: 'Wheat', area: 4.1, soil: 'Silty', moisture: 48, threshold: 30, status: 'Looking good', updated: 'Today, 8:40 AM' },
  { id: 3, name: 'River Side', crop: 'Rice', area: 1.8, soil: 'Clay', moisture: 67, threshold: 45, status: 'Moist', updated: 'Yesterday, 6:20 PM' },
  { id: 4, name: 'Orchard East', crop: 'Maize', area: 3.2, soil: 'Sandy loam', moisture: 31, threshold: 38, status: 'Monitor', updated: 'Today, 7:55 AM' }
];

export const initialLogs = [
  { id: 1, field: 'North Farm', date: 'Today, 8:00 AM', duration: 25, water: 420, method: 'Drip' },
  { id: 2, field: 'Green Valley', date: 'Yesterday, 6:30 AM', duration: 35, water: 650, method: 'Sprinkler' },
  { id: 3, field: 'River Side', date: 'Nov 13, 7:15 AM', duration: 20, water: 380, method: 'Drip' }
];

export const crops = [
  { name: 'Tomato', min: 35, max: 60, icon: '🍅' },
  { name: 'Wheat', min: 30, max: 55, icon: '🌾' },
  { name: 'Rice', min: 45, max: 75, icon: '🌱' },
  { name: 'Maize', min: 38, max: 62, icon: '🌽' },
  { name: 'Potato', min: 40, max: 65, icon: '🥔' }
];
