import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { HeartPulse } from "lucide-react"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col gradient-brand p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: `${(i+1)*180}px`, height: `${(i+1)*180}px`, top: "50%", left: "50%",
                transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <Link to="/" className="flex items-center gap-2.5 z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold">ClinicFlow</span>
        </Link>
        <div className="flex-1 flex flex-col justify-center z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-display font-bold leading-tight mb-4">
              Healthcare that flows<br />seamlessly.
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Book appointments, track your health records, and connect with top specialists — all in one place.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: "Doctors", value: "200+" },
              { label: "Patients", value: "50K+" },
              { label: "Appointments", value: "1M+" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-white/70 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <p className="text-white/50 text-xs z-10">© {new Date().getFullYear()} ClinicFlow. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col min-h-screen lg:min-h-0">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">ClinicFlow</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
