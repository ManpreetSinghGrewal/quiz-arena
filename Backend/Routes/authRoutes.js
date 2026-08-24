import express from 'express';
import {
  register,
  login,
  saveQuizResult,
  updateName,
  changePassword,
  getLeaderboard,
  getProfile,
  updateProfile,
  getQuizQuestions,
  getQuizHistory,
  requestPasswordReset,
  resetPasswordWithCode,
  getMistakesQuestions,
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireDb from "../middlewares/requireDb.js";


const router = express.Router();

router.post('/register', requireDb, register);
router.post('/login', requireDb, login);
router.get('/quiz-questions', getQuizQuestions);
router.post("/forgot-password", requireDb, requestPasswordReset);
router.post("/reset-password", requireDb, resetPasswordWithCode);

router.get('/profile', requireDb, authMiddleware, getProfile);
router.post('/quiz-result', requireDb, authMiddleware, saveQuizResult);
router.get('/quiz-history', requireDb, authMiddleware, getQuizHistory);
router.get('/quiz-mistakes', requireDb, authMiddleware, getMistakesQuestions);
router.put('/update-name', requireDb, authMiddleware, updateName);
router.put('/change-password', requireDb, authMiddleware, changePassword);
router.put('/update-profile', requireDb, authMiddleware, updateProfile);

router.get('/leaderboard', requireDb, getLeaderboard);

export default router;
