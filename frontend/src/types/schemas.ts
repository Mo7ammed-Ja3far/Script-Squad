// ============================================================
// ClinicFlow — Zod Validation Schemas
// Mirrors backend validate.js rules exactly
// ============================================================

import { z } from "zod";

// ─── Shared ──────────────────────────────────────────────────

/**
 * Normalise a raw Egyptian mobile number to full E.164 (+20xxxxxxxxxx)
 * so the backend stores a consistent format that the WhatsApp adapter
 * can strip to "20xxxxxxxxxx@c.us" without a missing country-code bug.
 *
 * Accepted input forms (all produce "+201XXXXXXXXX"):
 *   01012345678        → +201012345678
 *   201012345678       → +201012345678
 *   +201012345678      → +201012345678  (already correct)
 *   0020 101 234 5678  → +201012345678  (strip spaces/dashes)
 *
 * For non-Egyptian numbers the caller must include the country code
 * (e.g. +966...).  We won't mangle them.
 */
export function normalizeEgyptianPhone(raw: string): string {
  const stripped = raw.replace(/[\s\-().]/g, "");
  if (/^01[0125]\d{8}$/.test(stripped)) return `+20${stripped.slice(1)}`; // 01x... → +201x...
  if (/^201[0125]\d{8}$/.test(stripped)) return `+${stripped}`; // 201x... → +201x...
  if (/^0020/.test(stripped)) return `+${stripped.slice(2)}`; // 0020... → +20...
  return stripped.startsWith("+") ? stripped : `+${stripped}`; // pass-through, ensure +
}

/**
 * Zod schema for any whatsapp/phone field.
 * Preprocessing runs BEFORE validation, so the user can type "01012345678"
 * and it passes the regex after normalisation.  The normalised value is
 * what ends up in the form data and ultimately in the API payload.
 */
const whatsappNumberSchema = z.preprocess(
  (val) => (typeof val === "string" ? normalizeEgyptianPhone(val) : val),
  z
    .string()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      "رقم الهاتف غير صحيح — اكتب الرقم بدءاً من 01 أو أضف كود الدولة (+20)",
    ),
);

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// ─── Credentials Sub-schema ───────────────────────────────────

export const credentialSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
});

// ─── Working Hours Sub-schema ─────────────────────────────────

export const workingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  slotDuration: z.number().int().min(5).max(120).optional(),
  isDayOff: z.boolean().optional(),
});

// ─── Auth Schemas ─────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    role: z.enum(["patient", "doctor", "admin"]),
    phone: z.string().optional(),
    whatsappNumber: whatsappNumberSchema,

    // Doctor-only
    department: z.string().optional(),
    specialization: z.string().optional(),
    consultationFee: z.number().min(0).optional(),
    bio: z.string().optional(),
    experienceYears: z.number().min(0).optional(),
    credentials: z.array(credentialSchema).optional(),
    workingHours: z.array(workingHourSchema).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine(
    (data) => {
      if (data.role === "doctor") {
        return (
          !!data.department &&
          !!data.specialization &&
          data.consultationFee !== undefined
        );
      }
      return true;
    },
    {
      message:
        "Department, specialization, and consultation fee are required for doctors",
      path: ["department"],
    },
  );

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const verifyOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  purpose: z.enum(["registration", "password_reset"]),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
  purpose: z.enum(["registration", "password_reset"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    whatsappNumber: whatsappNumberSchema,
    code: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).trim().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  experienceYears: z.number().min(0).optional(),
  credentials: z.array(credentialSchema).optional(),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

// ─── Appointment Schemas ──────────────────────────────────────

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  date: dateSchema,
  time: timeSchema,
  type: z.enum(["regular", "follow-up"]),
  notes: z.string().optional(),
});

export type BookAppointmentFormValues = z.infer<typeof bookAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newDate: dateSchema,
  newTime: timeSchema,
});

export type RescheduleFormValues = z.infer<typeof rescheduleAppointmentSchema>;

// ─── Doctor Schedule Schema ───────────────────────────────────

export const updateScheduleSchema = z.object({
  workingHours: z
    .array(workingHourSchema)
    .min(1, "At least one day must be configured"),
});

export type UpdateScheduleFormValues = z.infer<typeof updateScheduleSchema>;

// ─── Queue Schemas ────────────────────────────────────────────

export const joinQueueSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
});

// ─── Consultation & EMR Schemas ───────────────────────────────

export const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  instructions: z.string().optional(),
});

export type MedicationFormValues = z.infer<typeof medicationSchema>;

export const completeConsultationSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  diagnosis: z.string().min(1, "Diagnosis is required").trim(),
  medications: z.array(medicationSchema).optional(),
  notes: z.string().optional(),
  followUpDate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    dateSchema.optional(),
  ),
});

export type CompleteConsultationFormValues = z.infer<
  typeof completeConsultationSchema
>;

export const updateEMRSchema = z.object({
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .nullable()
    .optional(),
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  chronicDiseases: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  surgicalHistory: z.array(z.string()).optional(),
});

export type UpdateEMRFormValues = z.infer<typeof updateEMRSchema>;
