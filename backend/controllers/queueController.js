const queueService = require('../services/queueService');
const { successResponse, errorResponse } = require('../utils/response');

const join = async (req, res) => {
  try {
    const data = await queueService.joinQueue(req.body.appointmentId, req.user._id);
    res.status(201).json(successResponse(data, `Joined queue successfully. Your number is #${data.queueNumber}.`));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getQueue = async (req, res) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user._id : req.params.doctorId;
    const data = await queueService.getDoctorQueue(doctorId, req.query.date);
    res.status(200).json(successResponse(data, 'Queue retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const callNext = async (req, res) => {
  try {
    const data = await queueService.callNext(req.user._id);
    const msg = data.queueEntry ? `Called patient #${data.queueEntry.queueNumber}.` : data.message;
    res.status(200).json(successResponse(data, msg));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const removeEntry = async (req, res) => {
  try {
    const entry = await queueService.removeFromQueue(req.params.queueId, req.user._id);
    res.status(200).json(successResponse({ entry }, 'Patient removed from queue.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { join, getQueue, callNext, removeEntry };
