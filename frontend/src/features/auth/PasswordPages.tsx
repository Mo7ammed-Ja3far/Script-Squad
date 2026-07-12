import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForgotPassword, useResetPassword } from "@/hooks"
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormValues, type ResetPasswordFormValues } from "@/types/schemas"
import { toast } from "@/hooks/use-toast"

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { mutate, isPending } = useForgotPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordFormValues) => {
    mutate(data, {
      onSuccess: () => navigate("/auth/verify-otp", {
        state: { whatsappNumber: data.whatsappNumber, purpose: "password_reset" }
      }),
      onError: (err: any) => toast.error("Failed", err?.message),
    })
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Reset password</h2>
          <p className="text-muted-foreground mt-1.5">Enter your WhatsApp number to receive a reset code</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label>WhatsApp number</Label>
            <Input placeholder="01012345678 أو +201012345678" {...register("whatsappNumber")} />
            <p className="text-xs text-muted-foreground">اكتب رقمك — سيتم إضافة كود الدولة تلقائياً</p>
            {errors.whatsappNumber && <p className="text-xs text-destructive">{errors.whatsappNumber.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : "Send reset code"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth/login" className="text-clinic-blue font-medium hover:underline">← Back to login</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { whatsappNumber?: string; code?: string } | null
  const [showPw, setShowPw] = useState(false)
  const { mutate, isPending } = useResetPassword()

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { whatsappNumber: state?.whatsappNumber ?? "", code: state?.code ?? "" },
  })

  const onSubmit = (data: ResetPasswordFormValues) => {
    mutate(data, {
      onSuccess: () => navigate("/auth/login"),
      onError: (err: any) => toast.error("Failed", err?.message),
    })
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Set new password</h2>
          <p className="text-muted-foreground mt-1.5">Create a strong new password for your account</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {!state?.code && (
            <div className="space-y-1.5">
              <Label>OTP code</Label>
              <Input placeholder="123456" {...register("code")} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>New password</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="Min 8 chars…" className="pr-10" {...register("newPassword")} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</> : "Update password"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
