const express = require('express');
const { getCandles } = require('../controllers/chartController');

const router = express.Router();

router.get('/candles', getCandles);

module.exports = router;
