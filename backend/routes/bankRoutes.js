const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { getMyBankAccounts, addBankAccount, deleteBankAccount, getAllBankAccounts } = require('../controllers/bankController');

const router = express.Router();

router.get('/admin/all', protect, admin, getAllBankAccounts);
router.get('/',           protect, getMyBankAccounts);
router.post('/',          protect, addBankAccount);
router.delete('/:id',     protect, deleteBankAccount);

module.exports = router;
