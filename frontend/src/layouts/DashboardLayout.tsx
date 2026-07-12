import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  HeartPulse, LayoutDashboard, Calendar, FileText, Pill, Users,
  LogOut, Menu, X, ChevronRight, Wifi, WifiOff, Bell,
  UserCircle, Stethoscope, ClipboardList, Activity, History
} from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { useSocket } from "@/providers/SocketProvider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getInitials } from "@/utils/helpers"
import type { UserRole } from "@/types"

interface NavItem { label: string; href: string; icon: React.ElementType; badge?: string }

const NAV: Record<UserRole, NavItem[]> = {
  patient: [
    { label: "Overview",        href: "/patient",               icon: LayoutDashboard },
    { label: "Book Appointment",href: "/patient/book",          icon: Calendar },
    { label: "My Appointments", href: "/patient/appointments",  icon: ClipboardList },
    { label: "Live Queue",      href: "/patient/queue",         icon: Activity },
    { label: "Medical Records", href: "/patient/emr",           icon: FileText },
    { label: "Prescriptions",   href: "/patient/prescriptions", icon: Pill },
  ],
  doctor: [
    { label: "Overview",            href: "/doctor",                    icon: LayoutDashboard },
    { label: "Patient Queue",       href: "/doctor/queue",              icon: Activity },
    { label: "Appointments",        href: "/doctor/appointments",       icon: Calendar },
    { label: "Consultations",       href: "/doctor/consultations",      icon: Stethoscope },
    { label: "History",             href: "/doctor/history",            icon: History },
    { label: "Schedule",            href: "/doctor/schedule",           icon: ClipboardList },
  ],
  admin: [
    { label: "Dashboard",    href: "/admin",               icon: LayoutDashboard },
    { label: "Users",        href: "/admin/users",         icon: Users },
    { label: "Appointments", href: "/admin/appointments",  icon: Calendar },
    { label: "System Health",href: "/admin/health",        icon: Activity },
  ],
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { isConnected, status } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return null
  const navItems = NAV[user.role]

  const handleLogout = async () => {
    await logout()
    navigate("/auth/login", { replace: true })
  }

  const connectionDot = isConnected
    ? "bg-emerald-500"
    : status === "no-token"
    ? "bg-amber-400"
    : "bg-muted-foreground"

  const connectionTitle = isConnected
    ? "Live"
    : status === "no-token"
    ? "Real-time unavailable — sign in again"
    : "Offline"

  const ConnectionBadge = () => (
    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
      {isConnected ? (
        <><Wifi className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">Live</span></>
      ) : status === "no-token" ? (
        <><WifiOff className="h-3.5 w-3.5 text-amber-500" /><span className="text-amber-600">Real-time unavailable</span></>
      ) : (
        <><WifiOff className="h-3.5 w-3.5" /><span>Offline</span></>
      )}
    </div>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-sm">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">ClinicFlow</span>
        </Link>
      </div>

      <Separator />

      {/* User card */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <div
            className={cn("w-2 h-2 rounded-full shrink-0", connectionDot)}
            title={connectionTitle}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active =
            location.pathname === item.href ||
            (item.href !== `/${user.role}` && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "gradient-brand text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="info" className="text-xs px-1.5 py-0">{item.badge}</Badge>
              )}
              {active && <ChevronRight className="h-3 w-3 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-4" />

      {/* Bottom */}
      <div className="p-3 space-y-0.5">
        <Link
          to={`/${user.role}/profile`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <UserCircle className="h-4 w-4" />
          <span>Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-border shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-border"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 lg:ml-60 xl:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <ConnectionBadge />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
