import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Clock, Bell, CheckCircle2, Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useSocketEvent } from "@/providers/SocketProvider"
import { useAppointments, useJoinQueue } from "@/hooks"
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Link } from "react-router-dom"
import type { SocketEvents } from "@/types"
import { cn } from "@/lib/utils"

interface QueueInfo {
  queueNumber: number
  estimatedWaitMinutes: number
  doctorName: string
  status: "waiting" | "your-turn"
}

// Cache key for patient's current queue state — survives navigation within
// the session (avoids losing "#3 — estimated 60min" when they tab away)
// without requiring a backend "get my queue entry" endpoint (doesn't exist).
const QUEUE_INFO_KEY = ["queue", "patient-local-info"] as const

export default function PatientLiveQueue() {
  const qc = useQueryClient()
  const [, rerender] = useState(0)

  // Store queue info in React Query cache (not local state) so it persists
  // across route navigation within the same SPA session.
  const queueInfo = qc.getQueryData<QueueInfo | null>(QUEUE_INFO_KEY) ?? null
  const setQueueInfo = (next: QueueInfo | null) => {
    qc.setQueryData(QUEUE_INFO_KEY, next)
    rerender(n => n + 1)
  }
  const [remaining, setRemaining] = useState<number | null>(null)

  // GET /api/appointments?status=confirmed — confirmed appointments are ready to join
  const { data, isLoading } = useAppointments({ status: "confirmed", limit: 5 })
  const appointments = data?.appointments ?? []
  const { mutate: joinQueue, isPending } = useJoinQueue()

  // ── Page-local socket reactions ─────────────────────────────────────────────
  // Global cache invalidation (invalidateQueries for ["queue"], ["appointments"])
  // is handled in SocketProvider, so these handlers only drive LOCAL UI state.

  useSocketEvent("YOUR_TURN", (data: SocketEvents["YOUR_TURN"]) => {
    // Upgrade status to "your-turn" regardless of whether we have existing info
    setQueueInfo({
      queueNumber: data.queueNumber,
      estimatedWaitMinutes: 0,
      doctorName: data.doctorName,
      status: "your-turn",
    })
  })

  useSocketEvent("QUEUE_UPDATED", (data: SocketEvents["QUEUE_UPDATED"]) => {
    setRemaining(data.remaining)
  })

  useSocketEvent("APPOINTMENT_CONFIRMED", (data: SocketEvents["APPOINTMENT_CONFIRMED"]) => {
    const current = qc.getQueryData<QueueInfo | null>(QUEUE_INFO_KEY)
    if (current) {
      setQueueInfo({
        ...current,
        queueNumber: data.queueNumber,
        estimatedWaitMinutes: data.estimatedWaitMinutes,
      })
    }
  })

  const handleJoin = (appointmentId: string, doctorName: string) => {
    joinQueue({ appointmentId }, {
      onSuccess: ({ data: res }) => {
        if (res) {
          setQueueInfo({
            queueNumber: res.queueNumber,
            estimatedWaitMinutes: res.estimatedWaitMinutes,
            doctorName,
            status: "waiting",
          })
        }
      },
    })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl">
      <PageHeader title="Live Queue" description="Real-time updates on your consultation position" />

      {/* ── ACTIVE QUEUE CARD ── */}
      <AnimatePresence>
        {queueInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="mb-6"
          >
            <Card className={cn(
              "border-2 overflow-hidden",
              queueInfo.status === "your-turn" ? "border-clinic-teal" : "border-clinic-blue/40"
            )}>
              <div className={cn("h-1.5 w-full", queueInfo.status === "your-turn" ? "bg-clinic-teal" : "gradient-brand")} />
              <CardContent className="p-6">
                {queueInfo.status === "your-turn" ? (
                  <motion.div
                    className="text-center space-y-4"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="w-20 h-20 mx-auto bg-clinic-teal-light rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-clinic-teal" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-clinic-teal">It's Your Turn!</p>
                      <p className="text-muted-foreground mt-1">Dr. {queueInfo.doctorName} is ready for you</p>
                    </div>
                    <Badge variant="teal" className="text-sm px-4 py-1.5">
                      Please proceed to the consultation room
                    </Badge>
                    <button
                      onClick={() => setQueueInfo(null)}
                      className="block mx-auto text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Your number</p>
                        <p className="text-5xl font-display font-bold text-clinic-blue mt-1">
                          #{queueInfo.queueNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Estimated wait</p>
                        <p className="text-2xl font-display font-bold mt-1">
                          ~{queueInfo.estimatedWaitMinutes}m
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Queue progress</span>
                        {remaining !== null && <span>{remaining} ahead of you</span>}
                      </div>
                      <Progress value={remaining !== null ? Math.max(10, 100 - remaining * 25) : 30} />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <Bell className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700">
                        You'll be notified here and on WhatsApp when it's your turn
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      With <span className="font-semibold text-foreground">Dr. {queueInfo.doctorName}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JOIN QUEUE SECTION ── */}
      {!queueInfo && (
        appointments.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No confirmed appointments"
            description="Book and confirm an appointment to join the queue for today"
            action={<Button asChild size="sm"><Link to="/patient/book">Book now</Link></Button>}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Today's confirmed appointments — ready to join
            </p>
            {appointments.map(apt => (
              <Card key={apt._id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 gradient-brand-subtle rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-clinic-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Dr. {apt.doctor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.date} at {apt.time}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoin(apt._id, apt.doctor.name)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Queue"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
