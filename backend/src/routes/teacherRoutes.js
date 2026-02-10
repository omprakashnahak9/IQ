const express = require('express');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

router.get('/profile/:teacherId', teacherController.getProfile);
router.get('/students', teacherController.getStudents);
router.get('/stats/department', teacherController.getDepartmentStats);

module.exports = router;
