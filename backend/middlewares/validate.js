const { z } = require('zod');
const { errorResponse } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json(errorResponse('Validation failed.', errors));
  }
  req.body = result.data;
  next();
};

const schemas = {
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['patient', 'doctor', 'admin']),
    phone: z.string().optional(),
    whatsappNumber: z.string().min(7, 'Invalid WhatsApp number').regex(/^\+?[0-9\s\-().]+$/, 'Invalid phone number format'),
    department: z.string().optional(),
    specialization: z.string().optional(),
    consultationFee: z.number().positive().optional(),
    bio: z.string().optional(),
    experienceYears: z.number().min(0).optional(),
    credentials: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.number()
    })).optional(),
    workingHours: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      slotDuration: z.number().optional(),
      isDayOff: z.boolean().optional()
    })).optional()
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  verifyOtp: z.object({
    whatsappNumber: z.string().min(7),
    code: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(['registration', 'password_reset'])
  }),

  resendOtp: z.object({
    whatsappNumber: z.string().min(7),
    purpose: z.enum(['registration', 'password_reset'])
  }),

  forgotPassword: z.object({
    whatsappNumber: z.string().min(7)
  }),

  resetPassword: z.object({
    whatsappNumber: z.string().min(7),
    code: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters')
  }),

  bookAppointment: z.object({
    doctorId: z.string().length(24, 'Invalid doctor ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
    type: z.enum(['regular', 'follow-up']).optional(),
    notes: z.string().max(500).optional()
  }),

  rescheduleAppointment: z.object({
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    newTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM')
  }),

  cancelAppointment: z.object({
    reason: z.string().max(200).optional()
  }),

  completeConsultation: z.object({
    appointmentId: z.string().length(24, 'Invalid appointment ID'),
    diagnosis: z.string().min(3, 'Diagnosis is required'),
    medications: z.array(z.object({
      name: z.string().min(1),
      dosage: z.string().min(1),
      frequency: z.string().min(1),
      duration: z.string().min(1),
      quantity: z.number().positive(),
      instructions: z.string().optional()
    })).optional(),
    notes: z.string().max(1000).optional(),
    followUpDate: z.string().optional()
  }),

  updateEMR: z.object({
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    chronicDiseases: z.array(z.string()).optional(),
    surgicalHistory: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional()
  }),

  joinQueue: z.object({
    appointmentId: z.string().length(24, 'Invalid appointment ID')
  }),

  updateSchedule: z.object({
    workingHours: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      slotDuration: z.number().min(5).max(120).optional(),
      isDayOff: z.boolean().optional()
    }))
  })
};

module.exports = { validate, schemas };
