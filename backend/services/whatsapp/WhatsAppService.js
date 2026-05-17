const crypto = require('crypto');
const OTP = require('../../models/OTP');
const templates = require('./messageTemplates');

const MAX_OTP_ATTEMPTS = 5;

class WhatsAppService {
  constructor(adapter) {
    this._adapter = adapter;
  }

  async initialize() {
    await this._adapter.initialize();
  }

  isReady() {
    return this._adapter.isReady();
  }

  async destroy() {
    await this._adapter.destroy();
  }

  async sendMessage(to, message) {
    if (!this._adapter.isReady()) {
      console.warn(`[WhatsApp] Client not ready — message to ${to} dropped. Purpose: logging only.`);
      return { sent: false, reason: 'client_not_ready' };
    }
    await this._adapter.sendMessage(to, message);
    return { sent: true };
  }

  generateOtpCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOtp(whatsappNumber, purpose) {
    await OTP.deleteMany({ whatsappNumber, purpose });

    const code = this.generateOtpCode();

    await OTP.create({ whatsappNumber, code, purpose });

    const message = templates.otp(code, purpose);
    await this.sendMessage(whatsappNumber, message);

    return { sent: true };
  }

  async verifyOtp(whatsappNumber, code, purpose) {
    const record = await OTP.findOne({ whatsappNumber, purpose });

    if (!record) {
      return { valid: false, reason: 'OTP not found or expired' };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({ _id: record._id });
      return { valid: false, reason: 'Too many failed attempts. Please request a new OTP.' };
    }

    if (record.code !== code) {
      await OTP.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      const remaining = MAX_OTP_ATTEMPTS - record.attempts - 1;
      return { valid: false, reason: `Invalid OTP. ${remaining} attempt(s) remaining.` };
    }

    await OTP.deleteOne({ _id: record._id });
    return { valid: true };
  }

  async sendAppointmentConfirmation(appointment, patient, doctor) {
    const message = templates.appointmentConfirmation({
      patientName: patient.name,
      doctorName: doctor.name,
      department: doctor.department,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      appointmentId: appointment._id.toString()
    });
    return this.sendMessage(patient.whatsappNumber, message);
  }

  async sendCancellationNotice(appointment, patient, doctor, reason) {
    const message = templates.appointmentCancellation({
      patientName: patient.name,
      doctorName: doctor.name,
      date: appointment.date,
      time: appointment.time,
      reason
    });
    return this.sendMessage(patient.whatsappNumber, message);
  }

  async sendRescheduleNotice(appointment, patient, doctor, oldDate, oldTime) {
    const message = templates.appointmentReschedule({
      patientName: patient.name,
      doctorName: doctor.name,
      department: doctor.department,
      oldDate,
      oldTime,
      newDate: appointment.date,
      newTime: appointment.time,
      appointmentId: appointment._id.toString()
    });
    return this.sendMessage(patient.whatsappNumber, message);
  }

  async sendPostConsultationSummary({ patient, doctor, diagnosis, medications, prescriptionNotes, followUpDate }) {
    const message = templates.postConsultation({
      patientName: patient.name,
      doctorName: doctor.name,
      diagnosis,
      medications,
      prescriptionNotes,
      followUpDate
    });
    return this.sendMessage(patient.whatsappNumber, message);
  }

  async sendQueueJoinedNotice({ patient, doctor, queueNumber, estimatedWait }) {
    const message = templates.queueJoined({
      patientName: patient.name,
      doctorName: doctor.name,
      department: doctor.department,
      queueNumber,
      estimatedWait
    });
    return this.sendMessage(patient.whatsappNumber, message);
  }
}

module.exports = WhatsAppService;
