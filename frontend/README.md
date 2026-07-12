# ClinicFlow Frontend — Complete Setup & Documentation

## 📋 Overview

**ClinicFlow** is a production-ready healthcare management SaaS platform with a React + TypeScript frontend. It provides comprehensive appointment booking, real-time queue management, EMR tracking, and role-based dashboards for patients, doctors, and admins.

### Key Features

✅ **User Roles**: Patient, Doctor, Admin with full role-based access control  
✅ **WhatsApp OTP**: Phone number verification via WhatsApp  
✅ **Appointment Booking**: Browse doctors, select slots, confirm appointments  
✅ **Live Queue**: Real-time queue tracking with Socket.io updates  
✅ **EMR/Medical Records**: Allergies, chronic diseases, surgical history, consultation timeline  
✅ **Doctor Dashboard**: Queue management, consultations, schedule configuration, patient stats  
✅ **Admin Dashboard**: System-wide analytics, user management, appointment monitoring  
✅ **Prescriptions**: Create, view, and manage patient medications  
✅ **Socket.io Integration**: Real-time notifications, queue updates, appointment confirmations  

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **yarn**
- Backend running at `http://localhost:5000` (set `VITE_API_URL` to change)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
# Edit .env if backend is not on localhost:5000
# VITE_API_URL=http://localhost:5000

# 3. Start development server
npm run dev

# 4. Open browser
# Visit http://localhost:5174
```

### Build for Production

```bash
npm run build    # Creates optimized dist/ folder
npm run preview  # Test production build locally
```

---

## 📁 Project Structure

```
src/
├── app/                    # (placeholder for global app config)
├── components/
│   ├── ui/                 # shadcn/ui components (button, input, card, etc.)
│   ├── ProtectedRoute.tsx  # Role-based route protection
│   └── ...
├── features/
│   ├── auth/               # Login, register, OTP, password reset pages
│   ├── patient/            # Patient dashboard pages
│   ├── doctor/             # Doctor dashboard pages
│   └── admin/              # Admin dashboard pages
├── hooks/
│   ├── index.ts            # React Query hooks (useLogin, useAppointments, etc.)
│   └── use-toast.ts        # Toast notification hook
├── layouts/
│   ├── AuthLayout.tsx      # Auth pages wrapper
│   └── DashboardLayout.tsx # Main dashboard shell with sidebar
├── lib/
│   └── utils.ts            # cn() utility for classnames
├── providers/
│   ├── AuthProvider.tsx    # JWT auth state & context
│   ├── SocketProvider.tsx  # Socket.io connection & events
│   └── QueryProvider.tsx   # React Query configuration
├── services/
│   ├── api.ts              # Axios instance with interceptors
│   └── endpoints.ts        # All API service functions (authApi, appointmentsApi, etc.)
├── types/
│   ├── index.ts            # All TypeScript interfaces (User, Appointment, etc.)
│   └── schemas.ts          # Zod validation schemas for forms
├── utils/
│   └── helpers.ts          # Date formatting, initials, status helpers
├── index.css               # Global styles & design tokens
├── App.tsx                 # Route definitions
└── main.tsx                # React entry point

public/
index.html                  # HTML template
```

---

## 🔐 Authentication Flow

### 1. Register → OTP → Account Created

```
User fills register form
    ↓
POST /api/auth/register (password must be hashed on backend)
    ↓
Redirects to /auth/verify-otp with WhatsApp number
    ↓
User receives 6-digit OTP on WhatsApp
    ↓
POST /api/auth/verify-otp with code
    ↓
Account activated, redirects to /auth/login
```

### 2. Login → JWT Cookie

```
User fills email + password
    ↓
POST /api/auth/login
    ↓
Backend sets HttpOnly cookie "token" + returns JWT
    ↓
useAuth() stores user state
    ↓
Redirected to role dashboard (/patient, /doctor, or /admin)
```

### 3. JWT Refresh on Page Load

```
App mounts → AuthProvider calls GET /api/auth/me
    ↓
If cookie exists → User restored from backend response
    ↓
If 401 → Session expired, redirected to login
    ↓
If valid → User context populated, routes render
```

### 4. Logout

```
User clicks "Sign out"
    ↓
POST /api/auth/logout
    ↓
useAuth().logout() clears state & token from localStorage
    ↓
