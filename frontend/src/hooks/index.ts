import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  authApi, appointmentsApi, doctorsApi, queueApi,
  consultationsApi, prescriptionsApi, adminApi,
} from "@/services/endpoints"
import { tokenStore } from "@/services/api"
import { useAuth } from "@/providers/AuthProvider"
import { toast } from "@/hooks/use-toast"
import type {
  AppointmentFilters, BookAppointmentPayload, RescheduleAppointmentPayload,
  DoctorFilters, UpdateSchedulePayload, JoinQueuePayload,
  CompleteConsultationPayload, UpdateEMRPayload, PrescriptionFilters,
  AdminUserFilters, AdminAppointmentFilters, UpdateProfilePayload,
  LoginPayload, RegisterPayload, VerifyOtpPayload, ResendOtpPayload,
  ForgotPasswordPayload, ResetPasswordPayload,
} from "@/types"

// ─── Query Keys ───────────────────────────────────────────────
export const QK = {
  me: ["auth", "me"] as const,
  appointments: (f?: AppointmentFilters) => ["appointments", f] as const,
  appointment: (id: string) => ["appointments", id] as const,
  availability: (doctorId: string, date: string) => ["availability", doctorId, date] as const,
  doctors: (f?: DoctorFilters) => ["doctors", f] as const,
  doctor: (id: string) => ["doctors", id] as const,
  doctorStats: ["doctors", "me", "stats"] as const,
  myQueue: (date?: string) => ["queue", "mine", date] as const,
  doctorQueue: (id: string, date?: string) => ["queue", id, date] as const,
  emr: (patientId: string) => ["emr", patientId] as const,
  prescriptions: (patientId: string, f?: PrescriptionFilters) => ["prescriptions", patientId, f] as const,
  prescription: (id: string) => ["prescriptions", id] as const,
  adminDashboard: ["admin", "dashboard"] as const,
  adminUsers: (f?: AdminUserFilters) => ["admin", "users", f] as const,
  adminUser: (id: string) => ["admin", "users", id] as const,
  adminAppointments: (f?: AdminAppointmentFilters) => ["admin", "appointments", f] as const,
}

// ═══════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════

export function useMe() {
  return useQuery({ queryKey: QK.me, queryFn: () => authApi.getMe(), select: d => d.data?.user })
}

export function useLogin() {
  const { login } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ data }) => {
      if (data?.user) {
        if (data.token) tokenStore.set(data.token)
        login(data.user, data.token)
        qc.setQueryData(QK.me, { data: { user: data.user } })
      }
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authApi.verifyOtp(payload),
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (payload: ResendOtpPayload) => authApi.resendOtp(payload),
    onSuccess: () => toast.success("OTP resent", "Check your WhatsApp for the new code."),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
    onSuccess: () => toast.success("OTP sent", "Check your WhatsApp to reset your password."),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: () => toast.success("Password reset", "You can now log in with your new password."),
  })
}

export function useUpdateProfile() {
  const { updateUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateMe(payload),
    onSuccess: ({ data }) => {
      if (data?.user) {
        updateUser(data.user)
        qc.setQueryData(QK.me, { data: { user: data.user } })
        toast.success("Profile updated")
      }
    },
  })
}

// ═══════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════

export function useAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: QK.appointments(filters),
    queryFn: () => appointmentsApi.list(filters),
    select: d => ({ appointments: d.data?.appointments ?? [], meta: d.meta }),
    placeholderData: keepPreviousData,
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: QK.appointment(id),
    queryFn: () => appointmentsApi.getById(id),
    select: d => d.data?.appointment,
    enabled: !!id,
  })
}

export function useAvailability(doctorId: string, date: string) {
  return useQuery({
    queryKey: QK.availability(doctorId, date),
    queryFn: () => appointmentsApi.getAvailability(doctorId, date),
    enabled: !!doctorId && !!date,
    staleTime: 1000 * 30,
  })
}

export function useBookAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BookAppointmentPayload) => appointmentsApi.book(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
      toast.success("Appointment booked!", "You'll receive a WhatsApp confirmation shortly.")
    },
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancel(id, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
      toast.success("Appointment cancelled")
    },
  })
}

export function useRescheduleAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & RescheduleAppointmentPayload) =>
      appointmentsApi.reschedule(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
      toast.success("Appointment rescheduled")
    },
  })
}

// ═══════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════

export function useDoctors(filters?: DoctorFilters) {
  return useQuery({
    queryKey: QK.doctors(filters),
    queryFn: () => doctorsApi.list(filters),
    select: d => ({ doctors: d.data?.doctors ?? [], meta: d.meta }),
    placeholderData: keepPreviousData,
  })
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: QK.doctor(id),
    queryFn: () => doctorsApi.getById(id),
    select: d => d.data?.doctor,
    enabled: !!id,
  })
}

export function useDoctorStats() {
  return useQuery({
    queryKey: QK.doctorStats,
    queryFn: () => doctorsApi.getMyStats(),
    select: d => d.data?.stats,
  })
}

