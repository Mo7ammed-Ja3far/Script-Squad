import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Loader2, MessageCircle, RefreshCw } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { useVerifyOtp, useResendOtp, useLogin } from "@/hooks"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { OtpPurpose, UserRole } from "@/types"

const DASH: Record<UserRole, string> = { patient: "/patient", doctor: "/doctor", admin: "/admin" }

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { whatsappNumber?: string; purpose?: OtpPurpose } | null
  const whatsappNumber = state?.whatsappNumber ?? ""
  const purpose = state?.purpose ?? "registration"

  const [digits, setDigits] = useState(Array(6).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { mutate: verify, isPending } = useVerifyOtp()
  const { mutate: resend, isPending: resending } = useResendOtp()
  const { mutate: login } = useLogin()
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (!whatsappNumber) navigate("/auth/login", { replace: true })
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every(d => d !== "")) submitOtp(next.join(""))
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(""))
      submitOtp(text)
    }
  }

  const submitOtp = (code: string) => {
    verify({ whatsappNumber, code, purpose }, {
      onSuccess: ({ data }) => {
        if (purpose === "registration" && data?.user) {
          login({ email: "", password: "" } as any, {
            onSettled: () => navigate("/auth/login"),
          })
          toast.success("Account verified!", "Please sign in to continue.")
          navigate("/auth/login")
        } else if (purpose === "password_reset") {
          navigate("/auth/reset-password", { state: { whatsappNumber, code } })
        }
      },
      onError: (err: any) => {
        toast.error("Invalid OTP", err?.message)
        setDigits(Array(6).fill(""))
        inputRefs.current[0]?.focus()
      },
    })
  }

  const handleResend = () => {
    resend({ whatsappNumber, purpose }, {
      onSuccess: () => setCountdown(60),
    })
  }

  return (
    <AuthLayout>
      <div className="space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center shadow-glass">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold">Check WhatsApp</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-foreground">{whatsappNumber}</span>
          </p>
        </div>

        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={cn(
                "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all duration-200 outline-none",
                d ? "border-clinic-blue bg-clinic-blue-light text-clinic-blue" : "border-border focus:border-clinic-blue"
              )}
            />
          ))}
        </div>

        {isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
          </div>
        )}

        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={handleResend}
            disabled={countdown > 0 || resending} className="text-clinic-blue">
            <RefreshCw className={cn("h-4 w-4 mr-2", resending && "animate-spin")} />
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Wrong number?{" "}
            <button onClick={() => navigate("/auth/register")} className="text-clinic-blue hover:underline">
              Go back
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