Redirected to /auth/login
```

---

## 🎯 Core Hooks & API Functions

All hooks are in `src/hooks/index.ts`. They use React Query for caching and Socket.io for real-time.

### Auth

```typescript
useLogin()             // POST /api/auth/login
useRegister()          // POST /api/auth/register
useVerifyOtp()         // POST /api/auth/verify-otp
useResendOtp()         // POST /api/auth/resend-otp
useForgotPassword()    // POST /api/auth/forgot-password
useResetPassword()     // POST /api/auth/reset-password
useUpdateProfile()     // PATCH /api/auth/me
```

### Appointments

```typescript
useAppointments(filters)      // GET /api/appointments (cached, refetchable)
useAppointment(id)            // GET /api/appointments/:id
useAvailability(doctorId, date)  // GET /api/appointments/availability/:doctorId?date=
useBookAppointment()          // POST /api/appointments
useCancelAppointment()        // PATCH /api/appointments/:id/cancel
useRescheduleAppointment()    // PATCH /api/appointments/:id/reschedule
```

### Queue

```typescript
useMyQueue(date)              // GET /api/queue/my-queue (doctor, 30s refetch)
useDoctorQueue(doctorId)      // GET /api/queue/:doctorId (admin)
useJoinQueue()                // POST /api/queue/join
useCallNext()                 // POST /api/queue/call-next (doctor)
useRemoveFromQueue()          // PATCH /api/queue/:queueId/remove (doctor)
```

### Real-time Events

```typescript
// Inside components:
useSocketEvent("YOUR_TURN", (data) => {
  // Patient's queue number is called
})

useSocketEvent("QUEUE_UPDATED", (data) => {
  // Someone joined/left queue
})

useSocketEvent("QUEUE_PATIENT_JOINED", (data) => {
  // New patient in queue (doctor view)
})
```

---

## 📱 Role-Based Features

### Patient Dashboard (`/patient`)

| Page | Path | Features |
|------|------|----------|
| Overview | `/patient` | Stats, quick actions, recent appointments |
| Book Appointment | `/patient/book` | Browse doctors, select date/time, confirm |
| My Appointments | `/patient/appointments` | List, cancel, reschedule, join queue |
| Live Queue | `/patient/queue` | Real-time position, wait time, "Your Turn" alert |
| Medical Records | `/patient/emr` | EMR timeline, allergies, chronic diseases, history |
| Prescriptions | `/patient/prescriptions` | View medications, instructions, active/past |

### Doctor Dashboard (`/doctor`)

| Page | Path | Features |
|------|------|----------|
| Overview | `/doctor` | Today's stats, quick queue snapshot, call-to-action |
| Patient Queue | `/doctor/queue` | Real-time queue, call next, remove, summary |
| Appointments | `/doctor/appointments` | View all appointments, filter by status |
| Consultations | `/doctor/consultations` | Complete consultation form, diagnosis, medications, notes, follow-up |
| My Schedule | `/doctor/schedule` | Set working hours, slot duration, days off |

### Admin Dashboard (`/admin`)

| Page | Path | Features |
|------|------|----------|
| Dashboard | `/admin` | System stats, user breakdown, appointment status, recent activity |
| Users | `/admin/users` | List, search, filter by role, activate/deactivate, delete |
| Appointments | `/admin/appointments` | Global appointment list (WIP) |

---

## 🎨 UI Components & Design System

### Design Tokens

- **Colors**: Clinic Blue `#1E6FD9`, Clinic Teal `#0FA89A`
- **Typography**: Sora (display), DM Sans (body), JetBrains Mono (code)
- **Spacing**: 0.75rem base radius, 16px base padding
- **Animations**: Fade-in, slide-up, queue-pulse for real-time updates

### Available Components

All in `src/components/ui/`:

- **button** — Variants: default, destructive, outline, soft, teal, ghost, link
- **input** — Form inputs with focus states
- **label** — Form labels
- **textarea** — Multi-line inputs
- **card** — Container with header/content/footer
- **badge** — Status badges (pending, confirmed, completed, cancelled, teal, warning, etc.)
- **dialog** — Modal dialogs with footer
- **select** — Dropdown select with search
- **tabs** — Tab navigation
- **toast** — Toast notifications (success, error, warning, info)
- **avatar** — User avatars with fallback initials
- **progress** — Linear progress bars
- **separator** — Divider lines

### Dashboard Components

In `src/components/ui/dashboard.tsx`:

```typescript
<StatCard label="..." value={123} icon={UserIcon} color="blue" />
<PageHeader title="..." description="..." />
<EmptyState icon={...} title="..." description="..." action={<Button />} />
<LoadingSpinner />
<ErrorMessage message="..." onRetry={() => {}} />
```

---

## 🔌 Socket.io Events

