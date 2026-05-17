const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const EMR = require('../models/EMR');
const Prescription = require('../models/Prescription');
const Queue = require('../models/Queue');
const User = require('../models/User');
const whatsappService = require('./whatsapp');

const completeConsultation = async (doctorId, { appointmentId, diagnosis, medications, notes, followUpDate }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment) throw { status: 404, message: 'Appointment not found.' };
    if (appointment.doctor.toString() !== doctorId.toString()) throw { status: 403, message: 'Access denied.' };
    if (appointment.status === 'completed') throw { status: 400, message: 'This appointment has already been completed.' };
    if (appointment.status === 'cancelled') throw { status: 400, message: 'Cannot complete a cancelled appointment.' };

    let prescription = null;
    if (medications && medications.length > 0) {
      [prescription] = await Prescription.create([{
        patient: appointment.patient,
        doctor: doctorId,
        appointment: appointmentId,
        medications,
        notes,
        isActive: true
      }], { session });
    }

    let emr = await EMR.findOne({ patient: appointment.patient }).session(session);
    if (!emr) {
      [emr] = await EMR.create([{ patient: appointment.patient, history: [] }], { session });
    }

    const historyEntry = {
      date: new Date(),
      doctor: doctorId,
      appointment: appointmentId,
      diagnosis,
      prescription: prescription?._id,
      notes
    };

    emr.history.push(historyEntry);
    await emr.save({ session });

    appointment.status = 'completed';
    await appointment.save({ session });

    let followUpAppointment = null;
    if (followUpDate) {
      const doctor = await User.findById(doctorId).session(session);
      const followUpDateObj = new Date(followUpDate);
      const dateStr = followUpDateObj.toISOString().split('T')[0];
      const timeStr = appointment.time;

      const slotConflict = await Appointment.findOne({ doctor: doctorId, date: dateStr, time: timeStr, status: { $nin: ['cancelled'] } }).session(session);
      if (!slotConflict) {
        [followUpAppointment] = await Appointment.create([{
          patient: appointment.patient,
          doctor: doctorId,
          date: dateStr,
          time: timeStr,
          type: 'follow-up',
          status: 'pending',
          parentSession: appointmentId
        }], { session });
      }
    }

    await Queue.findOneAndUpdate(
      { appointment: appointmentId, status: 'in-progress' },
      { status: 'completed', completedAt: new Date() },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const [patient, doctor] = await Promise.all([
      User.findById(appointment.patient).select('name whatsappNumber isWhatsappVerified'),
      User.findById(doctorId).select('name department')
    ]);

    if (patient.whatsappNumber && patient.isWhatsappVerified) {
      whatsappService.sendPostConsultationSummary({
        patient,
        doctor,
        diagnosis,
        medications: medications || [],
        prescriptionNotes: notes,
        followUpDate: followUpAppointment?.date
      }).catch(err => console.error('[WhatsApp] Post-consultation message failed:', err.message));
    }

    const populatedPrescription = prescription
      ? await Prescription.findById(prescription._id).populate('doctor', 'name department')
      : null;

    return {
      appointment,
      prescription: populatedPrescription,
      followUpAppointment,
      emrUpdated: true
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const getPatientEMR = async (patientId, requestingUser) => {
  if (requestingUser.role === 'patient' && requestingUser._id.toString() !== patientId) {
    throw { status: 403, message: 'Access denied.' };
  }

  const emr = await EMR.findOne({ patient: patientId })
    .populate({ path: 'patient', select: 'name email phone whatsappNumber' })
    .populate({ path: 'history.doctor', select: 'name department specialization' })
    .populate({ path: 'history.appointment', select: 'date time type' })
    .populate({ path: 'history.prescription' });

  if (!emr) throw { status: 404, message: 'No medical record found for this patient.' };
  return emr;
};

const updateEMRBaseInfo = async (patientId, doctorId, updates) => {
  const allowed = ['bloodType', 'height', 'weight', 'chronicDiseases', 'surgicalHistory', 'allergies'];
  const filtered = {};
  allowed.forEach(k => { if (updates[k] !== undefined) filtered[k] = updates[k]; });

  const emr = await EMR.findOneAndUpdate(
    { patient: patientId },
    { $set: filtered },
    { new: true, upsert: true, runValidators: true }
  )
    .populate({ path: 'patient', select: 'name email phone' })
    .populate({ path: 'history.doctor', select: 'name department' });

  return emr;
};

module.exports = { completeConsultation, getPatientEMR, updateEMRBaseInfo };
