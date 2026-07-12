import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  ChevronRight,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Clock,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useDoctors, useAvailability, useBookAppointment } from "@/hooks";
import {
  PageHeader,
  LoadingSpinner,
  EmptyState,
} from "@/components/ui/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DEPARTMENTS, formatCurrency, getInitials } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import type { User, AppointmentType } from "@/types";

type Step = "browse" | "slot" | "confirm";

export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("browse");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [aptType, setAptType] = useState<AppointmentType>("regular");
  const [notes, setNotes] = useState("");

  const { data: doctorsData, isLoading } = useDoctors({
    department: department !== "all" ? department : undefined,
  });
  const doctors = (doctorsData?.doctors ?? []).filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase()),
  );

  const { data: availability, isLoading: loadingSlots } = useAvailability(
    selectedDoctor?._id ?? "",
    selectedDate,
  );
  const { mutate: book, isPending: booking } = useBookAppointment();

  // Next 7 days for date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      value: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE"),
      day: format(d, "d"),
      month: format(d, "MMM"),
    };
  });

  const handleSelectDoctor = (doctor: User) => {
    setSelectedDoctor(doctor);
    setSelectedTime("");
    setStep("slot");
  };

  const handleBook = () => {
    if (!selectedDoctor || !selectedTime) return;
    book(
      {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        time: selectedTime,
        type: aptType,
        notes,
      },
      { onSuccess: () => navigate("/patient/appointments") },
    );
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-6">
      {(["browse", "slot", "confirm"] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              step === s
                ? "gradient-brand text-white"
                : ["browse", "slot", "confirm"].indexOf(step) > i
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {["browse", "slot", "confirm"].indexOf(step) > i ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          <span
            className={cn(
              "text-xs font-medium hidden sm:block",
              step === s ? "text-clinic-blue" : "text-muted-foreground",
            )}
          >
            {s === "browse"
              ? "Choose Doctor"
              : s === "slot"
                ? "Pick Slot"
                : "Confirm"}
          </span>
          {i < 2 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl w-full overflow-x-hidden pb-4">
      {" "}
      <PageHeader
        title="Book Appointment"
        description="Find a specialist and schedule your visit"
      />
      <StepIndicator />
      <AnimatePresence mode="wait">
        {step === "browse" && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors or specializations…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <LoadingSpinner />
            ) : doctors.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No doctors found"
                description="Try a different search or department"
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {doctors.map((doc) => (
                  <motion.div
                    key={doc._id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-card-hover transition-shadow"
                      onClick={() => handleSelectDoctor(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {getInitials(doc.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.specialization}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="info" className="text-xs">
                                {doc.department}
                              </Badge>
                              {doc.experienceYears && (
                                <span className="text-xs text-muted-foreground">
                                  {doc.experienceYears}y exp
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-clinic-blue">
                              {doc.consultationFee
                                ? formatCurrency(doc.consultationFee)
                                : "—"}
                            </p>
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs text-muted-foreground">
                                4.8
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === "slot" && selectedDoctor && (
          <motion.div
            key="slot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Doctor summary */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(selectedDoctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{selectedDoctor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDoctor.department} ·{" "}
                    {selectedDoctor.specialization}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("browse")}
                >
                  Change
                </Button>
              </CardContent>
            </Card>

            {/* Date picker */}
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-clinic-blue" />
                Select Date
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {dates.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setSelectedDate(d.value);
                      setSelectedTime("");
                    }}
                    className={cn(
                      "flex flex-col items-center min-w-[56px] p-2.5 rounded-xl border-2 transition-all shrink-0",
                      selectedDate === d.value
                        ? "border-clinic-blue gradient-brand text-white"
                        : "border-border hover:border-clinic-blue/40",
                    )}
                  >
                    <span className="text-xs opacity-80">{d.label}</span>
                    <span className="text-lg font-bold leading-none">
                      {d.day}
                    </span>
                    <span className="text-xs opacity-80">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-clinic-blue" />
                Available Slots
              </p>
              {loadingSlots ? (
                <LoadingSpinner />
              ) : !availability?.data?.available ? (
                <p className="text-sm text-muted-foreground">
                  No available slots for this date.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availability.data?.slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        "py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all",
                        !slot.available &&
                          "opacity-40 cursor-not-allowed border-border bg-muted text-muted-foreground",
                        slot.available &&
                          selectedTime === slot.time &&
                          "gradient-brand text-white border-transparent",
                        slot.available &&
                          selectedTime !== slot.time &&
                          "border-border hover:border-clinic-blue text-foreground",
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <p className="text-sm font-semibold mb-3">Appointment type</p>
              <div className="flex gap-3">
                {(["regular", "follow-up"] as AppointmentType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAptType(t)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm border-2 font-medium transition-all capitalize",
                      aptType === t
                        ? "border-clinic-blue bg-clinic-blue-light text-clinic-blue"
                        : "border-border hover:border-clinic-blue/40",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              disabled={!selectedTime}
              onClick={() => setStep("confirm")}
              className="w-full sm:w-auto"
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {step === "confirm" && selectedDoctor && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="max-w-lg">
              <CardContent className="p-6 space-y-5">
                <h3 className="font-display font-semibold text-lg">
                  Confirm your appointment
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Doctor", value: `Dr. ${selectedDoctor.name}` },
                    { label: "Department", value: selectedDoctor.department },
                    {
                      label: "Date",
                      value: format(
                        new Date(selectedDate),
                        "EEEE, MMMM d, yyyy",
                      ),
                    },
                    { label: "Time", value: selectedTime },
                    { label: "Type", value: aptType, className: "capitalize" },
                    {
                      label: "Fee",
                      value: selectedDoctor.consultationFee
                        ? formatCurrency(selectedDoctor.consultationFee)
                        : "—",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between py-2 border-b border-border/60 last:border-0"
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span
                        className={cn("font-medium", (row as any).className)}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any symptoms or notes for the doctor…"
                    className="w-full rounded-xl border border-input p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-clinic-blue"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("slot")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleBook}
                    disabled={booking}
                    className="flex-1"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Booking…
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
