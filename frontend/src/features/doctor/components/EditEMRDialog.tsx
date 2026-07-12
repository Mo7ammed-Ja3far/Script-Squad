import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Save, AlertTriangle, Heart, Scissors, Droplets, Ruler, Weight, FileEdit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TagEditor } from "./TagEditor"
import { useUpdateEMR } from "@/hooks"
import { toast } from "@/hooks/use-toast"
import type { EMR, BloodType } from "@/types"

const BLOOD_TYPES: NonNullable<BloodType>[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

interface EditEMRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientName: string
  emr?: EMR
}

interface EMRFormState {
  bloodType: BloodType
  height: string
  weight: string
  allergies: string[]
  chronicDiseases: string[]
  surgicalHistory: string[]
}

const toFormState = (emr?: EMR): EMRFormState => ({
  bloodType: emr?.bloodType ?? null,
  height: emr?.height != null ? String(emr.height) : "",
  weight: emr?.weight != null ? String(emr.weight) : "",
  allergies: emr?.allergies ?? [],
  chronicDiseases: emr?.chronicDiseases ?? [],
  surgicalHistory: emr?.surgicalHistory ?? [],
})

export function EditEMRDialog({ open, onOpenChange, patientId, patientName, emr }: EditEMRDialogProps) {
  const [form, setForm] = useState<EMRFormState>(toFormState(emr))
  const { mutate: updateEMR, isPending } = useUpdateEMR(patientId)

  // Re-sync whenever the dialog opens or the underlying EMR data changes
  useEffect(() => {
    if (open) setForm(toFormState(emr))
  }, [open, emr])

  const handleSave = () => {
    const heightNum = form.height ? Number(form.height) : undefined
    const weightNum = form.weight ? Number(form.weight) : undefined

    // Backend requires height/weight to be positive numbers (z.number().positive())
    if ((heightNum !== undefined && (!Number.isFinite(heightNum) || heightNum <= 0)) ||
        (weightNum !== undefined && (!Number.isFinite(weightNum) || weightNum <= 0))) {
      toast.error("Invalid measurement", "Height and weight must be positive numbers.")
      return
    }

    updateEMR(
      {
        // Backend's updateEMR schema: bloodType is enum().optional() — send undefined not null
        bloodType: form.bloodType ?? undefined,
        height: heightNum,
        weight: weightNum,
        allergies: form.allergies,
        chronicDiseases: form.chronicDiseases,
        surgicalHistory: form.surgicalHistory,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-clinic-blue" />
            Edit Medical Record
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Updating clinical profile for{" "}
            <span className="font-medium text-foreground">{patientName}</span>
          </p>
        </DialogHeader>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 py-2">
          {/* Vitals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-red-500" />Blood type
              </Label>
              <Select
                value={form.bloodType ?? undefined}
                onValueChange={v => setForm(f => ({ ...f, bloodType: v as BloodType }))}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-clinic-blue" />Height (cm)
              </Label>
              <Input type="number" className="h-9" placeholder="170"
                value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Weight className="h-3.5 w-3.5 text-clinic-teal" />Weight (kg)
              </Label>
              <Input type="number" className="h-9" placeholder="70"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>

          <Separator />

          {/* Allergies */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-4 w-4" />Allergies
            </Label>
            <TagEditor
              items={form.allergies}
              onChange={items => setForm(f => ({ ...f, allergies: items }))}
              placeholder="e.g. Penicillin — press Enter to add"
              variant="destructive"
              emptyText="No allergies recorded"
            />
          </div>

          {/* Chronic diseases */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5 text-amber-600">
              <Heart className="h-4 w-4" />Chronic Diseases
            </Label>
            <TagEditor
              items={form.chronicDiseases}
              onChange={items => setForm(f => ({ ...f, chronicDiseases: items }))}
              placeholder="e.g. Type 2 Diabetes — press Enter to add"
              variant="warning"
              emptyText="No chronic conditions recorded"
            />
          </div>

          {/* Surgical history */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5 text-purple-600">
              <Scissors className="h-4 w-4" />Surgical History
            </Label>
            <TagEditor
              items={form.surgicalHistory}
              onChange={items => setForm(f => ({ ...f, surgicalHistory: items }))}
              placeholder="e.g. Appendectomy 2019 — press Enter to add"
              variant="secondary"
              emptyText="No surgeries recorded"
            />
          </div>
        </motion.div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Save className="h-4 w-4 mr-2" />}
            Save medical record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
