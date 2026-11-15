import { Router } from 'express';
import { createIrrigation, getIrrigationHistory } from '../controllers/irrigationController.js';

const router = Router();
router.post('/irrigation', createIrrigation);
router.get('/irrigation/history', getIrrigationHistory);
export default router;
