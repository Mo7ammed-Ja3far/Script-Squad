import { Link } from "react-router-dom"
import { Calendar, FileText, Pill, Activity, Clock, ChevronRight, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/providers/AuthProvider"
import { useAppointments } from "@/hooks"
import { StatCard, PageHeader, EmptyState, LoadingSpinner } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAppointmentDate, getAppointmentStatusVariant } from "@/utils/helpers"
import type { AppointmentStatus } from "@/types"

export default function PatientOverview() {
  const { user } = useAuth()
  const { data, isLoading } = useAppointments({ limit: 5 })
  const appointments = data?.appointments ?? []

  const upcoming = appointments.filter(a => ["pending", "confirmed"].includes(a.status))
  const completed = appointments.filter(a => a.status === "completed").length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day, ${user?.name.split(" ")[0]} 👋`}
        description="Here's an overview of your healthcare"
      >
        <Button asChild size="sm">
          <Link to="/patient/book"><Plus className="h-4 w-4 mr-1.5" />Book Appointment</Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming" value={upcoming.length} icon={Calendar} color="blue" delay={0} />
        <StatCard label="Completed" value={completed} icon={Activity} color="teal" delay={0.05} />
        <StatCard label="Prescriptions" value="—" icon={Pill} color="purple" delay={0.1} />
        <StatCard label="Medical Records" value="1" icon={FileText} color="emerald" delay={0.15} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Book Appointment", href: "/patient/book", icon: Calendar, color: "bg-clinic-blue-light text-clinic-blue" },
          { label: "Live Queue", href: "/patient/queue", icon: Activity, color: "bg-clinic-teal-light text-clinic-teal" },
          { label: "My Records", href: "/patient/emr", icon: FileText, color: "bg-purple-50 text-purple-600" },
          { label: "Prescriptions", href: "/patient/prescriptions", icon: Pill, color: "bg-emerald-50 text-emerald-600" },
        ].map((item, i) => (
          <motion.div key={item.href} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.04 }}>
            <Link to={item.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-center text-foreground group-hover:text-clinic-blue transition-colors">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent appointments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Appointments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/patient/appointments" className="text-clinic-blue text-xs">
                View all <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner /> : appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments yet"
              description="Book your first appointment with a specialist"
              action={<Button asChild size="sm"><Link to="/patient/book">Book now</Link></Button>} />
          ) : (
            <div className="space-y-2">
              {appointments.map(apt => (
                <div key={apt._id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 gradient-brand-subtle rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-clinic-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Dr. {apt.doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{formatAppointmentDate(apt.date)} at {apt.time}</p>
                  </div>
                  <Badge variant={getAppointmentStatusVariant(apt.status) as AppointmentStatus}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
