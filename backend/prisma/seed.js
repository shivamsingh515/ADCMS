import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@agrosmart.local' },
    update: {},
    create: {
      name: 'Demo Farmer',
      email: 'demo@agrosmart.local',
      passwordHash: await bcrypt.hash('AgroSmartDemo123', 10),
      role: 'farmer'
    }
  });

  const cropData = [
    { name: 'Tomato', minMoisture: 35, maxMoisture: 60 },
    { name: 'Wheat', minMoisture: 30, maxMoisture: 55 },
    { name: 'Rice', minMoisture: 45, maxMoisture: 75 },
    { name: 'Maize', minMoisture: 38, maxMoisture: 62 },
    { name: 'Potato', minMoisture: 40, maxMoisture: 65 }
  ];

  const cropRows = {};
  for (const crop of cropData) {
    cropRows[crop.name] = await prisma.crop.upsert({
      where: { name: crop.name },
      update: crop,
      create: crop
    });
  }

  const sampleFields = [
    { name: 'North Farm', crop: 'Tomato', area: 2.4, soilType: 'Loamy', moisture: 24 },
    { name: 'Green Valley', crop: 'Wheat', area: 4.1, soilType: 'Silty', moisture: 48 },
    { name: 'River Side', crop: 'Rice', area: 1.8, soilType: 'Clay', moisture: 67 },
    { name: 'Orchard East', crop: 'Maize', area: 3.2, soilType: 'Sandy loam', moisture: 31 }
  ];

  for (const item of sampleFields) {
    const field = await prisma.field.upsert({
      where: { userId_name: { userId: demoUser.id, name: item.name } },
      update: {},
      create: {
        userId: demoUser.id, cropId: cropRows[item.crop].id,
        name: item.name, area: item.area, soilType: item.soilType
      }
    });

    const latest = await prisma.soilReading.findFirst({
      where: { fieldId: field.id },
      orderBy: { recordedAt: 'desc' }
    });
    if (!latest) {
      await prisma.soilReading.create({
        data: { fieldId: field.id, moisture: item.moisture, source: 'seed' }
      });
    }
  }

  console.log('Seeded demo farmer, 5 crops, 4 fields and initial soil readings.');
  console.log('Demo login: demo@agrosmart.local / AgroSmartDemo123');
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
