import { Router } from 'express';
import {
  createSchedule,
  getSchedules,
  updateScheduleStatus
} from '../controllers/scheduleController.js';

const router = Router();

router.get('/irrigation/schedules', getSchedules);
router.post('/irrigation/schedules', createSchedule);
router.patch('/irrigation/schedules/:id', updateScheduleStatus);

export default router;
