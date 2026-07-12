import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/providers/AuthProvider"
import { useUpdateSchedule } from "@/hooks"
import { PageHeader } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { updateScheduleSchema, type UpdateScheduleFormValues } from "@/types/schemas"
import { DAY_NAMES } from "@/utils/helpers"
import { Loader2, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { WorkingHour } from "@/types"

/**
 * Default 7-day template used when a doctor has no workingHours saved yet.
 * Every entry ALWAYS carries valid HH:mm strings, even day-off ones,
 * because the backend's updateSchedule validator requires startTime/endTime
 * to match ^\d{2}:\d{2}$ on EVERY entry regardless of isDayOff.
 */
const DEFAULT_SCHEDULE: WorkingHour[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", slotDuration: 20, isDayOff: true },
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 20, isDayOff: false },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDuration: 20, isDayOff: false },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotDuration: 20, isDayOff: false },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDuration: 20, isDayOff: false },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", slotDuration: 20, isDayOff: false },
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", slotDuration: 20, isDayOff: false },
]

/**
 * Merge saved workingHours onto the 7-day template, keyed by dayOfWeek.
 * A new doctor gets workingHours: [] from the backend, so we show defaults.
 * An existing doctor's saved days override those defaults.
 *
 * FIXED: the old check was `user?.workingHours && user.workingHours.length > 0`
 * which treated an empty array (new doctor) as falsy and caused the template
 * to re-compute from `user?.workingHours ?? defaults` — but since
 * `user.workingHours` is `[]` (truthy but empty), the `??` never fired and
 * `defaultSchedule` became `[]`, showing nothing in the form.
 * We now always fall back to DEFAULT_SCHEDULE when the array is empty.
 */
function buildSchedule(saved?: WorkingHour[]): WorkingHour[] {
  if (!saved || saved.length === 0) return DEFAULT_SCHEDULE
  return DEFAULT_SCHEDULE.map(defaultDay => {
    const s = saved.find(d => d.dayOfWeek === defaultDay.dayOfWeek)
    if (!s) return defaultDay
    return {
      dayOfWeek: defaultDay.dayOfWeek,
      startTime: s.startTime || defaultDay.startTime,
      endTime: s.endTime || defaultDay.endTime,
      slotDuration: s.slotDuration ?? defaultDay.slotDuration,
      isDayOff: s.isDayOff ?? false,
    }
  })
}

/** Calculate slot count from HH:mm strings (e.g. "09:00" and "17:00") */
function calcSlots(start: string, end: string, duration: number): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  if (endMin <= startMin || duration <= 0) return 0
  return Math.floor((endMin - startMin) / duration)
}

export default function DoctorSchedule() {
  const { user } = useAuth()
  const { mutate: update, isPending } = useUpdateSchedule()

  const { register, control, handleSubmit, watch, reset } = useForm<UpdateScheduleFormValues>({
    resolver: zodResolver(updateScheduleSchema),
    defaultValues: { workingHours: DEFAULT_SCHEDULE },
  })

  const { fields } = useFieldArray({ control, name: "workingHours" })
  const hours = watch("workingHours")

  /**
   * Reset the form once the real user (and their saved workingHours) arrives.
   * useForm's defaultValues are read ONCE at mount — if user is null during
   * the initial render (session still restoring), the form stays empty until
   * we explicitly reset() after the data lands.
   */
  useEffect(() => {
    if (user) {
      reset({ workingHours: buildSchedule(user.workingHours) })
    }
  }, [user, reset])

  const onSubmit = (data: UpdateScheduleFormValues) => {
    // Sanitize before sending: day-off rows may have blank times in the form,
    // but the backend validator requires valid HH:mm on every entry.
    const sanitized: UpdateScheduleFormValues = {
      workingHours: data.workingHours.map((day, i) => ({
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime || DEFAULT_SCHEDULE[i].startTime!,
        endTime: day.endTime || DEFAULT_SCHEDULE[i].endTime!,
        slotDuration: day.slotDuration || 20,
        isDayOff: !!day.isDayOff,
      })),
    }

    update(sanitized, {
      onSuccess: () => toast.success("Schedule updated", "Your weekly availability is now live."),
      onError: (err: any) => toast.error("Couldn't save schedule", err?.message ?? "Check your working hours and try again."),
    })
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="My Schedule" description="Manage your working hours and slot availability" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, i) => {
          const isDayOff = hours[i]?.isDayOff
          const start = hours[i]?.startTime ?? ""
          const end = hours[i]?.endTime ?? ""
          const duration = hours[i]?.slotDuration ?? 20
          const slots = !isDayOff && start && end ? calcSlots(start, end, duration) : 0

          return (
            <Card key={field.id} className={cn("transition-opacity", isDayOff && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{DAY_NAMES[field.dayOfWeek]}</CardTitle>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`workingHours.${i}.isDayOff`)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-xs text-muted-foreground">Day off</span>
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Start time</Label>
                    <Input type="time" disabled={isDayOff} {...register(`workingHours.${i}.startTime`)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End time</Label>
                    <Input type="time" disabled={isDayOff} {...register(`workingHours.${i}.endTime`)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Slot duration (min)</Label>
                    <Input
                      type="number" min="5" max="120" disabled={isDayOff}
                      {...register(`workingHours.${i}.slotDuration`, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {!isDayOff && start && end && slots > 0 && (
                  <div className="mt-3 p-2 bg-clinic-blue-light rounded-lg border border-blue-100">
                    <p className="text-xs text-clinic-blue">
                      ✓ {slots} slots available ({start} – {end}, {duration} min each)
                    </p>
                  </div>
                )}

                {!isDayOff && start && end && slots === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    ⚠ End time must be after start time and duration must be &gt;0
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            : <><Check className="h-4 w-4 mr-2" />Save Schedule</>}
        </Button>
      </form>

      {/* Weekly summary */}
      <Card className="mt-6 bg-clinic-blue-light/50 border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Weekly summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Badge variant={h.isDayOff ? "secondary" : "info"} className="text-xs">
                  {DAY_NAMES[h.dayOfWeek ?? i].slice(0, 3)}
                </Badge>
                {!h.isDayOff && h.startTime && h.endTime && (
                  <span className="text-xs text-muted-foreground">
                    {h.startTime}–{h.endTime}
                    {h.slotDuration && (
                      <span className="ml-1 text-clinic-blue">
                        ({calcSlots(h.startTime, h.endTime, h.slotDuration)} slots)
                      </span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
