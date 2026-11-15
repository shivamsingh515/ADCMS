import { Router } from 'express';
import { getWaterUsage } from '../controllers/analyticsController.js';

const router = Router();
router.get('/analytics/water-usage', getWaterUsage);
export default router;
