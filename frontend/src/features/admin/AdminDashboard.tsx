import { Link } from "react-router-dom"
import { Users, Calendar, FileText, Activity, TrendingUp, AlertCircle, ChevronRight } from "lucide-react"
import { useAdminDashboard, useAdminAppointments } from "@/hooks"
import { StatCard, PageHeader, LoadingSpinner } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, formatDate } from "@/utils/helpers"
import type { UserRole } from "@/types"

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminDashboard()
  const { data: aptsData, isLoading: loadingApts } = useAdminAppointments({ limit: 5 })
  const recentApts = aptsData?.appointments ?? []

  const roleColors: Record<UserRole, { bg: string; text: string; icon: React.ElementType }> = {
    patient: { bg: "bg-clinic-blue-light", text: "text-clinic-blue", icon: Users },
    doctor: { bg: "bg-clinic-teal-light", text: "text-clinic-teal", icon: FileText },
    admin: { bg: "bg-purple-50", text: "text-purple-600", icon: Activity },
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Dashboard" description="Overview of your ClinicFlow platform" />

      {loadingStats ? <LoadingSpinner /> : stats ? (
        <>
          {/* User stats */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Users</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Patients" value={stats.users.patients} icon={Users} color="blue" delay={0} />
              <StatCard label="Doctors" value={stats.users.doctors} icon={FileText} color="teal" delay={0.05} />
              <StatCard label="Admins" value={stats.users.admins} icon={Activity} color="purple" delay={0.1} />
              <StatCard label="Total Users" value={stats.users.total} icon={Users} color="emerald" delay={0.15} />
              <StatCard label="Active Queue" value={stats.queue.activeToday} icon={Activity} color="amber" delay={0.2} />
            </div>
          </div>

          {/* Appointment stats */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Appointments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total" value={stats.appointments.total} icon={Calendar} color="blue" delay={0} />
              <StatCard label="Today" value={stats.appointments.today} icon={Calendar} color="teal" delay={0.05} />
              <StatCard label="This Week" value={stats.appointments.thisWeek} icon={Calendar} color="emerald" delay={0.1} />
              <StatCard label="Pending" value={stats.appointments.byStatus.pending} icon={AlertCircle} color="amber" delay={0.15} />
            </div>
          </div>

          {/* Status breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Appointment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: "Pending", value: stats.appointments.byStatus.pending, color: "text-amber-600 bg-amber-50" },
                  { label: "Confirmed", value: stats.appointments.byStatus.confirmed, color: "text-clinic-blue bg-clinic-blue-light" },
                  { label: "Completed", value: stats.appointments.byStatus.completed, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Cancelled", value: stats.appointments.byStatus.cancelled, color: "text-red-600 bg-red-50" },
                  { label: "Rescheduled", value: stats.appointments.byStatus.rescheduled, color: "text-purple-600 bg-purple-50" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-4 text-center border border-border ${s.color}`}>
                    <p className="text-2xl font-display font-bold">{s.value}</p>
                    <p className="text-xs font-medium opacity-80 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Manage Users", href: "/admin/users", icon: Users },
              { label: "Appointments", href: "/admin/appointments", icon: Calendar },
              { label: "Medical Records", href: "#", icon: FileText, disabled: true },
              { label: "System Health", href: "#", icon: Activity, disabled: true },
            ].map(item => (
              <Link key={item.href} to={item.href} className={item.disabled ? "pointer-events-none opacity-50" : ""}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-white hover:shadow-card transition-all">
                  <item.icon className="h-5 w-5 text-clinic-blue" />
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent appointments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Appointments</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/appointments" className="text-clinic-blue text-xs">
                    View all <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingApts ? <LoadingSpinner /> : (
                <div className="space-y-2">
                  {recentApts.map(apt => (
                    <div key={apt._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(apt.patient.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{apt.patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {apt.doctor.name} • {formatDate(apt.date)}
                        </p>
                      </div>
                      <Badge variant={apt.status as any}>{apt.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent patients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentPatients.slice(0, 5).map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(p.createdAt)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : <p className="text-muted-foreground">Unable to load dashboard data</p>}
    </div>
  )
}
