const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createDepositRequest,
  createWithdrawRequest,
  getMyDepositRequests,
  getMyWithdrawRequests,
  getAllDeposits,
  getDepositById,
  getAllWithdraws,
  approveDepositRequest,
  rejectDepositRequest,
  approveWithdrawRequest,
  rejectWithdrawRequest,
} = require('../controllers/requestController');

const router = express.Router();

router.post('/deposits', protect, createDepositRequest);
router.post('/withdraws', protect, createWithdrawRequest);
router.get('/deposits/me', protect, getMyDepositRequests);
router.get('/withdraws/me', protect, getMyWithdrawRequests);
router.get('/deposits', protect, admin, getAllDeposits);
router.get('/deposits/:id', protect, admin, getDepositById);
router.get('/withdraws', protect, admin, getAllWithdraws);
router.put('/deposits/:id/approve', protect, admin, approveDepositRequest);
router.put('/deposits/:id/reject', protect, admin, rejectDepositRequest);
router.put('/withdraws/:id/approve', protect, admin, approveWithdrawRequest);
router.put('/withdraws/:id/reject', protect, admin, rejectWithdrawRequest);

module.exports = router;
