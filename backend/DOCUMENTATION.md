# ClinicFlow Backend — Complete Documentation

> Version 2.0.0 | Node.js / Express / MongoDB / Socket.io / whatsapp-web.js

---

## Table of Contents

1. [Setup & Running](#setup--running)
2. [Architecture Overview](#architecture-overview)
3. [WhatsApp Client — Internal Architecture](#whatsapp-client--internal-architecture)
4. [Standard Response Envelope](#standard-response-envelope)
5. [Authentication & Authorization](#authentication--authorization)
6. [Complete API Reference](#complete-api-reference)
   - [Auth Routes](#auth-routes)
   - [Appointment Routes](#appointment-routes)
   - [Doctor Routes](#doctor-routes)
   - [Queue Routes](#queue-routes)
   - [Consultation & EMR Routes](#consultation--emr-routes)
   - [Prescription Routes](#prescription-routes)
   - [Admin Routes](#admin-routes)
   - [Health Check](#health-check)
7. [Socket.io — Deep Dive](#socketio--deep-dive)
8. [OTP Flow Diagrams](#otp-flow-diagrams)
9. [Error Codes Reference](#error-codes-reference)

---

## Setup & Running

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >= 18.0.0 |
| MongoDB | >= 5.0 |
| Chromium / Chrome | Latest (for Puppeteer / whatsapp-web.js) |
| A physical phone | WhatsApp installed, active SIM |

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your values

# 3. Seed the database with test data
npm run seed

# 4. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Strong random string for JWT signing |
| `JWT_EXPIRES_IN` | No | JWT TTL (default: `7d`) |
| `CLIENT_ORIGIN` | No | Frontend origin for CORS (default: `http://localhost:3000`) |

### WhatsApp QR Scan (First Run)

On first start, the terminal will display a QR code:

```
════════════════════════════════════════════
  📱 WHATSAPP QR CODE — Scan with your phone
════════════════════════════════════════════

[QR CODE RENDERED HERE]

════════════════════════════════════════════
```

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices → Link a Device**
3. Scan the QR code
4. The terminal will print: `✅ WhatsApp client is ready and connected`

The session is persisted in `.wwebjs_auth/` — you will NOT need to re-scan on subsequent starts unless the session expires.

---

## Architecture Overview

```
server.js
├── Express App
│   ├── Middleware Stack (helmet, cors, mongoSanitize, rateLimit)
│   ├── Routes (auth, appointments, doctors, queue, consultations, prescriptions, admin)
│   └── Error Handler
├── Socket.io Server (JWT authenticated)
│   └── sockets/index.js — room management, event emitters
├── WhatsApp Client (non-blocking)
│   └── services/whatsapp/
│       ├── WhatsAppAdapter.js       — abstract base
│       ├── WhatsAppWebAdapter.js    — whatsapp-web.js implementation
│       ├── WhatsAppService.js       — OTP + notification orchestrator
│       ├── messageTemplates.js      — all message templates
│       └── index.js                 — singleton export
└── MongoDB (Mongoose)
    ├── Models: User, Appointment, EMR, Prescription, Queue, OTP
    └── Transactions used in: completeConsultation
```

### Service Layer Pattern

Every controller delegates all logic to a service. Controllers only:
1. Extract request data
2. Call the service
3. Format the HTTP response

This keeps controllers thin and services independently testable.

---

## WhatsApp Client — Internal Architecture

### How It Works Without Blocking the Event Loop

`whatsapp-web.js` runs Chromium via Puppeteer in a **separate child process**. The Node.js event loop is never blocked because:

1. `whatsappService.initialize()` is called **after** the HTTP server starts listening (in `server.js`), so the server accepts requests immediately even before WhatsApp is ready.
2. All `sendMessage()` calls inside booking/cancellation/etc. flows are **fire-and-forget** using `.catch()`. They are intentionally not `await`ed — a failed WhatsApp message never causes an HTTP request to fail.
3. The `isReady()` guard in `WhatsAppService.sendMessage()` silently logs a warning and returns early if the client isn't connected, ensuring zero disruption to core API functionality.

### Session Persistence

Sessions are stored in `.wwebjs_auth/` using `LocalAuth`. On subsequent server starts, the client restores the session automatically — no QR scan needed unless the session is revoked from the phone.

### Adapter Pattern — Swapping to Meta Cloud API

To replace `whatsapp-web.js` with the official Meta Cloud API in the future:

1. Create `services/whatsapp/MetaCloudAdapter.js` implementing these methods:
   - `async initialize()` — load credentials
   - `async sendMessage(to, message)` — POST to Meta's messages endpoint
   - `isReady()` — return true if credentials are valid
   - `async destroy()` — cleanup

2. In `services/whatsapp/index.js`, swap the adapter:
   ```js
   const MetaCloudAdapter = require('./MetaCloudAdapter');
   const adapter = new MetaCloudAdapter();
   ```

No other file in the codebase needs to change.

### OTP Security Model

| Property | Value |
|----------|-------|
| Code length | 6 digits (cryptographically random via `crypto.randomInt`) |
| Expiry | 10 minutes (MongoDB TTL index on `createdAt`) |
| Max attempts | 5 per OTP record — record deleted on 5th failure |
| Re-issue | Calling `sendOtp` deletes any existing OTP for that number+purpose before creating a new one |
| Storage | MongoDB `OTP` collection — no sensitive data exposed via API |

---

## Standard Response Envelope

All API responses follow this structure:

### Success
```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```
`meta` is only present on paginated list endpoints. `data` is omitted on operations that return no payload (e.g. logout).

### Error
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```
`errors` array is only present on validation failures (HTTP 400).

---

## Authentication & Authorization

| Method | Description |
|--------|-------------|
| JWT in HTTP-only cookie | Primary method (set automatically on login) |
| JWT in `Authorization: Bearer <token>` header | Supported for API clients / mobile |

All protected routes require a valid, non-expired JWT from an active account.

**Roles:** `patient`, `doctor`, `admin`

---

## Complete API Reference

### Auth Routes

Base path: `/api/auth`

---

#### `POST /api/auth/register`
**Public**

Registers a new user and sends a WhatsApp OTP for account activation.

**Request Body:**
```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "password": "SecurePass@123",
  "role": "patient",
  "phone": "+201112223334",
  "whatsappNumber": "+201112223334",

  // Doctor-only fields (required if role = "doctor"):
  "department": "Cardiology",
  "specialization": "Interventional Cardiology",
  "consultationFee": 300,
  "bio": "Board-certified cardiologist...",
  "experienceYears": 15,
  "credentials": [
    { "degree": "MD", "institution": "Cairo University", "year": 2008 }
  ],
  "workingHours": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "slotDuration": 20 },
    { "dayOfWeek": 0, "isDayOff": true }
  ]
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful. An OTP has been sent to your WhatsApp number to activate your account.",
  "data": {
    "user": {
      "_id": "64f...",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "role": "patient",
      "phone": "+201112223334",
      "whatsappNumber": "+201112223334",
      "isWhatsappVerified": false,
      "isActive": false,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

---

#### `POST /api/auth/verify-otp`
**Public**

Verifies the OTP and activates the account.

**Request Body:**
```json
{
  "whatsappNumber": "+201112223334",
  "code": "482910",
  "purpose": "registration"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "WhatsApp number verified. Account is now active.",
  "data": {
    "user": { "_id": "...", "isActive": true, "isWhatsappVerified": true, "..." }
  }
}
```

---

#### `POST /api/auth/resend-otp`
**Public**

Resends an OTP. Invalidates any previously issued OTP for the same number+purpose.

**Request Body:**
```json
{
  "whatsappNumber": "+201112223334",
  "purpose": "registration"
}
```

**Response `200`:** `{ "success": true, "message": "OTP resent successfully." }`

---

#### `POST /api/auth/login`
**Public**

**Request Body:**
```json
{ "email": "ahmed@example.com", "password": "SecurePass@123" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "_id": "...", "name": "Ahmed Hassan", "role": "patient", "..." },
    "token": "eyJhbGci..."
  }
}
```
Sets `HttpOnly` cookie `token` automatically.

---

#### `POST /api/auth/logout`
**Public**

Clears the auth cookie.

**Response `200`:** `{ "success": true, "message": "Logged out successfully." }`

---

#### `POST /api/auth/forgot-password`
**Public**

Sends a password-reset OTP to the registered WhatsApp number.

**Request Body:** `{ "whatsappNumber": "+201112223334" }`

**Response `200`:** `{ "success": true, "message": "OTP sent to your WhatsApp number." }`

---

#### `POST /api/auth/reset-password`
**Public**

**Request Body:**
```json
{
  "whatsappNumber": "+201112223334",
  "code": "391047",
  "newPassword": "NewSecurePass@456"
}
```

**Response `200`:** `{ "success": true, "message": "Password reset successfully." }`

---

#### `GET /api/auth/me`
**Protected — All roles**

Returns the authenticated user's full profile.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...", "name": "...", "email": "...", "role": "doctor",
      "department": "Cardiology", "specialization": "...",
      "consultationFee": 300, "workingHours": [...], "..."
    }
  }
}
```

---

#### `PATCH /api/auth/me`
**Protected — All roles**

Updates the authenticated user's profile. Fields `password`, `role`, `email`, `isActive`, `isWhatsappVerified` are silently ignored.

**Request Body:** Any updatable user fields (name, phone, bio, department, etc.)

**Response `200`:** Updated user object.

---

### Appointment Routes

Base path: `/api/appointments` — **All routes protected**

---

#### `POST /api/appointments`
**Protected — patient only**

Books an appointment. Sends WhatsApp confirmation automatically.

**Request Body:**
```json
{
  "doctorId": "64f...",
  "date": "2025-02-10",
  "time": "10:00",
  "type": "regular",
  "notes": "First visit, chest pain concerns"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Appointment booked successfully.",
  "data": {
    "appointment": {
      "_id": "...",
      "patient": { "_id": "...", "name": "Ahmed Hassan", "email": "...", "phone": "..." },
      "doctor": { "_id": "...", "name": "Dr. Sarah Mitchell", "department": "Cardiology", "specialization": "...", "consultationFee": 300 },
      "date": "2025-02-10",
      "time": "10:00",
      "status": "pending",
      "type": "regular",
      "notes": "First visit, chest pain concerns",
      "createdAt": "..."
    }
  }
}
```

---

#### `GET /api/appointments`
**Protected — All roles**

Lists appointments. Patients see their own; doctors see theirs; admins use `/api/admin/appointments`.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status (`pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`) |
| `dateFrom` | string | `YYYY-MM-DD` range start |
| `dateTo` | string | `YYYY-MM-DD` range end |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response `200`:** Paginated list of populated appointments.

---

#### `GET /api/appointments/:id`
**Protected — owner or admin**

Returns a single fully-populated appointment. Access enforced: patient sees only their own, doctor sees only theirs.

---

#### `PATCH /api/appointments/:id/cancel`
**Protected — patient, doctor, or admin**

**Request Body:** `{ "reason": "Patient unavailable" }` (optional)

Sends WhatsApp cancellation notice to patient. Removes any pending queue entry.

**Response `200`:** Updated appointment.

---

#### `PATCH /api/appointments/:id/reschedule`
**Protected — patient or admin**

Updates the appointment in-place. Stores the old slot in `rescheduledFrom` for audit. Sends WhatsApp reschedule notice.

**Request Body:**
```json
{ "newDate": "2025-02-15", "newTime": "11:00" }
```

**Response `200`:**
```json
{
  "data": {
    "appointment": {
      "...",
      "date": "2025-02-15",
      "time": "11:00",
      "status": "rescheduled",
      "rescheduledFrom": { "date": "2025-02-10", "time": "10:00" },
      "rescheduledAt": "2025-01-20T..."
    }
  }
}
```

---

#### `GET /api/appointments/availability/:doctorId?date=YYYY-MM-DD`
**Protected — All roles**

Returns a doctor's full slot breakdown for a date.

**Response `200`:**
```json
{
  "data": {
    "available": true,
    "doctor": { "_id": "...", "name": "Dr. Sarah Mitchell", "department": "Cardiology" },
    "date": "2025-02-10",
    "schedule": { "startTime": "09:00", "endTime": "17:00", "slotDuration": 20 },
    "slots": [
      { "time": "09:00", "available": true },
      { "time": "09:20", "available": false },
      { "time": "09:40", "available": true }
    ],
    "totalSlots": 24,
    "availableSlots": 20
  }
}
```

---

### Doctor Routes

Base path: `/api/doctors`

---

#### `GET /api/doctors`
**Public**

**Query Parameters:** `department`, `specialization`, `page`, `limit`

**Response `200`:** Paginated list of active doctors (no password, no internal fields).

---

#### `GET /api/doctors/:id`
**Public**

Returns a single doctor's public profile including working hours and credentials.

---

#### `GET /api/doctors/me/stats`
**Protected — doctor only**

```json
{
  "data": {
    "stats": { "total": 120, "completed": 95, "pending": 8, "cancelled": 17, "today": 6 }
  }
}
```

---

#### `PATCH /api/doctors/me/schedule`
**Protected — doctor only**

Updates the doctor's weekly schedule.

**Request Body:**
```json
{
  "workingHours": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "slotDuration": 20 },
    { "dayOfWeek": 5, "isDayOff": true }
  ]
}
```

---

### Queue Routes

Base path: `/api/queue` — **All routes protected**

---

#### `POST /api/queue/join`
**Protected — patient only**

Joins the doctor's live queue. Only allowed on the appointment's actual date. Sends WhatsApp queue confirmation. Confirms the appointment status.

**Request Body:** `{ "appointmentId": "64f..." }`

**Response `201`:**
```json
{
  "data": {
    "queueEntry": {
      "_id": "...",
      "patient": { "_id": "...", "name": "Ahmed Hassan" },
      "doctor": { "_id": "...", "name": "Dr. Sarah Mitchell", "department": "Cardiology" },
      "appointment": { "date": "2025-02-10", "time": "10:00", "type": "regular" },
      "queueNumber": 4,
      "status": "waiting",
      "date": "..."
    },
    "queueNumber": 4,
    "estimatedWaitMinutes": 60
  }
}
```

Emits socket event `QUEUE_PATIENT_JOINED` to the doctor's queue room.

---

#### `GET /api/queue/my-queue`
**Protected — doctor only**

Returns today's full queue for the authenticated doctor with a summary.

**Query Parameters:** `date` (optional, `YYYY-MM-DD`, defaults to today)

**Response `200`:**
```json
{
  "data": {
    "queue": [ { "queueNumber": 1, "status": "completed", "patient": {...} }, ... ],
    "summary": { "total": 8, "waiting": 3, "inProgress": 1, "completed": 4, "cancelled": 0 },
    "date": "..."
  }
}
```

---

#### `GET /api/queue/:doctorId`
**Protected — admin or doctor**

Same as `my-queue` but for a specific doctor. Used by admin dashboard.

---

#### `POST /api/queue/call-next`
**Protected — doctor only**

Marks the next waiting patient as `in-progress`. Emits `PATIENT_CALLED` and `YOUR_TURN` socket events.

**Response `200`:**
```json
{
  "data": {
    "queueEntry": { "queueNumber": 5, "status": "in-progress", "patient": {...}, "calledAt": "..." }
  }
}
```

---

#### `PATCH /api/queue/:queueId/remove`
**Protected — doctor only**

Marks a queue entry as `cancelled`. Emits `QUEUE_PATIENT_REMOVED`.

---

### Consultation & EMR Routes

Base path: `/api/consultations` — **All routes protected**

---

#### `POST /api/consultations/complete`
**Protected — doctor only**

Completes a consultation atomically (MongoDB transaction):
1. Creates a `Prescription` record (if medications provided)
2. Appends a history entry to the patient's `EMR`
3. Marks the `Appointment` as `completed`
4. Creates a follow-up `Appointment` (if `followUpDate` provided)
5. Marks the queue entry as `completed`
6. Sends WhatsApp post-consultation summary with full medication list

**Request Body:**
```json
{
  "appointmentId": "64f...",
  "diagnosis": "Hypertension Stage 1",
  "medications": [
    {
      "name": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "3 months",
      "quantity": 90,
      "instructions": "Take in the morning with water"
    }
  ],
  "notes": "Monitor blood pressure weekly. Reduce salt intake.",
  "followUpDate": "2025-05-10"
}
```

**Response `200`:**
```json
{
  "data": {
    "appointment": { "_id": "...", "status": "completed" },
    "prescription": {
      "_id": "...",
      "doctor": { "name": "Dr. Sarah Mitchell", "department": "Cardiology" },
      "medications": [...],
      "notes": "...",
      "isActive": true,
      "createdAt": "..."
    },
    "followUpAppointment": {
      "_id": "...", "date": "2025-05-10", "time": "10:00", "type": "follow-up", "status": "pending"
    },
    "emrUpdated": true
  }
}
```

---

#### `GET /api/consultations/emr/:patientId`
**Protected — doctor, admin, or the patient themselves**

Returns full EMR with populated history, prescriptions, and doctor details.

**Response `200`:**
```json
{
  "data": {
    "emr": {
      "_id": "...",
      "patient": { "_id": "...", "name": "Ahmed Hassan", "email": "..." },
      "bloodType": "O+",
      "height": 175,
      "weight": 82,
      "chronicDiseases": ["Hypertension"],
      "allergies": ["Penicillin"],
      "surgicalHistory": [],
      "history": [
        {
          "date": "...",
          "doctor": { "name": "Dr. Sarah Mitchell", "department": "Cardiology" },
          "appointment": { "date": "2025-02-10", "time": "10:00", "type": "regular" },
          "diagnosis": "Hypertension Stage 1",
          "prescription": { "medications": [...] },
          "notes": "..."
        }
      ]
    }
  }
}
```

---

#### `PATCH /api/consultations/emr/:patientId`
**Protected — doctor or admin**

Updates the base medical info (vitals, allergies, chronic conditions). Does not modify consultation history.

**Request Body:**
```json
{
  "bloodType": "O+",
  "height": 175,
  "weight": 82,
  "chronicDiseases": ["Hypertension", "Diabetes Type 2"],
  "allergies": ["Penicillin"],
  "surgicalHistory": ["Appendectomy 2015"]
}
```

---

### Prescription Routes

Base path: `/api/prescriptions` — **All routes protected**

---

#### `GET /api/prescriptions/patient/:patientId`
**Protected — doctor, admin, or the patient themselves**

**Query Parameters:** `page`, `limit`, `isActive` (`true`/`false`)

**Response `200`:** Paginated list of prescriptions with doctor and appointment details.

---

#### `GET /api/prescriptions/:id`
**Protected — prescription's patient, doctor, or admin**

Returns a single prescription with full population.

---

### Admin Routes

Base path: `/api/admin` — **All routes protected, admin only**

---

#### `GET /api/admin/dashboard`

Returns a comprehensive clinic dashboard snapshot.

**Response `200`:**
```json
{
  "data": {
    "stats": {
      "users": { "patients": 120, "doctors": 15, "admins": 2, "total": 137 },
      "appointments": {
        "total": 3450,
        "today": 42,
        "thisWeek": 210,
        "byStatus": { "pending": 18, "confirmed": 24, "completed": 3380, "cancelled": 28, "rescheduled": 0 }
      },
      "medical": { "prescriptions": 2890, "emrRecords": 118 },
      "queue": { "activeToday": 12 },
      "recentPatients": [
        { "_id": "...", "name": "Ahmed Hassan", "email": "...", "createdAt": "..." }
      ]
    }
  }
}
```

---

#### `GET /api/admin/users`

**Query Parameters:** `role`, `isActive`, `search`, `page`, `limit`

Returns paginated list of all users (passwords excluded).

---

#### `GET /api/admin/users/:id`

Single user by ID.

---

#### `PATCH /api/admin/users/:id`

Update any user field except `password`. Used to activate accounts, change roles, update doctor profiles, etc.

---

#### `DELETE /api/admin/users/:id`

Cascade-deletes the user and all associated: appointments, EMR, prescriptions, queue entries.

---

#### `GET /api/admin/appointments`

**Query Parameters:** `status`, `dateFrom`, `dateTo`, `doctorId`, `patientId`, `page`, `limit`

Full appointment list with all populations for admin management view.

---

### Health Check

#### `GET /api/health`
**Public**

```json
{
  "success": true,
  "message": "ClinicFlow API is running.",
  "whatsapp": {
    "ready": true,
    "status": "connected"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

---

## Socket.io — Deep Dive

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,         // for cookie auth
  auth: { token: 'eyJhbGci...' } // OR bearer token
});
```

Authentication is performed on the socket handshake via JWT middleware. Unauthenticated connections are rejected immediately.

### Rooms

| Room ID | Members | Purpose |
|---------|---------|---------|
| `user:<userId>` | Auto-joined on connect | Personal notifications |
| `role:<role>` | Auto-joined on connect | Role-wide broadcasts |
| `queue:<doctorId>` | Doctor joins manually | Live queue updates |

### Client → Server Events (Emitted by frontend)

---

#### `JOIN_DOCTOR_QUEUE_ROOM`

Subscribes to a doctor's live queue room. Only accepted from the doctor themselves or admins.

**Payload:**
```json
{ "doctorId": "64f..." }
```

**Acknowledgement emitted back:** `QUEUE_ROOM_JOINED` `{ "doctorId": "64f..." }`

---

#### `LEAVE_DOCTOR_QUEUE_ROOM`

Unsubscribes from a queue room.

**Payload:** `{ "doctorId": "64f..." }`

---

### Server → Client Events (Received by frontend)

---

#### `CONNECTED`

Fired immediately after successful socket authentication.

**Payload:**
```json
{ "message": "Socket connected successfully.", "userId": "...", "role": "doctor" }
```

---

#### `QUEUE_PATIENT_JOINED`

Fired to `queue:<doctorId>` room when a patient joins the queue.

**Payload:**
```json
{
  "queueEntry": {
    "_id": "...", "queueNumber": 5, "status": "waiting",
    "patient": { "_id": "...", "name": "Ahmed Hassan" },
    "appointment": { "date": "...", "time": "10:00" }
  },
  "queueNumber": 5,
  "estimatedWaitMinutes": 80
}
```

---

#### `PATIENT_CALLED`

Fired to `queue:<doctorId>` room when the doctor calls the next patient.

**Payload:**
```json
{
  "queueEntry": {
    "queueNumber": 5, "status": "in-progress",
    "patient": { "name": "Ahmed Hassan" },
    "calledAt": "2025-01-20T10:45:00.000Z"
  }
}
```

---

#### `YOUR_TURN`

Fired to `user:<patientId>` room when that specific patient is called.

**Payload:**
```json
{
  "message": "It is your turn! Please proceed to the consultation room.",
  "queueNumber": 5,
  "doctorName": "Dr. Sarah Mitchell"
}
```

---

#### `QUEUE_UPDATED`

Fired to `queue:<doctorId>` room after a patient is called, to refresh the waiting count.

**Payload:** `{ "remaining": 3 }`

---

#### `APPOINTMENT_CONFIRMED`

Fired to `user:<patientId>` room when patient joins the queue (appointment moves to `confirmed`).

**Payload:**
```json
{ "appointmentId": "...", "queueNumber": 5, "estimatedWaitMinutes": 80 }
```

---

#### `QUEUE_PATIENT_REMOVED`

Fired to `queue:<doctorId>` room when a patient is manually removed.

**Payload:** `{ "queueId": "..." }`

---

## OTP Flow Diagrams

### Registration Flow

```
Client                    Server                 WhatsApp
  │                          │                       │
  ├──POST /register──────────►│                       │
  │                          ├── Create User (isActive: false)
  │                          ├── Generate OTP ────────►│
  │                          │                   Send OTP message
  │◄──201 {user}─────────────┤                       │
  │                          │                       │
  ├──POST /verify-otp─────────►│                       │
  │                          ├── Verify OTP
  │                          ├── Set isActive: true
  │◄──200 {user, active}──────┤                       │
  │                          │                       │
  ├──POST /login──────────────►│                       │
  │◄──200 {user, token}───────┤                       │
```

### Forgot Password Flow

```
Client                    Server                 WhatsApp
  │                          │                       │
  ├──POST /forgot-password────►│                       │
  │                          ├── Generate OTP ────────►│
  │◄──200 "OTP sent"──────────┤               Send reset OTP
  │                          │                       │
  ├──POST /reset-password─────►│                       │
  │                          ├── Verify OTP
  │                          ├── Hash & save new password
  │◄──200 "Password reset"────┤                       │
```

---

## Error Codes Reference

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error / bad request |
| 401 | Not authenticated / token expired |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, slot already booked) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

*Documentation generated for ClinicFlow Backend v2.0.0*
