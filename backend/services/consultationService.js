const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const EMR = require('../models/EMR');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');

/**
 * Handle "Complete & Next Patient" transaction
 */
const completeAndCallNext = async (data, io) => {
  const { 
    doctorId, 
    currentPatientId, 
    currentQueueId, 
    sessionDuration, 
    diagnosis, 
    prescriptionData, 
    emrUpdates, 
    followUpDate 
  } = data;

  // Start an ACID transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Mark current patient queue as Completed
    const currentQueue = await Queue.findOneAndUpdate(
      { _id: currentQueueId, doctor: doctorId },
      { status: 'completed' },
      { new: true, session }
    );
    if (!currentQueue) throw new Error('Current queue entry not found.');

    // 2. Mark appointment as Completed
    await Appointment.findByIdAndUpdate(
      currentQueue.appointment,
      { status: 'completed' },
      { session }
    );

    // 3. Save Prescription if any
    let newPrescription = null;
    if (prescriptionData && prescriptionData.medications && prescriptionData.medications.length > 0) {
      const createdPrescriptions = await Prescription.create([{
        patient: currentPatientId,
        doctor: doctorId,
        medications: prescriptionData.medications,
        notes: prescriptionData.notes
      }], { session });
      newPrescription = createdPrescriptions[0];
    }

    // 4. Update EMR (History, Chronic Diseases, Surgeries)
    const emrUpdateQuery = {
      $push: {
        history: {
          doctor: doctorId,
          diagnosis,
          durationMinutes: sessionDuration,
          prescription: newPrescription ? newPrescription._id : undefined
        }
      }
    };
    
    // Add non-duplicate chronic diseases and surgical history
    if (emrUpdates) {
      if (emrUpdates.chronicDiseases) {
        emrUpdateQuery.$addToSet = { ...emrUpdateQuery.$addToSet, chronicDiseases: { $each: emrUpdates.chronicDiseases } };
      }
      if (emrUpdates.surgicalHistory) {
        emrUpdateQuery.$addToSet = { ...emrUpdateQuery.$addToSet, surgicalHistory: { $each: emrUpdates.surgicalHistory } };
      }
    }

    await EMR.findOneAndUpdate(
      { patient: currentPatientId },
      emrUpdateQuery,
      { upsert: true, new: true, session }
    );

    // 5. Create follow-up appointment if requested
    if (followUpDate) {
      await Appointment.create([{
        patient: currentPatientId,
        doctor: doctorId,
        date: new Date(followUpDate),
        type: 'follow-up',
        parentSession: currentQueue.appointment
      }], { session });
    }

    // 6. Fetch Next Patient in Queue & update to in-progress
    // Assume date is today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const nextQueue = await Queue.findOneAndUpdate(
      { 
        doctor: doctorId, 
        status: 'waiting',
        date: { $gte: startOfDay, $lte: endOfDay }
      },
      { status: 'in-progress' },
      { sort: { queueNumber: 1 }, new: true, session }
    ).populate('patient', 'name email');

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // 7. Fire Socket.io Events
    const roomName = `doctor_${doctorId}`;
    
    if (nextQueue) {
      // Notify the next patient specifically or broadcast to room
      io.to(roomName).emit('PATIENT_CALLED', {
        queueNumber: nextQueue.queueNumber,
        patientId: nextQueue.patient._id,
        patientName: nextQueue.patient.name,
        status: 'in-progress'
      });
    }

    // Broadcast general queue update to the waiting room
    io.to(roomName).emit('QUEUE_UPDATED', {
      doctor: doctorId,
      currentlyServing: nextQueue ? nextQueue.queueNumber : null,
      message: nextQueue ? 'Queue advanced' : 'No more patients waiting'
    });

    return {
      success: true,
      nextPatient: nextQueue ? nextQueue : null,
      message: 'Consultation completed successfully.'
    };

  } catch (error) {
    // Abort Transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  completeAndCallNext
};
