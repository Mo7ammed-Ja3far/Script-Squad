import React, { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { tokenStore, BASE_URL } from "@/services/api"
import { useAuth } from "./AuthProvider"
import { toast } from "@/hooks/use-toast"
import type { SocketEvents } from "@/types"

// ─────────────────────────────────────────────────────────────────────────────
// Socket context
// ─────────────────────────────────────────────────────────────────────────────

type Status = "disconnected" | "connecting" | "connected" | "no-token"

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  status: Status
  joinQueueRoom: (doctorId: string) => void
  leaveQueueRoom: (doctorId: string) => void
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  status: "disconnected",
  joinQueueRoom: () => {},
  leaveQueueRoom: () => {},
})

// ─────────────────────────────────────────────────────────────────────────────
// SocketProvider
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Key architectural fix: socket instance is held in React STATE, not a ref.
 *
 * Previous version used useRef. Refs don't trigger re-renders, which meant:
 *   • On mount, context.socket = null  (ref not yet set)
 *   • useEffect runs, sets socketRef.current = io(...)
 *   • Ref update does NOT cause SocketProvider to re-render
 *   • Context consumers still see socket: null
 *   • useSocketEvent's effect sees null, attaches no listeners
 *   • Listeners never fire → UI only updates on manual browser refresh
 *
 * With useState: every socket connect/disconnect causes a real re-render,
 * propagating the live socket instance through context to all consumers,
 * so useSocketEvent can properly attach and the events fire reliably.
 *
 * Global queue sync (QUEUE_PATIENT_JOINED, PATIENT_CALLED, QUEUE_UPDATED,
 * QUEUE_PATIENT_REMOVED, APPOINTMENT_CONFIRMED, YOUR_TURN) is handled here
 * directly, at the Provider level, so it fires regardless of which page
 * the user is currently viewing — no page-level socket listener needed.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const qc = useQueryClient()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [status, setStatus] = useState<Status>("disconnected")

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSocket(prev => { prev?.disconnect(); return null })
      setStatus("disconnected")
      return
    }

    const token = tokenStore.get()
    if (!token) {
      // Backend socket middleware only reads auth.token / Authorization header,
      // never the HttpOnly cookie. A session restored purely from the cookie
      // (page reload, private window) won't have a token here, so we don't
      // attempt a connection that would just fail authentication.
      setSocket(null)
      setStatus("no-token")
      return
    }

    setStatus("connecting")

    const s = io(BASE_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // ── Connection lifecycle ──────────────────────────────────────────────────
    s.on("connect", () => {
      setStatus("connected")

      // Doctors automatically join their own queue room on (re)connect
      if (user.role === "doctor") {
        s.emit("JOIN_DOCTOR_QUEUE_ROOM", { doctorId: user._id })
      }
    })

    s.on("disconnect", reason => {
      setStatus("disconnected")
      if (reason === "io server disconnect") {
        // Server forcibly disconnected (e.g. token expired mid-session) — attempt reconnect
        s.connect()
      }
    })

    s.on("connect_error", err => {
      console.warn("[Socket] Connection error:", err.message)
      setStatus("disconnected")
    })

    // ── Global queue event → React Query cache invalidation ──────────────────
    // All six queue events are handled HERE at the provider level so they fire
    // regardless of which page is currently mounted. Previously these listeners
    // lived inside individual page components (DoctorQueue, PatientLiveQueue),
    // so events were silently dropped whenever the user navigated to a different
    // page — explaining why a browser refresh was needed to see changes.

    s.on("QUEUE_PATIENT_JOINED", (data: SocketEvents["QUEUE_PATIENT_JOINED"]) => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      if (user.role === "doctor") {
        toast.info(
          "Patient joined the queue",
          `${data.queueEntry.patient.name} — #${data.queueNumber}`
        )
      }
    })

    s.on("PATIENT_CALLED", () => {
      qc.invalidateQueries({ queryKey: ["queue"] })
    })

    s.on("QUEUE_UPDATED", () => {
      qc.invalidateQueries({ queryKey: ["queue"] })
    })

    s.on("QUEUE_PATIENT_REMOVED", () => {
      qc.invalidateQueries({ queryKey: ["queue"] })
    })

    s.on("APPOINTMENT_CONFIRMED", () => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      qc.invalidateQueries({ queryKey: ["appointments"] })
    })

    s.on("YOUR_TURN", (data: SocketEvents["YOUR_TURN"]) => {
      qc.invalidateQueries({ queryKey: ["queue"] })
      qc.invalidateQueries({ queryKey: ["appointments"] })
      if (user.role === "patient") {
        toast.success("It's your turn!", `Dr. ${data.doctorName} is ready for you.`)
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200])
        }
      }
    })

    // Push new socket instance into state so consumers re-render immediately
    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
      setStatus("disconnected")
    }
  }, [isAuthenticated, user?._id]) // eslint-disable-line react-hooks/exhaustive-deps
  // user?._id keeps dependency stable — avoids reconnecting every time an unrelated
  // user field (workingHours etc.) changes after a profile/schedule update

  const joinQueueRoom = (doctorId: string) => socket?.emit("JOIN_DOCTOR_QUEUE_ROOM", { doctorId })
  const leaveQueueRoom = (doctorId: string) => socket?.emit("LEAVE_DOCTOR_QUEUE_ROOM", { doctorId })

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected: status === "connected",
      status,
      joinQueueRoom,
      leaveQueueRoom,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useSocket() {
  return useContext(SocketContext)
}

/**
 * Typed socket event listener for page-specific UI reactions.
 * Global cache invalidation is handled above in SocketProvider itself.
 * Use this only for UI state that's local to a specific page
 * (e.g. the "It's your turn!" celebration card on PatientLiveQueue).
 */
export function useSocketEvent<K extends keyof SocketEvents>(
  event: K,
  handler: (data: SocketEvents[K]) => void,
  deps: React.DependencyList = []
) {
  const { socket } = useSocket()
  useEffect(() => {
    if (!socket) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event as string, handler as any)
    return () => { socket.off(event as string, handler as any) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, ...deps])
}
