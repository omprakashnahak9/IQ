const express = require('express');
const multer = require('multer');
const verificationController = require('../controllers/verificationController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/verify', upload.single('image'), verificationController.verifyFace);
router.post('/mark-attendance', verificationController.markAttendance);

module.exports = router;
