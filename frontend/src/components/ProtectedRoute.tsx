import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/providers/AuthProvider"
import type { UserRole } from "@/types"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center animate-pulse-slow">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading ClinicFlow…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    const dashMap: Record<UserRole, string> = {
      patient: "/patient",
      doctor: "/doctor",
      admin: "/admin",
    }
    return <Navigate to={dashMap[user.role]} replace />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return null

  if (isAuthenticated && user) {
    const dashMap: Record<UserRole, string> = {
      patient: "/patient",
      doctor: "/doctor",
      admin: "/admin",
    }
    return <Navigate to={dashMap[user.role]} replace />
  }

  return <>{children}</>
}
