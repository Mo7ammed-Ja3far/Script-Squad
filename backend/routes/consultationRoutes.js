const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const { protect, authorize } = require('../middlewares/auth');

// Zod Schema for the Complete & Next Patient request
const completeAndNextSchema = {
  body: z.object({
    currentPatientId: z.string().min(1),
    currentQueueId: z.string().min(1),
    sessionDuration: z.number().optional(),
    diagnosis: z.string().min(1, "Diagnosis is required"),
    prescriptionData: z.object({
      medications: z.array(z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        quantity: z.number()
      })).optional(),
      notes: z.string().optional()
    }).optional(),
    emrUpdates: z.object({
      chronicDiseases: z.array(z.string()).optional(),
      surgicalHistory: z.array(z.string()).optional()
    }).optional(),
    followUpDate: z.string().datetime().optional()
  }).strict() // Rejects any unexpected fields
};

// Route: POST /api/consultations/complete-and-next
router.post(
  '/complete-and-next',
  protect,
  authorize('doctor'),
  validate(completeAndNextSchema),
  consultationController.completeAndNextPatient
);

module.exports = router;
