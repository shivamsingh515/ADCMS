import { Router } from 'express';
import {
  createField, createSoilReading, getCrops, getFields,
  getRecommendations, getSoilReadings
} from '../controllers/fieldController.js';

const router = Router();
router.get('/crops', getCrops);
router.get('/fields', getFields);
router.post('/fields', createField);
router.post('/soil-readings', createSoilReading);
router.get('/soil-readings/:fieldId', getSoilReadings);
router.get('/recommendations/:fieldId', getRecommendations);
export default router;
