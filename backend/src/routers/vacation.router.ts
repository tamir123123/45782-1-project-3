import express from 'express';
import {
  getAllVacations,
  getVacationById,
  createVacation,
  updateVacation,
  deleteVacation,
  followVacation,
  unfollowVacation,
  getVacationsReport,
  downloadCSV
} from '../controllers/vacation.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = express.Router();

// Public/User routes
router.get('/', authenticate, getAllVacations);
router.get('/report', authenticate, requireAdmin, getVacationsReport);
router.get('/csv', authenticate, requireAdmin, downloadCSV);
router.get('/:id', authenticate, getVacationById);
router.post('/:id/follow', authenticate, followVacation);
router.delete('/:id/follow', authenticate, unfollowVacation);

// Admin routes
router.post('/', authenticate, requireAdmin, createVacation);
router.put('/:id', authenticate, requireAdmin, updateVacation);
router.delete('/:id', authenticate, requireAdmin, deleteVacation);

export default router;
