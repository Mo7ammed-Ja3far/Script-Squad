import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, User, Stethoscope } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegister } from "@/hooks";
import { registerSchema, type RegisterFormValues } from "@/types/schemas";
import { DEPARTMENTS } from "@/utils/helpers";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Role = "patient" | "doctor";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("patient");
  const [showPw, setShowPw] = useState(false);
  const { mutate: register_, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "patient" },
  });

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setValue("role", r);
  };

  const onSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...payload } = data;
    register_(payload as any, {
      onSuccess: () => {
        toast.success("Account created!", "Check WhatsApp for your OTP.");
        navigate("/auth/verify-otp", {
          state: {
            whatsappNumber: payload.whatsappNumber,
            purpose: "registration",
          },
        });
      },
      onError: (err: any) => toast.error("Registration failed", err?.message),
    });
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-display font-bold">Create account</h2>
          <p className="text-muted-foreground mt-1.5">
            Join ClinicFlow to manage your healthcare
          </p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["patient", "Patient", User],
              ["doctor", "Doctor", Stethoscope],
            ] as const
          ).map(([r, label, Icon]) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSelect(r)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                role === r
                  ? "border-clinic-blue bg-clinic-blue-light"
                  : "border-border hover:border-clinic-blue/40",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  role === r ? "text-clinic-blue" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  role === r ? "text-clinic-blue" : "text-foreground",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input placeholder="Dr. Ahmed Karim" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>WhatsApp number</Label>
            <Input placeholder="01234567890" {...register("whatsappNumber")} />
            {errors.whatsappNumber && (
              <p className="text-xs text-destructive">
                {errors.whatsappNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {role === "doctor" && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-sm font-semibold text-muted-foreground">
                Doctor information
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select onValueChange={(v) => setValue("department", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-xs text-destructive">
                      {errors.department.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Specialization</Label>
                  <Input
                    placeholder="e.g. Interventional"
                    {...register("specialization")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Consultation fee (EGP)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    {...register("consultationFee", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Years experience</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    {...register("experienceYears", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-clinic-blue font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
