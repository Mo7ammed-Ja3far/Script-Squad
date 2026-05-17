const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.use(protect);

router.post('/complete', authorize('doctor'), validate(schemas.completeConsultation), consultationController.complete);
router.get('/emr/:patientId', authorize('doctor', 'admin', 'patient'), consultationController.getEMR);
router.patch('/emr/:patientId', authorize('doctor', 'admin'), validate(schemas.updateEMR), consultationController.updateEMR);

module.exports = router;
