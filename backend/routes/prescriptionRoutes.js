const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/patient/:patientId', authorize('doctor', 'admin', 'patient'), prescriptionController.getByPatient);
router.get('/:id', prescriptionController.getOne);

module.exports = router;
