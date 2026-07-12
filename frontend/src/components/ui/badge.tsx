import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "gradient-brand text-white",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-red-100 text-red-700",
        outline: "text-foreground border border-border",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-700",
        info: "bg-clinic-blue-light text-clinic-blue",
        teal: "bg-clinic-teal-light text-clinic-teal-dark",
        pending: "bg-amber-100 text-amber-700",
        confirmed: "bg-clinic-blue-light text-clinic-blue",
        completed: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-red-100 text-red-700",
        rescheduled: "bg-purple-100 text-purple-700",
        waiting: "bg-amber-100 text-amber-700",
        "in-progress": "bg-clinic-teal-light text-clinic-teal-dark",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
export { Badge, badgeVariants }
