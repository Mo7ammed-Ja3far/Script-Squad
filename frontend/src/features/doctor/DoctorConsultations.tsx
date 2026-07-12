import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Stethoscope, Plus, X, Loader2, FileEdit, AlertTriangle,
  Heart, Scissors, Droplets, Pill, CalendarPlus
} from "lucide-react"
import { useAppointment, useCompleteConsultation, useEMR } from "@/hooks"
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { completeConsultationSchema, type CompleteConsultationFormValues } from "@/types/schemas"
import { getInitials, formatDate } from "@/utils/helpers"
import { toast } from "@/hooks/use-toast"
import { EditEMRDialog } from "./components/EditEMRDialog"
import { cn } from "@/lib/utils"

export default function DoctorConsultations() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const appointmentId = searchParams.get("appointmentId")
  const { data: appointment, isLoading: loadingApt } = useAppointment(appointmentId ?? "")
  const { data: emr, isLoading: loadingEMR } = useEMR(appointment?.patient._id ?? "")
  const { mutate: complete, isPending } = useCompleteConsultation()
  const [emrDialogOpen, setEmrDialogOpen] = useState(false)

  // Track follow-up date to show a warning if it matches the current appointment date
  const [followUpWarning, setFollowUpWarning] = useState("")

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CompleteConsultationFormValues>({
    resolver: zodResolver(completeConsultationSchema),
    defaultValues: {
      appointmentId: appointmentId ?? "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "", quantity: 1 }]
    },
  })

  const { fields: medFields, append: addMed, remove: removeMed } = useFieldArray({
    control, name: "medications"
  })

  const followUpDate = watch("followUpDate")

  // Warn the doctor if they pick the same date as today's appointment — backend's
  // slotConflict check will silently skip creating the follow-up in that case
  const checkFollowUpDate = (value: string) => {
    if (!value || !appointment) {
      setFollowUpWarning("")
      return
    }
    if (value === appointment.date) {
      setFollowUpWarning(
        `⚠ This is the same date as the current appointment (${appointment.date}). ` +
        `The follow-up will be skipped if that slot is already taken. Choose a different date.`
      )
    } else if (value < appointment.date) {
      setFollowUpWarning("⚠ Follow-up date is before today's appointment date.")
    } else {
      setFollowUpWarning("")
    }
  }

  const onSubmit = (data: CompleteConsultationFormValues) => {
    complete(data, {
      onSuccess: () => {
        toast.success("Consultation completed", "Patient notes saved, navigating back to queue…")
        navigate("/doctor/queue", { replace: true })
      },
      onError: (err: any) => toast.error("Failed to save", err?.message),
    })
  }

  if (loadingApt) return <LoadingSpinner />

  if (!appointment) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Consultations" />
        <EmptyState
          icon={Stethoscope}
          title="No appointment selected"
          description='Start an examination from the Queue page — click "Start Examination" on the active patient.'
        />
      </div>
    )
  }

  const { patient } = appointment

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title="Patient Consultation"
        description={`${patient.name} — ${appointment.date} at ${appointment.time}`}
      />

      {/* ── PATIENT + EMR PANEL ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{patient.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {patient.phone} · <span className="capitalize">{appointment.type}</span>
                </p>
              </div>
            </div>
            {/* ── EDIT EMR BUTTON ── */}
            <Button
              type="button"
              size="sm"
              variant="soft"
              onClick={() => setEmrDialogOpen(true)}
            >
              <FileEdit className="h-3.5 w-3.5 mr-1.5" />
              Edit medical record
            </Button>
          </div>
        </CardHeader>

        {/* EMR quick summary — shown whether or not we have data */}
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          {loadingEMR ? (
            <p className="text-xs text-muted-foreground">Loading medical history…</p>
          ) : !emr ? (
            <p className="text-xs text-muted-foreground italic">
              No medical record yet — click "Edit medical record" to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Vitals row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5 text-red-500" />
                  {emr.bloodType ?? "Blood type —"}
                </span>
                {emr.height && <span>{emr.height} cm</span>}
                {emr.weight && <span>{emr.weight} kg</span>}
              </div>

              {emr.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />Allergies
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {emr.allergies.map(a => (
                      <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {emr.chronicDiseases.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />Chronic Conditions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {emr.chronicDiseases.map(d => (
                      <Badge key={d} variant="warning" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {emr.surgicalHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1.5 flex items-center gap-1">
                    <Scissors className="h-3.5 w-3.5" />Surgical History
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {emr.surgicalHistory.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {emr.allergies.length === 0 && emr.chronicDiseases.length === 0 && emr.surgicalHistory.length === 0 && !emr.bloodType && (
                <p className="text-xs text-muted-foreground italic">No clinical alerts on record. Click "Edit medical record" to add.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CONSULTATION FORM ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register("appointmentId")} />

        {/* Diagnosis */}
        <div className="space-y-1.5">
          <Label htmlFor="diagnosis">Diagnosis <span className="text-destructive">*</span></Label>
          <Textarea
            id="diagnosis"
            placeholder="Patient's diagnosis and clinical findings…"
            rows={3}
            {...register("diagnosis")}
          />
          {errors.diagnosis && <p className="text-xs text-destructive">{errors.diagnosis.message}</p>}
        </div>

        {/* Medications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Medications <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addMed({ name: "", dosage: "", frequency: "", duration: "", quantity: 1 })}
            >
              <Plus className="h-4 w-4 mr-1.5" />Add medication
            </Button>
          </div>
          <div className="space-y-2">
            {medFields.map((field, i) => (
              <Card key={field.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Drug name</Label>
                      <Input placeholder="e.g. Amoxicillin" {...register(`medications.${i}.name`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dosage</Label>
                      <Input placeholder="e.g. 500mg" {...register(`medications.${i}.dosage`)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Frequency</Label>
                      <Input placeholder="e.g. 3x daily" {...register(`medications.${i}.frequency`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration</Label>
                      <Input placeholder="e.g. 7 days" {...register(`medications.${i}.duration`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="1" min={1}
                        {...register(`medications.${i}.quantity`, { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Special instructions (optional)"
                      className="flex-1"
                      {...register(`medications.${i}.instructions`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeMed(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes for patient <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes or lifestyle recommendations…"
            rows={2}
            {...register("notes")}
          />
        </div>

        {/* Follow-up date */}
        <div className="space-y-1.5">
          <Label htmlFor="followUpDate" className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-clinic-teal" />
            Follow-up appointment <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="followUpDate"
            type="date"
            {...register("followUpDate", {
              onChange: e => checkFollowUpDate(e.target.value)
            })}
          />
          <p className="text-xs text-muted-foreground">Leave blank if no follow-up is needed</p>
          {followUpWarning && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{followUpWarning}</p>
            </div>
          )}
        </div>

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            : "Complete Consultation & Return to Queue"
          }
        </Button>
      </form>

      {/* ── EMR EDIT DIALOG (doctor/admin only — backend enforces this) ── */}
      <EditEMRDialog
        open={emrDialogOpen}
        onOpenChange={setEmrDialogOpen}
        patientId={patient._id}
        patientName={patient.name}
        emr={emr}
      />
    </div>
  )
}
