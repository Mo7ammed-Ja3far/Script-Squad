const consultationService = require('../services/consultationService');

/**
 * @swagger
 * /api/consultations/complete-and-next:
 *   post:
 *     summary: Complete current consultation and call the next patient in queue
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPatientId
 *               - currentQueueId
 *               - diagnosis
 *             properties:
 *               currentPatientId:
 *                 type: string
 *               currentQueueId:
 *                 type: string
 *               sessionDuration:
 *                 type: number
 *               diagnosis:
 *                 type: string
 *               prescriptionData:
 *                 type: object
 *               emrUpdates:
 *                 type: object
 *               followUpDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully completed the consultation and advanced queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 nextPatient:
 *                   type: object
 *                 message:
 *                   type: string
 */
const completeAndNextPatient = async (req, res, next) => {
  try {
    // Controller is thin: passes req.body + doctorId (from Auth) to Service
    const data = {
      ...req.body,
      doctorId: req.user.id // assuming req.user is populated by JWT middleware
    };

    // Grab global io instance (attached to app in server.js)
    const io = req.app.get('io');

    const result = await consultationService.completeAndCallNext(data, io);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  completeAndNextPatient
};
