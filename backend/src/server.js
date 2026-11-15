import 'dotenv/config';
import app from './app.js';
import { prisma } from './db.js';

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`AgroSmart API is running at http://localhost:${port}`);
});

async function shutDown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
