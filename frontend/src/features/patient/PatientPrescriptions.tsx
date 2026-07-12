import { useAuth } from "@/providers/AuthProvider"
import { usePrescriptions } from "@/hooks"
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/ui/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pill, Calendar, User } from "lucide-react"
import { formatDate } from "@/utils/helpers"
import { motion } from "framer-motion"

export default function PatientPrescriptions() {
  const { user } = useAuth()
  const { data, isLoading } = usePrescriptions(user?._id ?? "")
  const prescriptions = data?.prescriptions ?? []

  return (
    <div className="max-w-3xl">
      <PageHeader title="Prescriptions" description="Your medication history" />

      {isLoading ? <LoadingSpinner /> : prescriptions.length === 0 ? (
        <EmptyState icon={Pill} title="No prescriptions yet" description="Prescriptions from your consultations will appear here" />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx, i) => (
            <motion.div key={rx._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Pill className="h-4 w-4 text-clinic-teal" />
                        Prescription #{rx._id.slice(-6).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />Dr. {rx.doctor.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />{formatDate(rx.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={rx.isActive ? "teal" : "secondary"}>
                      {rx.isActive ? "Active" : "Past"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {rx.medications.map((med, j) => (
                      <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="w-7 h-7 bg-clinic-teal-light rounded-lg flex items-center justify-center shrink-0">
                          <Pill className="h-3.5 w-3.5 text-clinic-teal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{med.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {med.dosage} · {med.frequency} · {med.duration}
                            {med.quantity && ` · Qty: ${med.quantity}`}
                          </p>
                          {med.instructions && (
                            <p className="text-xs text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded-lg">
                              ⚠ {med.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {rx.notes && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t italic">
                      Note: {rx.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
