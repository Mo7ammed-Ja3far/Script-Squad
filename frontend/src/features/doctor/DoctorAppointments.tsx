import { useState } from "react"
import { Calendar, Clock, FileText, Stethoscope, ChevronDown } from "lucide-react"
import { useAppointments } from "@/hooks"
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatAppointmentDate, getAppointmentStatusVariant, getInitials } from "@/utils/helpers"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@/types"

export default function DoctorAppointments() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { data, isLoading } = useAppointments({
    status: statusFilter !== "all" ? statusFilter as AppointmentStatus : undefined,
    limit: 50,
  })

  const appointments = data?.appointments ?? []

  return (
    <div className="max-w-3xl">
      <PageHeader title="Appointments" description="Your patient appointments schedule" />

      {/* Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { value: "all", label: "All" },
          { value: "confirmed", label: "Confirmed" },
          { value: "pending", label: "Pending" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ].map(opt => (
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
        <EmptyState icon={Calendar} title="No appointments" description="No appointments match the current filter" />
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <Card key={apt._id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{getInitials(apt.patient.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{apt.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{apt.patient.phone ?? "No phone"}</p>
                      </div>
                      <Badge variant={getAppointmentStatusVariant(apt.status) as AppointmentStatus}>
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />{formatAppointmentDate(apt.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />{apt.time}
                      </span>
                      <span className="capitalize px-2 py-0.5 bg-muted rounded-full">{apt.type}</span>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">"{apt.notes}"</p>
                    )}
                  </div>
                </div>

                {["confirmed", "pending"].includes(apt.status) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
                    <Button size="sm" variant="soft" asChild className="gap-1.5">
                      <Link to={`/doctor/consultations?appointmentId=${apt._id}`}>
                        <Stethoscope className="h-3.5 w-3.5" />Start Consultation
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5">
                      <FileText className="h-3.5 w-3.5" />Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
