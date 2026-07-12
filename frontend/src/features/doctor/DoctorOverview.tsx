import { Link } from "react-router-dom"
import { Activity, Calendar, CheckCircle2, Users, ChevronRight, Clock } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { useDoctorStats, useMyQueue } from "@/hooks"
import { StatCard, PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/utils/helpers"
import { format } from "date-fns"

export default function DoctorOverview() {
  const { user } = useAuth()
  const { data: stats, isLoading: loadingStats } = useDoctorStats()
  const { data: queue, isLoading: loadingQueue } = useMyQueue()

  const today = format(new Date(), "EEEE, MMMM d")
  const activeQueue = queue?.queue?.filter(e => ["waiting", "in-progress"].includes(e.status)) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, Dr. ${user?.name.split(" ").slice(-1)[0]} 👨‍⚕️`}
        description={today}
      >
        <Button asChild size="sm" variant="teal">
          <Link to="/doctor/queue"><Activity className="h-4 w-4 mr-1.5" />Open Queue</Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      {loadingStats ? <LoadingSpinner /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today" value={stats?.today ?? 0} icon={Calendar} color="blue" delay={0} />
          <StatCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} color="teal" delay={0.05} />
          <StatCard label="Pending" value={stats?.pending ?? 0} icon={Clock} color="amber" delay={0.1} />
          <StatCard label="Total" value={stats?.total ?? 0} icon={Users} color="emerald" delay={0.15} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Live queue snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-clinic-teal" />Today's Queue
                {queue?.summary && (
                  <Badge variant="teal" className="text-xs ml-1">{queue.summary.waiting} waiting</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/doctor/queue" className="text-clinic-blue text-xs">
                  Manage <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingQueue ? <LoadingSpinner /> : activeQueue.length === 0 ? (
              <EmptyState icon={Users} title="Queue is empty" description="Patients will appear here when they join" />
            ) : (
              <div className="space-y-2">
                {activeQueue.slice(0, 5).map(entry => (
                  <div key={entry._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                      #{entry.queueNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.patient.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.appointment.time} · {entry.appointment.type}</p>
                    </div>
                    <Badge variant={entry.status === "in-progress" ? "in-progress" : "waiting"} className="text-xs shrink-0">
                      {entry.status === "in-progress" ? "Active" : "Waiting"}
                    </Badge>
                  </div>
                ))}
                {activeQueue.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{activeQueue.length - 5} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Manage Queue", href: "/doctor/queue", icon: Activity, color: "bg-clinic-teal-light text-clinic-teal" },
                { label: "Appointments", href: "/doctor/appointments", icon: Calendar, color: "bg-clinic-blue-light text-clinic-blue" },
                { label: "Consultations", href: "/doctor/consultations", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
                { label: "My Schedule", href: "/doctor/schedule", icon: Clock, color: "bg-purple-50 text-purple-600" },
              ].map(item => (
                <Link key={item.href} to={item.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-clinic-blue/30 hover:shadow-card transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
