const prescriptionService = require('../services/prescriptionService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getByPatient = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const { prescriptions, total } = await prescriptionService.getPatientPrescriptions(req.params.patientId, req.user, { page, limit, isActive });
    res.status(200).json(paginatedResponse({ prescriptions }, 'Prescriptions retrieved successfully.', page, limit, total));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getOne = async (req, res) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id, req.user);
    res.status(200).json(successResponse({ prescription }, 'Prescription retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { getByPatient, getOne };
