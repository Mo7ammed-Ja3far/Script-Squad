import { useState } from "react"
import { Calendar, X, RefreshCw, PlayCircle, Loader2, ChevronDown } from "lucide-react"
import { useAppointments, useCancelAppointment, useJoinQueue } from "@/hooks"
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatAppointmentDate, getAppointmentStatusVariant, getInitials } from "@/utils/helpers"
import { cn } from "@/lib/utils"
import type { Appointment, AppointmentStatus } from "@/types"
import { Link } from "react-router-dom"

export default function PatientAppointments() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [cancelId, setCancelId] = useState<string | null>(null)

  const { data, isLoading } = useAppointments({
    status: statusFilter !== "all" ? statusFilter as AppointmentStatus : undefined,
    limit: 20,
  })
  const appointments = data?.appointments ?? []
  const { mutate: cancel, isPending: cancelling } = useCancelAppointment()
  const { mutate: joinQueue, isPending: joiningQueue } = useJoinQueue()

  const statusOptions: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const handleCancel = () => {
    if (!cancelId) return
    cancel({ id: cancelId }, { onSuccess: () => setCancelId(null) })
  }

  const handleJoinQueue = (apt: Appointment) => {
    joinQueue({ appointmentId: apt._id })
  }

  const canCancel = (apt: Appointment) => ["pending", "confirmed"].includes(apt.status)
  const canJoin = (apt: Appointment) => ["pending", "confirmed"].includes(apt.status)

  return (
    <div>
      <PageHeader title="My Appointments" description="Track and manage your appointments">
        <Button asChild size="sm">
          <Link to="/patient/book">Book new</Link>
        </Button>
      </PageHeader>

      {/* Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {statusOptions.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
              statusFilter === opt.value
                ? "gradient-brand text-white border-transparent"
                : "border-border bg-white text-muted-foreground hover:border-clinic-blue/40"
            )}>
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments"
          description="Book an appointment with a specialist to get started"
          action={<Button asChild size="sm"><Link to="/patient/book">Book now</Link></Button>} />
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <Card key={apt._id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{getInitials(apt.doctor.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">Dr. {apt.doctor.name}</p>
                        <p className="text-xs text-muted-foreground">{apt.doctor.department}</p>
                      </div>
                      <Badge variant={getAppointmentStatusVariant(apt.status) as AppointmentStatus}>
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />{formatAppointmentDate(apt.date)}
                      </span>
                      <span>{apt.time}</span>
                      <span className="capitalize px-2 py-0.5 bg-muted rounded-full">{apt.type}</span>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">"{apt.notes}"</p>
                    )}
                  </div>
                </div>

                {(canCancel(apt) || canJoin(apt)) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
                    {canJoin(apt) && (
                      <Button size="sm" variant="teal" className="gap-1.5" onClick={() => handleJoinQueue(apt)}
                        disabled={joiningQueue}>
                        <PlayCircle className="h-3.5 w-3.5" />Join Queue
                      </Button>
                    )}
                    {canCancel(apt) && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setCancelId(apt._id)}>
                        <X className="h-3.5 w-3.5" />Cancel
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel confirm dialog */}
      <Dialog open={!!cancelId} onOpenChange={o => !o && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel appointment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. Are you sure you want to cancel this appointment?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep it</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
