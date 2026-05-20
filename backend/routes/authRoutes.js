const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  checkReferralCode,
  submitKyc,
  getPendingKyc,
  getAllKyc,
  getKycDetail,
  verifyKyc,
  rejectKyc,
  forgotPassword,
  resetPassword,
  changeUserPassword,
  changeTransactionPassword,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/check-referral', checkReferralCode);
router.get('/me', protect, getCurrentUser);
router.post('/me/kyc', protect, submitKyc);
router.get('/kyc/pending', protect, admin, getPendingKyc);
router.get('/kyc/all', protect, admin, getAllKyc);
router.get('/kyc/:userId/detail', protect, admin, getKycDetail);
router.put('/kyc/:userId/verify', protect, admin, verifyKyc);
router.put('/kyc/:userId/reject', protect, admin, rejectKyc);
router.put('/me/password', protect, changeUserPassword);
router.put('/me/transaction-password', protect, changeTransactionPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
