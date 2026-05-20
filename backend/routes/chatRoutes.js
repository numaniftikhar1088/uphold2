const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { getConversation, getConversations } = require('../controllers/chatController');

const router = express.Router();

router.get('/conversation', protect, getConversation);
router.get('/conversation/:userId', protect, getConversation);
router.get('/conversations', protect, admin, getConversations);

module.exports = router;
