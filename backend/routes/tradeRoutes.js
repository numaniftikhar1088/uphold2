const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createTradeOrder,
  getMyTrades,
  getAllTradesAdmin,
  getPendingTradesAdmin,
  adminSetTradeResult,
  cancelTrade,
} = require('../controllers/tradeController');

const router = express.Router();

router.post('/',               protect,        createTradeOrder);
router.get('/me',              protect,        getMyTrades);
router.get('/admin',           protect, admin, getAllTradesAdmin);
router.get('/admin/pending',   protect, admin, getPendingTradesAdmin);
router.put('/:id/result',      protect, admin, adminSetTradeResult);
router.delete('/:id/cancel',   protect,        cancelTrade);

module.exports = router;