export function useUpdateSchedule() {
  const qc = useQueryClient()
  const { user, updateUser } = useAuth()
  return useMutation({
    mutationFn: (payload: UpdateSchedulePayload) => doctorsApi.updateSchedule(payload),
    onSuccess: ({ data }) => {
      // Backend returns only DOCTOR_PUBLIC_FIELDS — merge onto existing user
      // rather than replacing to avoid wiping _id, role, email, etc.
      if (data?.doctor && user) {
        const merged = { ...user, ...data.doctor }
        updateUser(merged)
        qc.setQueryData(QK.me, { data: { user: merged } })
      }
      qc.invalidateQueries({ queryKey: QK.me })
      toast.success("Schedule updated", "Your weekly availability is now live.")
    },
    onError: (err: any) => toast.error("Couldn't save schedule", err?.message ?? "Check your working hours and try again."),
  })
}

// ═══════════════════════════════════════════════════
// QUEUE
// ═══════════════════════════════════════════════════

export function useMyQueue(date?: string) {
  return useQuery({
    queryKey: QK.myQueue(date),
    queryFn: () => queueApi.getMyQueue(date),
    select: d => d.data,
    refetchInterval: 30_000,
  })
}

export function useDoctorQueue(doctorId: string, date?: string) {
  return useQuery({
    queryKey: QK.doctorQueue(doctorId, date),
    queryFn: () => queueApi.getDoctorQueue(doctorId, date),
    select: d => d.data,
    enabled: !!doctorId,
    refetchInterval: 30_000,
  })
}

export function useJoinQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: JoinQueuePayload) => queueApi.join(payload),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      qc.invalidateQueries({ queryKey: ["appointments"] })
      toast.success(`Joined queue! #${data?.queueNumber}`, `Estimated wait: ~${data?.estimatedWaitMinutes} min`)
    },
  })
}

export function useCallNext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => queueApi.callNext(),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      toast.success(`Calling patient #${data?.queueEntry?.queueNumber}`)
    },
  })
}

export function useRemoveFromQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (queueId: string) => queueApi.removeFromQueue(queueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      toast.success("Patient removed from queue")
    },
  })
}

// ═══════════════════════════════════════════════════
// CONSULTATIONS & EMR
// ═══════════════════════════════════════════════════

export function useEMR(patientId: string) {
  return useQuery({
    queryKey: QK.emr(patientId),
    queryFn: () => consultationsApi.getEMR(patientId),
    select: d => d.data?.emr,
    enabled: !!patientId,
  })
}

export function useUpdateEMR(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateEMRPayload) => consultationsApi.updateEMR(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.emr(patientId) })
      toast.success("Medical record updated")
    },
  })
}

export function useCompleteConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompleteConsultationPayload) => consultationsApi.complete(payload),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      qc.invalidateQueries({ queryKey: ["appointments"] })
      // The backend appends a history entry to the patient's EMR in the same
      // transaction (see consultationService.js) — invalidate so the doctor's
      // EMR view shows the new entry immediately if they navigate there.
      if (data?.appointment?.patient) {
        const patientId = typeof data.appointment.patient === "string"
          ? data.appointment.patient
          : (data.appointment.patient as { _id: string })._id
        if (patientId) qc.invalidateQueries({ queryKey: QK.emr(patientId) })
      }
      if (data?.prescription) {
        qc.invalidateQueries({ queryKey: ["prescriptions"] })
      }
      // Note: toast is shown in DoctorConsultations.tsx's onSuccess callback
      // to avoid a double toast (the hook's onSuccess runs before the
      // component's onSuccess in React Query's mutation lifecycle).
    },
  })
}

// ═══════════════════════════════════════════════════
// PRESCRIPTIONS
// ═══════════════════════════════════════════════════

export function usePrescriptions(patientId: string, filters?: PrescriptionFilters) {
  return useQuery({
    queryKey: QK.prescriptions(patientId, filters),
    queryFn: () => prescriptionsApi.listForPatient(patientId, filters),
    select: d => ({ prescriptions: d.data?.prescriptions ?? [], meta: d.meta }),
    enabled: !!patientId,
    placeholderData: keepPreviousData,
  })
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: QK.prescription(id),
    queryFn: () => prescriptionsApi.getById(id),
    select: d => d.data?.prescription,
    enabled: !!id,
  })
}

// ═══════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════

export function useAdminDashboard() {
  return useQuery({
    queryKey: QK.adminDashboard,
    queryFn: () => adminApi.getDashboard(),
    select: d => d.data?.stats,
    staleTime: 1000 * 60,
  })
}

export function useAdminUsers(filters?: AdminUserFilters) {
  return useQuery({
    queryKey: QK.adminUsers(filters),
    queryFn: () => adminApi.listUsers(filters),
    select: d => ({ users: d.data?.users ?? [], meta: d.meta }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: QK.adminUser(id),
    queryFn: () => adminApi.getUserById(id),
    select: d => d.data?.user,
    enabled: !!id,
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("User deleted")
    },
  })
}

export function useAdminToggleUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUser(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(isActive ? "User activated" : "User deactivated")
    },
  })
}

export function useAdminAppointments(filters?: AdminAppointmentFilters) {
  return useQuery({
    queryKey: QK.adminAppointments(filters),
    queryFn: () => adminApi.listAppointments(filters),
    select: d => ({ appointments: d.data?.appointments ?? [], meta: d.meta }),
    placeholderData: keepPreviousData,
  })
}
