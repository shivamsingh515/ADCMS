import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import irrigationRoutes from './routes/irrigationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', application: 'AgroSmart API' });
});

app.use('/api/auth', authRoutes);
app.use('/api', fieldRoutes);
app.use('/api', irrigationRoutes);
app.use('/api', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
