const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/profile/:studentId', studentController.getProfile);
router.get('/attendance/:studentId', studentController.getAttendance);

module.exports = router;
