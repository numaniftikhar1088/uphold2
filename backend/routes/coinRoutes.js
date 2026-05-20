const express = require('express');
const { getCoins, getAllCoins } = require('../controllers/coinController');

const router = express.Router();

router.get('/',    getCoins);
router.get('/all', getAllCoins);

module.exports = router;
