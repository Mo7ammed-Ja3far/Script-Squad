import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity, Phone, Stethoscope, X, Loader2, AlertTriangle,
  ChevronRight, CheckCircle2, Clock, Users
} from "lucide-react"
import { useMyQueue, useCallNext, useRemoveFromQueue } from "@/hooks"
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { getInitials } from "@/utils/helpers"
import { cn } from "@/lib/utils"

/**
 * Doctor Queue Page — three-state visual flow
 * ─────────────────────────────────────────────
 * 1. Waiting list: shows all patients waiting.
 *    → Doctor clicks "Call Next" → backend sets first waiting entry to
 *      'in-progress' and emits YOUR_TURN to the patient. Can't call next
 *      if any entry is already in-progress (backend enforces this).
 *
 * 2. In-Progress panel: appears as a prominent card while a patient is
 *    being seen.
 *    → "Start Examination" navigates to /doctor/consultations?appointmentId=
 *      which is the full consultation/diagnosis form.
 *
 * 3. After the doctor completes the consultation form and saves, the
 *    useCompleteConsultation hook navigates back here via onSuccess
 *    redirect (see DoctorConsultations.tsx). No page reload needed.
 *
 * Real-time updates (QUEUE_PATIENT_JOINED, PATIENT_CALLED, QUEUE_UPDATED,
 * QUEUE_PATIENT_REMOVED) are handled globally by useGlobalQueueSync mounted
 * in DashboardLayout — they invalidate the ["queue"] cache key which causes
 * useMyQueue to refetch automatically.
 */
export default function DoctorQueue() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyQueue()
  const { mutate: callNext, isPending: calling } = useCallNext()
  const { mutate: removeFromQueue, isPending: removing } = useRemoveFromQueue()
  const [removeId, setRemoveId] = useState<string | null>(null)

  // All data comes straight from React Query — no shadow state needed.
  // The global socket sync hook invalidates this query on every relevant event.
  const queue = data?.queue ?? []
  const waiting = queue.filter(e => e.status === "waiting")
  const inProgress = queue.find(e => e.status === "in-progress")
  const completed = queue.filter(e => e.status === "completed").length
  const summary = data?.summary

  const handleCallNext = () => {
    callNext(undefined, {
      onSuccess: ({ data }) => {
        const entry = data?.queueEntry
        if (entry) {
          toast.success(
            `Calling #${entry.queueNumber}`,
            `${entry.patient.name} — please click "Start Examination" when ready`
          )
        }
      },
      onError: (err: any) => toast.error("Could not call next patient", err?.message),
    })
  }

  const handleStartExamination = (appointmentId: string) => {
    navigate(`/doctor/consultations?appointmentId=${appointmentId}`)
  }

  const handleRemove = () => {
    if (!removeId) return
    removeFromQueue(removeId, {
      onSuccess: () => {
        setRemoveId(null)
        toast.success("Patient removed from queue")
      },
      onError: (err: any) => toast.error("Could not remove patient", err?.message),
    })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Patient Queue"
        description={data?.date ? `Today's queue — ${new Date(data.date).toLocaleDateString("en-EG", { weekday: "long", month: "long", day: "numeric" })}` : "Real-time queue management"}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Waiting",     value: summary?.waiting ?? waiting.length,  icon: Clock,        color: "bg-amber-50 text-amber-600 border-amber-100" },
          { label: "In Progress", value: inProgress ? 1 : 0,                  icon: Stethoscope,  color: "bg-clinic-teal-light text-clinic-teal border-teal-100" },
          { label: "Completed",   value: summary?.completed ?? completed,      icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "Total",       value: summary?.total ?? queue.length,       icon: Users,        color: "bg-clinic-blue-light text-clinic-blue border-blue-100" },
        ].map(stat => (
          <div key={stat.label} className={cn("rounded-2xl p-3 text-center border", stat.color)}>
            <stat.icon className="h-4 w-4 mx-auto opacity-70 mb-1" />
            <p className="text-2xl font-display font-bold leading-none">{stat.value}</p>
            <p className="text-xs font-medium opacity-80 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={Activity} title="Queue is empty" description="No patients have joined today's queue yet. They can join once they confirm their appointment." />
      ) : (
        <div className="space-y-4">

          {/* ── IN PROGRESS PANEL ── */}
          <AnimatePresence>
            {inProgress && (
              <motion.div key="inprogress" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="border-2 border-clinic-teal shadow-card-hover overflow-hidden">
                  <div className="h-1.5 bg-clinic-teal w-full" />
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm text-clinic-teal flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-clinic-teal animate-pulse-slow" />
                      Now Consulting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-clinic-teal-light rounded-xl border border-teal-100">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback>{getInitials(inProgress.patient.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{inProgress.patient.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inProgress.appointment.type} · {inProgress.appointment.time}
                          {inProgress.calledAt && ` · Called ${new Date(inProgress.calledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                        </p>
                      </div>
                      <p className="text-3xl font-display font-bold text-clinic-teal shrink-0">
                        #{inProgress.queueNumber}
                      </p>
                    </div>

                    {/* ── START EXAMINATION BUTTON ── */}
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => handleStartExamination(inProgress.appointment._id)}
                    >
                      <Stethoscope className="h-5 w-5 mr-2" />
                      Start Examination
                      <ChevronRight className="h-4 w-4 ml-1 opacity-70" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Opens the full consultation & diagnosis form for this patient
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── WAITING LIST ── */}
          {waiting.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Waiting <span className="ml-1.5 text-muted-foreground font-normal">({waiting.length})</span>
                  </CardTitle>
                  {/* Call-Next button lives here too — always visible, not buried in a row */}
                  {!inProgress && (
                    <Button size="sm" onClick={handleCallNext} disabled={calling}>
                      {calling
                        ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        : <Phone className="h-4 w-4 mr-1.5" />}
                      Call Next
                    </Button>
                  )}
                  {inProgress && (
                    <Badge variant="warning" className="text-xs">Finish current consultation first</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {waiting.map((entry, i) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-clinic-blue/30 hover:bg-muted/40 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg gradient-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
                        #{entry.queueNumber}
                      </div>
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(entry.patient.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.appointment.time} · <span className="capitalize">{entry.appointment.type}</span></p>
                      </div>
                      <button
                        onClick={() => setRemoveId(entry._id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 transition-all shrink-0"
                        title="Remove from queue"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── NO WAITING — queue is done ── */}
          {waiting.length === 0 && !inProgress && completed > 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-foreground">Queue complete!</p>
              <p className="text-sm text-muted-foreground mt-1">{completed} patient{completed > 1 ? "s" : ""} seen today.</p>
            </div>
          )}

          {/* ── COMPLETED COUNT ── */}
          {completed > 0 && (inProgress || waiting.length > 0) && (
            <Card className="bg-emerald-50/50 border-emerald-100">
              <CardContent className="p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">
                  {completed} patient{completed > 1 ? "s" : ""} completed today
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Remove confirmation dialog */}
      <Dialog open={!!removeId} onOpenChange={open => !open && setRemoveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove patient from queue?</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">This cannot be undone. The patient will need to join again.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
