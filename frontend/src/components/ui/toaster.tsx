import { useToast } from "@/hooks/use-toast"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
  destructive: <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
  info: <Info className="h-5 w-5 text-clinic-blue shrink-0 mt-0.5" />,
  default: <Info className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />,
}

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          {icons[(variant as keyof typeof icons) ?? "default"]}
          <div className="flex-1 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
