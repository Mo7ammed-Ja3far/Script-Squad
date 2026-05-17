const Prescription = require('../models/Prescription');

const POPULATE_PATIENT = { path: 'patient', select: 'name email phone' };
const POPULATE_DOCTOR = { path: 'doctor', select: 'name department specialization' };
const POPULATE_APPT = { path: 'appointment', select: 'date time type' };

const getPatientPrescriptions = async (patientId, requestingUser, { page = 1, limit = 20, isActive }) => {
  if (requestingUser.role === 'patient' && requestingUser._id.toString() !== patientId) {
    throw { status: 403, message: 'Access denied.' };
  }

  const filter = { patient: patientId };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter).populate(POPULATE_DOCTOR).populate(POPULATE_APPT).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Prescription.countDocuments(filter)
  ]);
  return { prescriptions, total };
};

const getPrescriptionById = async (prescriptionId, requestingUser) => {
  const prescription = await Prescription.findById(prescriptionId)
    .populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR).populate(POPULATE_APPT);
  if (!prescription) throw { status: 404, message: 'Prescription not found.' };

  const isPatient = requestingUser.role === 'patient' && prescription.patient._id.toString() === requestingUser._id.toString();
  const isDoctor = requestingUser.role === 'doctor' && prescription.doctor._id.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === 'admin';
  if (!isPatient && !isDoctor && !isAdmin) throw { status: 403, message: 'Access denied.' };

  return prescription;
};

module.exports = { getPatientPrescriptions, getPrescriptionById };
