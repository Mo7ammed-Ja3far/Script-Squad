const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.use(protect);

router.post('/', authorize('patient'), validate(schemas.bookAppointment), appointmentController.book);
router.get('/', appointmentController.list);
router.get('/:id', appointmentController.getOne);
router.patch('/:id/cancel', validate(schemas.cancelAppointment), appointmentController.cancel);
router.patch('/:id/reschedule', authorize('patient', 'admin'), validate(schemas.rescheduleAppointment), appointmentController.reschedule);
router.get('/availability/:doctorId', appointmentController.availability);

module.exports = router;
