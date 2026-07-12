// ============================================================
// ClinicFlow — API Service Functions
// One function per backend endpoint, fully typed.
// ============================================================

import { api, apiGet, apiPost, apiPatch, apiDelete } from './api';
import type {
  // Auth
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
  // Appointments
  BookAppointmentPayload,
  CancelAppointmentPayload,
  RescheduleAppointmentPayload,
  AppointmentFilters,
  Appointment,
  AvailabilityResponse,
  // Doctors
  DoctorFilters,
  DoctorStats,
  UpdateSchedulePayload,
  // Queue
  JoinQueuePayload,
  JoinQueueResponse,
  DoctorQueueResponse,
  QueueEntry,
  // Consultations & EMR
  CompleteConsultationPayload,
  CompleteConsultationResponse,
  UpdateEMRPayload,
  EMR,
  // Prescriptions
  PrescriptionFilters,
  Prescription,
  // Admin
  AdminDashboardStats,
  AdminUserFilters,
  AdminAppointmentFilters,
  // Health
  HealthCheckResponse,
  // Pagination
  PaginationMeta,
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────

export const authApi = {
  /** POST /api/auth/register */
  register: (payload: RegisterPayload) =>
    apiPost<{ user: User }>('/auth/register', payload),

  /** POST /api/auth/verify-otp */
  verifyOtp: (payload: VerifyOtpPayload) =>
    apiPost<{ user: User }>('/auth/verify-otp', payload),

  /** POST /api/auth/resend-otp */
  resendOtp: (payload: ResendOtpPayload) =>
    apiPost<undefined>('/auth/resend-otp', payload),

  /** POST /api/auth/login */
  login: (payload: LoginPayload) =>
    apiPost<{ user: User; token: string }>('/auth/login', payload),

  /** POST /api/auth/logout */
  logout: () => apiPost<undefined>('/auth/logout'),

  /** POST /api/auth/forgot-password */
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiPost<undefined>('/auth/forgot-password', payload),

  /** POST /api/auth/reset-password */
  resetPassword: (payload: ResetPasswordPayload) =>
    apiPost<undefined>('/auth/reset-password', payload),

  /** GET /api/auth/me */
  getMe: () => apiGet<{ user: User }>('/auth/me'),

  /** PATCH /api/auth/me */
  updateMe: (payload: UpdateProfilePayload) =>
    apiPatch<{ user: User }>('/auth/me', payload),
};

// ─── Appointments ─────────────────────────────────────────────

export const appointmentsApi = {
  /** POST /api/appointments (patient only) */
  book: (payload: BookAppointmentPayload) =>
    apiPost<{ appointment: Appointment }>('/appointments', payload),

  /** GET /api/appointments */
  list: (filters?: AppointmentFilters) =>
    apiGet<{ appointments: Appointment[] }>('/appointments', filters as Record<string, unknown>),

  /** GET /api/appointments/:id */
  getById: (id: string) =>
    apiGet<{ appointment: Appointment }>(`/appointments/${id}`),

  /** PATCH /api/appointments/:id/cancel */
  cancel: (id: string, payload?: CancelAppointmentPayload) =>
    apiPatch<{ appointment: Appointment }>(`/appointments/${id}/cancel`, payload),

  /** PATCH /api/appointments/:id/reschedule */
  reschedule: (id: string, payload: RescheduleAppointmentPayload) =>
    apiPatch<{ appointment: Appointment }>(`/appointments/${id}/reschedule`, payload),

  /** GET /api/appointments/availability/:doctorId?date=YYYY-MM-DD */
  getAvailability: (doctorId: string, date: string) =>
    apiGet<AvailabilityResponse>(`/appointments/availability/${doctorId}`, { date }),
};

// ─── Doctors ──────────────────────────────────────────────────

export const doctorsApi = {
  /** GET /api/doctors (public) */
  list: (filters?: DoctorFilters) =>
    api.get<{
      success: true;
      data: { doctors: User[] };
      meta: { pagination: PaginationMeta };
    }>('/doctors', { params: filters }).then((r) => r.data),

  /** GET /api/doctors/:id (public) */
  getById: (id: string) =>
    apiGet<{ doctor: User }>(`/doctors/${id}`),

  /** GET /api/doctors/me/stats (doctor only) */
  getMyStats: () =>
    apiGet<{ stats: DoctorStats }>('/doctors/me/stats'),

  /**
   * PATCH /api/doctors/me/schedule (doctor only)
   * Backend returns { doctor } with only DOCTOR_PUBLIC_FIELDS:
   * name, department, specialization, consultationFee, bio,
   * experienceYears, credentials, workingHours  — no _id/role/email.
   */
  updateSchedule: (payload: UpdateSchedulePayload) =>
    apiPatch<{ doctor: Partial<User> }>('/doctors/me/schedule', payload),
};

// ─── Queue ────────────────────────────────────────────────────

export const queueApi = {
  /** POST /api/queue/join (patient only) */
  join: (payload: JoinQueuePayload) =>
    apiPost<JoinQueueResponse>('/queue/join', payload),

  /** GET /api/queue/my-queue (doctor only) */
  getMyQueue: (date?: string) =>
    apiGet<DoctorQueueResponse>('/queue/my-queue', date ? { date } : undefined),

  /** GET /api/queue/:doctorId (doctor or admin) */
  getDoctorQueue: (doctorId: string, date?: string) =>
    apiGet<DoctorQueueResponse>(`/queue/${doctorId}`, date ? { date } : undefined),

  /** POST /api/queue/call-next (doctor only) */
  callNext: () =>
    apiPost<{ queueEntry: QueueEntry }>('/queue/call-next'),

  /** PATCH /api/queue/:queueId/remove (doctor only) */
  removeFromQueue: (queueId: string) =>
    apiPatch<{ queueEntry: QueueEntry }>(`/queue/${queueId}/remove`),
};

// ─── Consultations & EMR ─────────────────────────────────────

export const consultationsApi = {
  /** POST /api/consultations/complete (doctor only) */
  complete: (payload: CompleteConsultationPayload) =>
    apiPost<CompleteConsultationResponse>('/consultations/complete', payload),

  /** GET /api/consultations/emr/:patientId */
  getEMR: (patientId: string) =>
    apiGet<{ emr: EMR }>(`/consultations/emr/${patientId}`),

  /** PATCH /api/consultations/emr/:patientId (doctor or admin) */
  updateEMR: (patientId: string, payload: UpdateEMRPayload) =>
    apiPatch<{ emr: EMR }>(`/consultations/emr/${patientId}`, payload),
};

// ─── Prescriptions ────────────────────────────────────────────

export const prescriptionsApi = {
  /** GET /api/prescriptions/patient/:patientId */
  listForPatient: (patientId: string, filters?: PrescriptionFilters) =>
    api.get<{
      success: true;
      data: { prescriptions: Prescription[] };
      meta: { pagination: PaginationMeta };
    }>(`/prescriptions/patient/${patientId}`, { params: filters }).then((r) => r.data),

  /** GET /api/prescriptions/:id */
  getById: (id: string) =>
    apiGet<{ prescription: Prescription }>(`/prescriptions/${id}`),
};

// ─── Admin ────────────────────────────────────────────────────

export const adminApi = {
  /** GET /api/admin/dashboard */
  getDashboard: () =>
    apiGet<{ stats: AdminDashboardStats }>('/admin/dashboard'),

  /** GET /api/admin/users */
  listUsers: (filters?: AdminUserFilters) =>
    api.get<{
      success: true;
      data: { users: User[] };
      meta: { pagination: PaginationMeta };
    }>('/admin/users', { params: filters }).then((r) => r.data),

  /** GET /api/admin/users/:id */
  getUserById: (id: string) =>
    apiGet<{ user: User }>(`/admin/users/${id}`),

  /** PATCH /api/admin/users/:id */
  updateUser: (id: string, payload: Partial<User>) =>
    apiPatch<{ user: User }>(`/admin/users/${id}`, payload),

  /** DELETE /api/admin/users/:id */
  deleteUser: (id: string) =>
    apiDelete(`/admin/users/${id}`),

  /** GET /api/admin/appointments */
  listAppointments: (filters?: AdminAppointmentFilters) =>
    api.get<{
      success: true;
      data: { appointments: Appointment[] };
      meta: { pagination: PaginationMeta };
    }>('/admin/appointments', { params: filters }).then((r) => r.data),
};

// ─── Health Check ─────────────────────────────────────────────

export const healthApi = {
  /** GET /api/health (public) */
  check: () =>
    apiGet<HealthCheckResponse>('/health'),
};
