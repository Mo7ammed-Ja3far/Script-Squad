const consultationService = require('../services/consultationService');
const { successResponse, errorResponse } = require('../utils/response');

const complete = async (req, res) => {
  try {
    const result = await consultationService.completeConsultation(req.user._id, req.body);
    res.status(200).json(successResponse(result, 'Consultation completed successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getEMR = async (req, res) => {
  try {
    const emr = await consultationService.getPatientEMR(req.params.patientId, req.user);
    res.status(200).json(successResponse({ emr }, 'Medical record retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const updateEMR = async (req, res) => {
  try {
    const emr = await consultationService.updateEMRBaseInfo(req.params.patientId, req.user._id, req.body);
    res.status(200).json(successResponse({ emr }, 'Medical record updated successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { complete, getEMR, updateEMR };
