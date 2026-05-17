const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
};

const templates = {
  otp: (code, purpose) => {
    const purposeLabel = purpose === 'registration' ? 'account verification' : 'password reset';
    return (
      `🏥 *ClinicFlow — Verification Code*\n\n` +
      `Your OTP for ${purposeLabel} is:\n\n` +
      `*${code}*\n\n` +
      `⏱ This code expires in *10 minutes*.\n` +
      `🔒 Do not share this code with anyone.\n\n` +
      `If you did not request this, please ignore this message.`
    );
  },

  appointmentConfirmation: ({ patientName, doctorName, department, date, time, type, appointmentId }) => {
    const typeLabel = type === 'follow-up' ? '🔁 Follow-up Visit' : '📋 Regular Appointment';
    return (
      `🏥 *ClinicFlow — Appointment Confirmed*\n\n` +
      `Hello ${patientName},\n\n` +
      `Your appointment has been successfully booked. Here are your details:\n\n` +
      `${typeLabel}\n` +
      `👨‍⚕️ Doctor: *Dr. ${doctorName}*\n` +
      `🏬 Department: *${department || 'General'}*\n` +
      `📅 Date: *${formatDate(date)}*\n` +
      `🕐 Time: *${time}*\n` +
      `🆔 Ref #: \`${appointmentId}\`\n\n` +
      `📌 Please arrive 10 minutes early. Bring any relevant documents.\n\n` +
      `To cancel or reschedule, contact us or use the ClinicFlow app.`
    );
  },

  appointmentCancellation: ({ patientName, doctorName, date, time, reason }) => {
    return (
      `🏥 *ClinicFlow — Appointment Cancelled*\n\n` +
      `Hello ${patientName},\n\n` +
      `Your appointment has been *cancelled*. Here are the details:\n\n` +
      `👨‍⚕️ Doctor: *Dr. ${doctorName}*\n` +
      `📅 Was scheduled for: *${formatDate(date)}* at *${time}*\n` +
      (reason ? `📝 Reason: ${reason}\n` : '') +
      `\nWe hope to see you again soon. You can book a new appointment through the ClinicFlow app.\n\n` +
      `If you believe this was a mistake, please contact the clinic immediately.`
    );
  },

  appointmentReschedule: ({ patientName, doctorName, department, oldDate, oldTime, newDate, newTime, appointmentId }) => {
    return (
      `🏥 *ClinicFlow — Appointment Rescheduled*\n\n` +
      `Hello ${patientName},\n\n` +
      `Your appointment has been *rescheduled*. Please take note of your new time:\n\n` +
      `👨‍⚕️ Doctor: *Dr. ${doctorName}*\n` +
      `🏬 Department: *${department || 'General'}*\n\n` +
      `❌ *Previous Slot:*\n` +
      `   📅 ${formatDate(oldDate)} at ${oldTime}\n\n` +
      `✅ *New Slot:*\n` +
      `   📅 ${formatDate(newDate)} at ${newTime}\n\n` +
      `🆔 Ref #: \`${appointmentId}\`\n\n` +
      `Please update your calendar. Arrive 10 minutes early.`
    );
  },

  postConsultation: ({ patientName, doctorName, diagnosis, medications, followUpDate, prescriptionNotes }) => {
    let medicationList = '';
    if (medications && medications.length > 0) {
      medicationList =
        `\n💊 *Prescribed Medications:*\n` +
        medications.map((med, i) =>
          `   ${i + 1}. *${med.name}* — ${med.dosage}\n` +
          `      Frequency: ${med.frequency}\n` +
          `      Duration: ${med.duration}\n` +
          (med.instructions ? `      Instructions: ${med.instructions}\n` : '')
        ).join('\n');
    } else {
      medicationList = '\n💊 *Medications:* No medications prescribed for this visit.\n';
    }

    const followUp = followUpDate
      ? `\n📅 *Follow-up Appointment:* ${formatDate(followUpDate.split('T')[0])}\n`
      : '';

    return (
      `🏥 *ClinicFlow — Consultation Summary*\n\n` +
      `Hello ${patientName},\n\n` +
      `Thank you for your visit today with *Dr. ${doctorName}*. We hope you feel better soon!\n\n` +
      `🩺 *Diagnosis:* ${diagnosis}\n` +
      medicationList +
      (prescriptionNotes ? `\n📝 *Doctor's Notes:* ${prescriptionNotes}\n` : '') +
      followUp +
      `\n⚠️ *Important:* Take all medications as prescribed. Complete the full course even if you feel better.\n\n` +
      `If you experience any adverse reactions or worsening symptoms, please contact the clinic immediately or visit the emergency department.\n\n` +
      `We value your health. — *ClinicFlow Medical Team*`
    );
  },

  queueJoined: ({ patientName, doctorName, department, queueNumber, estimatedWait }) => {
    return (
      `🏥 *ClinicFlow — Queue Update*\n\n` +
      `Hello ${patientName},\n\n` +
      `You have successfully joined the live queue.\n\n` +
      `👨‍⚕️ Doctor: *Dr. ${doctorName}*\n` +
      `🏬 Department: *${department || 'General'}*\n` +
      `🔢 Your Queue Number: *#${queueNumber}*\n` +
      (estimatedWait ? `⏳ Estimated Wait: *~${estimatedWait} minutes*\n` : '') +
      `\nPlease remain in the waiting area. You will be called by your queue number.\n\n` +
      `Thank you for your patience.`
    );
  }
};

module.exports = templates;
