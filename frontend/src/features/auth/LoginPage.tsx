import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useResendOtp } from "@/hooks";
import { loginSchema, type LoginFormValues } from "@/types/schemas";
import { normalizeEgyptianPhone } from "@/types/schemas";
import { toast } from "@/hooks/use-toast";
import type { UserRole } from "@/types";

const DASH: Record<UserRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/admin",
};

/**
 * Login page — handles three states:
 *
 * 1. Normal login form
 * 2. Unverified-account recovery:
 *    The backend returns 403 with "Account is not verified…" when a
 *    registered but unverified user tries to log in.  Instead of a
 *    generic error toast, we surface an inline panel that lets them
 *    enter their WhatsApp number, triggers a resend, and redirects to
 *    the OTP verification screen — no dead end.
 * 3. Session-expired banner (from ?expired=true redirect)
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname;
  const [showPw, setShowPw] = useState(false);

  // ── Unverified-account recovery state ──
  const [unverifiedMode, setUnverifiedMode] = useState(false);
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const [whatsappError, setWhatsappError] = useState("");

  const { mutate: login, isPending } = useLogin();
  const { mutate: resendOtp, isPending: resending } = useResendOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data, {
      onSuccess: ({ data: res }) => {
        if (res?.user) {
          const dest =
            from && !from.startsWith("/auth") ? from : DASH[res.user.role];
          navigate(dest, { replace: true });
        }
      },
      onError: (err: any) => {
        // Detect the specific unverified-account 403 and switch to
        // recovery mode instead of showing a generic error toast.
        const isUnverified =
          err?.status === 403 ||
          (typeof err?.message === "string" &&
            err.message.toLowerCase().includes("not verified"));
        if (isUnverified) {
          setUnverifiedMode(true);
        } else {
          toast.error("Login failed", err?.message);
        }
      },
    });
  };

  const handleResendForUnverified = () => {
    const normalized = normalizeEgyptianPhone(whatsappDraft.trim());
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setWhatsappError("رقم الهاتف غير صحيح — اكتبه بدءاً من 01 أو +20");
      return;
    }
    setWhatsappError("");
    resendOtp(
      { whatsappNumber: normalized, purpose: "registration" },
      {
        onSuccess: () => {
          toast.success(
            "OTP sent",
            "Check your WhatsApp for the verification code",
          );
          navigate("/auth/verify-otp", {
            state: { whatsappNumber: normalized, purpose: "registration" },
          });
        },
        onError: (err: any) => {
          // "Account is already verified" means they can just log in — shouldn't happen here,
          // but handle gracefully anyway.
          if (
            typeof err?.message === "string" &&
            err.message.includes("already verified")
          ) {
            toast.info(
              "Account already verified",
              "Please sign in with your password.",
            );
            setUnverifiedMode(false);
          } else {
            toast.error("Could not resend OTP", err?.message);
          }
        },
      },
    );
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Welcome back
          </h2>
          <p className="text-muted-foreground mt-1.5">
            Sign in to your ClinicFlow account
          </p>
        </div>

        {/* Session-expired banner */}
        {location.search.includes("expired=true") && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            Your session expired. Please sign in again.
          </div>
        )}

        {/* ── UNVERIFIED-ACCOUNT RECOVERY PANEL ── */}
        {unverifiedMode ? (
          <div className="space-y-5">
            <div className="p-4 bg-clinic-blue-light border border-blue-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-clinic-blue shrink-0" />
                <p className="text-sm font-semibold text-clinic-blue">
                  Account not verified yet
                </p>
              </div>
              <p className="text-xs text-clinic-blue/80 leading-relaxed">
                Your account exists but hasn't been verified via WhatsApp OTP.
                Enter your WhatsApp number below to resend the code.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>WhatsApp number</Label>
              <Input
                placeholder="01012345678 أو +201012345678"
                value={whatsappDraft}
                onChange={(e) => {
                  setWhatsappDraft(e.target.value);
                  setWhatsappError("");
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleResendForUnverified()
                }
              />
              <p className="text-xs text-muted-foreground"></p>
              {whatsappError && (
                <p className="text-xs text-destructive">{whatsappError}</p>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleResendForUnverified}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Send verification code
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setUnverifiedMode(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to login
            </button>
          </div>
        ) : (
          /* ── NORMAL LOGIN FORM ── */
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-clinic-blue hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/auth/register"
                className="text-clinic-blue font-medium hover:underline"
              >
                Create account
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
