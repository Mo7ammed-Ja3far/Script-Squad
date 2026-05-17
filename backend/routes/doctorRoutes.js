const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.get('/', doctorController.listDoctors);
router.get('/:id', doctorController.getDoctor);

router.use(protect);
router.get('/me/stats', authorize('doctor'), doctorController.getMyStats);
router.patch('/me/schedule', authorize('doctor'), validate(schemas.updateSchedule), doctorController.updateSchedule);

module.exports = router;
