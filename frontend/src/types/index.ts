// ============================================================
// ClinicFlow — TypeScript Types
// Strictly derived from backend models, DTOs, and API responses
// ============================================================

// ─── Primitives & Enums ──────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type AppointmentType = 'regular' | 'follow-up';

export type QueueStatus = 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export type OtpPurpose = 'registration' | 'password_reset';

export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | null;

// ─── Sub-documents ───────────────────────────────────────────

export interface Credential {
  degree: string;
  institution: string;
  year: number;
}

export interface WorkingHour {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  slotDuration?: number; // minutes, default 20
  isDayOff?: boolean;
}

export interface RescheduledFrom {
  date: string;
  time: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

// ─── Core Models (populated from API) ────────────────────────

/**
 * User — populated shape returned by all API endpoints.
 * `password` is never returned by the API.
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  whatsappNumber?: string;
  isWhatsappVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Doctor-only fields (present when role === 'doctor')
  department?: string;
  specialization?: string;
  consultationFee?: number;
  bio?: string;
  experienceYears?: number;
  credentials?: Credential[];
  workingHours?: WorkingHour[];
}

/** Minimal user ref embedded inside populated documents */
export interface UserRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

/** Minimal doctor ref embedded inside populated documents */
export interface DoctorRef {
  _id: string;
  name: string;
  department?: string;
  specialization?: string;
  consultationFee?: number;
}

export interface Appointment {
  _id: string;
  patient: UserRef;
  doctor: DoctorRef;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: AppointmentStatus;
  type: AppointmentType;
  parentSession?: string;
  notes?: string;
  rescheduledFrom?: RescheduledFrom;
  rescheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueEntry {
  _id: string;
  doctor: DoctorRef;
  patient: UserRef;
  appointment: {
    _id: string;       // always present — MongoDB populate includes _id by default
    date: string;
    time: string;
    type: AppointmentType;
    notes?: string;
    status?: AppointmentStatus;
  };
  date: string;
  status: QueueStatus;
  queueNumber: number;
  calledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EMRHistoryEntry {
  _id?: string;
  date: string;
  doctor: DoctorRef & { name: string };
  appointment: { date: string; time: string; type: AppointmentType };
  diagnosis: string;
  durationMinutes?: number;
  prescription?: PrescriptionRef;
  notes?: string;
}

export interface PrescriptionRef {
  _id: string;
  medications: Medication[];
}

export interface EMR {
  _id: string;
  patient: UserRef;
  bloodType: BloodType;
  height?: number;
  weight?: number;
  chronicDiseases: string[];
  surgicalHistory: string[];
  allergies: string[];
  history: EMRHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  _id: string;
  patient: UserRef;
  doctor: DoctorRef & { name: string };
  appointment?: { date: string; time: string; type: AppointmentType };
  medications: Medication[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Envelope ────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccess<T = undefined> {
  success: true;
  message: string;
  data?: T;
  meta?: { pagination: PaginationMeta };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export type ApiResponse<T = undefined> = ApiSuccess<T> | ApiError;

// ─── Auth API Payloads & Responses ───────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  whatsappNumber: string;
  // Doctor-only
  department?: string;
  specialization?: string;
  consultationFee?: number;
  bio?: string;
  experienceYears?: number;
  credentials?: Credential[];
  workingHours?: WorkingHour[];
}

export interface VerifyOtpPayload {
  whatsappNumber: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ResendOtpPayload {
  whatsappNumber: string;
  purpose: OtpPurpose;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  whatsappNumber: string;
}

export interface ResetPasswordPayload {
  whatsappNumber: string;
  code: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  bio?: string;
  department?: string;
  specialization?: string;
  consultationFee?: number;
  experienceYears?: number;
  credentials?: Credential[];
}

// ─── Appointment API Payloads & Responses ────────────────────

export interface BookAppointmentPayload {
  doctorId: string;
  date: string;
  time: string;
  type: AppointmentType;
  notes?: string;
}

export interface CancelAppointmentPayload {
  reason?: string;
}

export interface RescheduleAppointmentPayload {
  newDate: string;
  newTime: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  available: boolean;
  doctor: DoctorRef;
  date: string;
  schedule: { startTime: string; endTime: string; slotDuration: number };
  slots: AvailabilitySlot[];
  totalSlots: number;
  availableSlots: number;
}

// ─── Doctor API ───────────────────────────────────────────────

export interface DoctorFilters {
  department?: string;
  specialization?: string;
  page?: number;
  limit?: number;
}

export interface DoctorStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  today: number;
}

export interface UpdateSchedulePayload {
  workingHours: WorkingHour[];
}

// ─── Queue API ────────────────────────────────────────────────

export interface JoinQueuePayload {
  appointmentId: string;
}

export interface JoinQueueResponse {
  queueEntry: QueueEntry;
  queueNumber: number;
  estimatedWaitMinutes: number;
}

export interface QueueSummary {
  total: number;
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface DoctorQueueResponse {
  queue: QueueEntry[];
  summary: QueueSummary;
  date: string;
}

// ─── Consultation & EMR API ───────────────────────────────────

export interface CompleteConsultationPayload {
  appointmentId: string;
  diagnosis: string;
  medications?: Medication[];
  notes?: string;
  followUpDate?: string;
}

export interface CompleteConsultationResponse {
  /**
   * NOTE: consultationService.js never calls .populate('patient') before
   * returning — so appointment.patient is a raw ObjectId string at runtime,
   * not a UserRef object, despite the shared Appointment type claiming otherwise.
   * Code reading this field must handle both shapes.
   */
  appointment: Omit<Appointment, "patient"> & { patient: string | UserRef };
  prescription?: Prescription;
  followUpAppointment?: Appointment;
  emrUpdated: boolean;
}

export interface UpdateEMRPayload {
  bloodType?: BloodType;
  height?: number;
  weight?: number;
  chronicDiseases?: string[];
  allergies?: string[];
  surgicalHistory?: string[];
}

// ─── Prescription API ─────────────────────────────────────────

export interface PrescriptionFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

// ─── Admin API ────────────────────────────────────────────────

export interface AdminDashboardStats {
  users: {
    patients: number;
    doctors: number;
    admins: number;
    total: number;
  };
  appointments: {
    total: number;
    today: number;
    thisWeek: number;
    byStatus: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
      rescheduled: number;
    };
  };
  medical: {
    prescriptions: number;
    emrRecords: number;
  };
  queue: {
    activeToday: number;
  };
  recentPatients: Array<{ _id: string; name: string; email: string; createdAt: string }>;
}

export interface AdminUserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminAppointmentFilters extends AppointmentFilters {
  doctorId?: string;
  patientId?: string;
}

// ─── Socket.io Events ─────────────────────────────────────────

/** Events emitted by the Server to the Client */
export interface SocketEvents {
  CONNECTED: { message: string; userId: string; role: UserRole };
  QUEUE_PATIENT_JOINED: {
    queueEntry: QueueEntry;
    queueNumber: number;
    estimatedWaitMinutes: number;
  };
  PATIENT_CALLED: {
    queueEntry: QueueEntry & { calledAt: string };
  };
  YOUR_TURN: {
    message: string;
    queueNumber: number;
    doctorName: string;
  };
  QUEUE_UPDATED: { remaining: number };
  APPOINTMENT_CONFIRMED: {
    appointmentId: string;
    queueNumber: number;
    estimatedWaitMinutes: number;
  };
  QUEUE_PATIENT_REMOVED: { queueId: string };
  QUEUE_ROOM_JOINED: { doctorId: string };
}

/** Events emitted by the Client to the Server */
export interface ClientSocketEvents {
  JOIN_DOCTOR_QUEUE_ROOM: { doctorId: string };
  LEAVE_DOCTOR_QUEUE_ROOM: { doctorId: string };
}

// ─── Health Check ─────────────────────────────────────────────

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  whatsapp: { ready: boolean; status: string };
  timestamp: string;
}
