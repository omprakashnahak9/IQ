const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI Chat endpoint
router.post('/chat', aiController.chat);

module.exports = router;
