import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: "blue" | "teal" | "amber" | "emerald" | "red" | "purple"
  delta?: string
  deltaPositive?: boolean
  delay?: number
}

const colorMap = {
  blue: { bg: "bg-clinic-blue-light", icon: "text-clinic-blue", border: "border-blue-100" },
  teal: { bg: "bg-clinic-teal-light", icon: "text-clinic-teal", border: "border-teal-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
  red: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
}

export function StatCard({ label, value, icon: Icon, color = "blue", delta, deltaPositive, delay = 0 }: StatCardProps) {
  const c = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-shadow", c.border)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-display font-bold mt-1 text-foreground">{value}</p>
          {delta && (
            <p className={cn("text-xs mt-1 font-medium", deltaPositive ? "text-emerald-600" : "text-red-500")}>
              {deltaPositive ? "↑" : "↓"} {delta}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon className={cn("h-5 w-5", c.icon)} />
        </div>
      </div>
    </motion.div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 gradient-brand-subtle rounded-2xl flex items-center justify-center mb-4 border border-clinic-blue/10">
        <Icon className="h-7 w-7 text-clinic-blue/60" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div className="w-8 h-8 border-2 border-clinic-blue/20 border-t-clinic-blue rounded-full animate-spin" />
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message ?? "Something went wrong."}</p>
      {onRetry && <button onClick={onRetry} className="text-xs text-clinic-blue hover:underline">Try again</button>}
    </div>
  )
}