The frontend auto-connects on mount if authenticated. Joins rooms automatically:
- `user:<userId>` (personal notifications)
- `role:<role>` (broadcast to all users of that role)
- `queue:<doctorId>` (doctors auto-join their queue room)

### Server → Client Events

```typescript
CONNECTED: { message, userId, role }
QUEUE_PATIENT_JOINED: { queueEntry, queueNumber, estimatedWaitMinutes }
PATIENT_CALLED: { queueEntry (with calledAt) }
YOUR_TURN: { message, queueNumber, doctorName }
QUEUE_UPDATED: { remaining }
APPOINTMENT_CONFIRMED: { appointmentId, queueNumber, estimatedWaitMinutes }
QUEUE_PATIENT_REMOVED: { queueId }
QUEUE_ROOM_JOINED: { doctorId }
```

### Client → Server Events

```typescript
socket.emit("JOIN_DOCTOR_QUEUE_ROOM", { doctorId })
socket.emit("LEAVE_DOCTOR_QUEUE_ROOM", { doctorId })
```

---

## 📝 Form Validation

All forms use **Zod** + **React Hook Form** for client-side validation.

### Example

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormValues } from "@/types/schemas"

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormValues) => {
    // data is guaranteed valid
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}
    </form>
  )
}
```

---

## 🌐 Environment Variables

```bash
# .env (optional, defaults shown)
VITE_API_URL=http://localhost:5000
```

The API client uses:
- **Base URL**: `http://localhost:5000/api`
- **Credentials**: Cookies (HttpOnly) + optional Bearer token in localStorage
- **Response format**: `{ success: true, data: {...}, message: "..." }`

---

## 🐛 Debugging

### React Query DevTools

Enabled in development (`npm run dev`). Opens bottom-right drawer. Check:
- Query cache status
- Mutation history
- Stale time, gc time

### Network Requests

1. Open DevTools → Network
2. Look for `/api/*` requests
3. Check Response tab for error messages
4. Check Cookies tab for `token` (HttpOnly)

### Socket.io Connection

```typescript
// In browser console:
// Check if socket connected
const socket = window.__socket__ // (manually exposed)

// Or check SocketProvider logs in console
```

---

## 🚨 Common Issues

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 401 Unauthorized / Session expired

- Clear cookies: DevTools → Application → Cookies → delete "token"
- Sign in again
- Check backend is running on `http://localhost:5000`

### Socket.io not connecting

- Backend must have CORS enabled for WebSocket
- Check `VITE_API_URL` environment variable
- Verify backend `socket.io` endpoint is on same origin

### TypeScript errors

```bash
# Ensure tsconfig.json paths are correct
npm run build  # Compile TypeScript
```

---

## 📦 Build & Deploy

### Production Build

```bash
npm run build
# Output: dist/

# Test locally:
npm run preview
# Visit http://localhost:5174
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
# → Select project → deploy dist/
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Environment Variables on Production

Set `VITE_API_URL` to your production backend URL in:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment

---

## 🔄 API Response Format

All responses follow this envelope:

```typescript
// Success
{
  success: true,
  message: "Operation successful",
  data: { /* payload */ },
  meta?: { pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }
}

// Error
{
  success: false,
  message: "Error message",
  errors?: [ { field: "email", message: "Invalid email" } ]
}
```

The Axios interceptor automatically:
- Unwraps `data` field
- Normalizes errors
- Redirects on 401 to `/auth/login?expired=true`

---

## 📚 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| UI Framework | React 18 + TypeScript |
| Bundler | Vite |
| Routing | React Router v6 |
| HTTP | Axios + React Query (TanStack Query) |
| Real-time | Socket.io Client |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |

---

## 📞 Support & Troubleshooting

### Check Logs

```bash
# Frontend console (browser DevTools)
# Look for React Query errors, Socket.io warnings

# Backend logs (terminal)
# Should show socket connections, API requests
```

### Verify Connectivity

```bash
# Test backend availability
curl http://localhost:5000/api/health

# Expected response:
# { "success": true, "message": "Server is running", "whatsapp": { "ready": true }, "timestamp": "..." }
```

---

## 📝 Next Steps

The frontend is **feature-complete** for the MVP. Ready-to-extend areas:

- **Profile Pages** (`/patient/profile`, `/doctor/profile`) — placeholders
- **Advanced Analytics** — admin appointment details
- **Notifications** — push/email notifications
- **Video Consultations** — integrate WebRTC
- **Prescriptions Refill** — auto-renewal logic
- **Integration Tests** — add Cypress or Playwright

---

## 📄 License

© 2025 ClinicFlow. All rights reserved.

---

**Happy coding! 🎉**
