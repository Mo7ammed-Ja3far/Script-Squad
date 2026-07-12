import { format, parseISO, formatDistanceToNow, isToday, isTomorrow } from "date-fns"
import type { AppointmentStatus, QueueStatus } from "@/types"

export function formatDate(dateStr: string, fmt = "MMM d, yyyy") {
  try { return format(parseISO(dateStr), fmt) } catch { return dateStr }
}

export function formatDateTime(dateStr: string) {
  try { return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a") } catch { return dateStr }
}

export function formatRelative(dateStr: string) {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function formatAppointmentDate(dateStr: string) {
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) return "Today"
    if (isTomorrow(d)) return "Tomorrow"
    return format(d, "EEE, MMM d")
  } catch { return dateStr }
}

export function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function getAppointmentStatusVariant(status: AppointmentStatus) {
  const map: Record<AppointmentStatus, string> = {
    pending: "pending",
    confirmed: "confirmed",
    completed: "completed",
    cancelled: "cancelled",
    rescheduled: "rescheduled",
  }
  return map[status] as AppointmentStatus
}

export function getQueueStatusVariant(status: QueueStatus) {
  const map: Record<QueueStatus, string> = {
    waiting: "waiting",
    "in-progress": "in-progress",
    completed: "completed",
    cancelled: "cancelled",
  }
  return map[status] as QueueStatus
}

export const DEPARTMENTS = [
  "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology",
  "General Medicine", "Neurology", "Obstetrics & Gynecology",
  "Ophthalmology", "Orthopedics", "Pediatrics", "Psychiatry",
  "Pulmonology", "Radiology", "Surgery", "Urology",
]

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
}

export function formatCurrency(amount: number, currency = "EGP") {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
}

export function generateTimeSlots(start = "08:00", end = "18:00", duration = 20) {
  const slots: string[] = []
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  let current = sh * 60 + sm
  const endMin = eh * 60 + em
  while (current + duration <= endMin) {
    const h = Math.floor(current / 60).toString().padStart(2, "0")
    const m = (current % 60).toString().padStart(2, "0")
    slots.push(`${h}:${m}`)
    current += duration
  }
  return slots
}
