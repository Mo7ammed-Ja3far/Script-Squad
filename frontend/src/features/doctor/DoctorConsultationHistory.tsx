import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Pill,
  Calendar,
  User,
  FileText,
  Search,
} from "lucide-react";
import { useAppointments, useAppointment } from "@/hooks";
import {
  PageHeader,
  LoadingSpinner,
  EmptyState,
} from "@/components/ui/dashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials } from "@/utils/helpers";
import type { Appointment } from "@/types";
function ConsultationDetail({
  appointmentId,
  patientId,
}: {
  appointmentId: string;
  patientId: string;
}) {
  const { data: apt, isLoading } = useAppointment(appointmentId);
  const navigate = useNavigate();

  if (isLoading)
    return (
      <div className="py-3 px-4 text-xs text-muted-foreground">
        Loading details…
      </div>
    );
  if (!apt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-border"
    >
      <div className="p-4 space-y-3 bg-muted/30">
        {/* Basic info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium mt-0.5">{formatDate(apt.date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Time</p>
            <p className="font-medium mt-0.5">{apt.time}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium mt-0.5 capitalize">{apt.type}</p>
          </div>
        </div>

        {apt.notes && (
          <>
            <Separator />
            <div className="text-xs">
              <p className="text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="h-3.5 w-3.5" />
                Patient notes
              </p>
              <p className="text-foreground">{apt.notes}</p>
            </div>
          </>
        )}

        {/* Link to full EMR — diagnosis and prescription live in the EMR history */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              navigate(`/doctor/consultations?appointmentId=${apt._id}`)
            }
            className="text-xs text-clinic-blue hover:underline"
          >
            Open consultation form →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Single row card in the history list
function ConsultationRow({ apt }: { apt: Appointment }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(apt.patient.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {apt.patient.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(apt.date)} at {apt.time}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="completed" className="text-xs capitalize">
                {apt.status}
              </Badge>
              <Badge
                variant={apt.type === "follow-up" ? "teal" : "info"}
                className="text-xs capitalize"
              >
                {apt.type}
              </Badge>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      <AnimatePresence>
        {expanded && (
          <ConsultationDetail
            key="detail"
            appointmentId={apt._id}
            patientId={apt.patient._id}
          />
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function DoctorConsultationHistory() {
  const [search, setSearch] = useState("");

  // GET /api/appointments?status=completed — returns all the doctor's completed appointments
  // (backend's listAppointments applies filter.doctor = userId for the doctor role)
  const { data, isLoading } = useAppointments({
    status: "completed",
    limit: 50,
  });
  const appointments = data?.appointments ?? [];

  const filtered = appointments.filter(
    (apt) =>
      !search ||
      apt.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      apt.date.includes(search),
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Consultation History"
        description="Your past completed consultations"
      />

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name or date…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={search ? "No matches" : "No consultations yet"}
          description={
            search
              ? "Try a different name or date"
              : "Completed consultations will appear here after you finish them from the queue."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <ConsultationRow key={apt._id} apt={apt} />
          ))}
        </div>
      )}
    </div>
  );
}
