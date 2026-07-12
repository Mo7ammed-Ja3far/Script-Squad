import { useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import { useEMR } from "@/hooks"
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, AlertTriangle, Heart, Scissors, Clock, Pill, ChevronDown, ChevronUp } from "lucide-react"
import { formatDate } from "@/utils/helpers"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function TagList({ items, variant = "info", emptyText = "None recorded" }: {
  items: string[]; variant?: string; emptyText?: string
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">{emptyText}</p>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <Badge key={item} variant={variant as any} className="text-sm px-3 py-1">{item}</Badge>
      ))}
    </div>
  )
}

function HistoryEntry({ entry, index }: { entry: any; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className="relative pl-6">
      {/* Timeline dot & line */}
      <div className="absolute left-0 top-3 w-3 h-3 rounded-full gradient-brand" />
      <div className="absolute left-[5px] top-6 bottom-0 w-0.5 bg-border" />

      <div className="ml-4 pb-6">
        <button className="w-full text-left" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white border border-border hover:border-clinic-blue/30 transition-colors shadow-card">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{entry.diagnosis}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Dr. {entry.doctor?.name} · {formatDate(entry.appointment?.date ?? entry.date)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {entry.prescription && <Badge variant="teal" className="text-xs">Rx</Badge>}
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        {expanded && entry.prescription && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mt-2 ml-3 p-3 bg-clinic-teal-light rounded-xl border border-teal-100">
            <p className="text-xs font-semibold text-clinic-teal-dark mb-2 flex items-center gap-1">
              <Pill className="h-3.5 w-3.5" />Prescription
            </p>
            <div className="space-y-1.5">
              {entry.prescription.medications?.map((med: any, i: number) => (
                <div key={i} className="text-xs text-foreground">
                  <span className="font-medium">{med.name}</span>
                  <span className="text-muted-foreground"> — {med.dosage}, {med.frequency} for {med.duration}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default function PatientEMR() {
  const { user } = useAuth()
  const { data: emr, isLoading } = useEMR(user?._id ?? "")

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl">
      <PageHeader title="Medical Records" description="Your complete health history" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Blood Type", value: emr?.bloodType ?? "—", color: "text-red-600", bg: "bg-red-50" },
          { label: "Height", value: emr?.height ? `${emr.height} cm` : "—", color: "text-clinic-blue", bg: "bg-clinic-blue-light" },
          { label: "Weight", value: emr?.weight ? `${emr.weight} kg` : "—", color: "text-clinic-teal", bg: "bg-clinic-teal-light" },
          { label: "Visits", value: emr?.history?.length ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(stat => (
          <div key={stat.label} className={cn("rounded-2xl p-4 border border-border", stat.bg)}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={cn("text-xl font-display font-bold mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Visit History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />Allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TagList items={emr?.allergies ?? []} variant="destructive" emptyText="No allergies recorded" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-clinic-blue" />Chronic Diseases
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TagList items={emr?.chronicDiseases ?? []} variant="warning" emptyText="No chronic conditions recorded" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-purple-600" />Surgical History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TagList items={emr?.surgicalHistory ?? []} variant="secondary" emptyText="No surgeries recorded" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {!emr?.history?.length ? (
            <EmptyState icon={Clock} title="No visits yet" description="Your consultation history will appear here" />
          ) : (
            <div className="relative">
              {emr.history.map((entry, i) => (
                <HistoryEntry key={entry._id ?? i} entry={entry} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
