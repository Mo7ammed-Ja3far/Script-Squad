require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { initSockets } = require('./sockets');
const { setIo } = require('./services/queueService');
const whatsappService = require('./services/whatsapp');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const queueRoutes = require('./routes/queueRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

connectDB();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
}));

app.use(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip + req.path,
  skip: (req) => !['register', 'login', 'forgot-password', 'verify-otp', 'resend-otp'].some(p => req.path.includes(p)),
  message: { success: false, message: 'Too many authentication attempts. Please try again in an hour.' }
}));

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ClinicFlow API is running.',
    whatsapp: {
      ready: whatsappService.isReady(),
      status: whatsappService.isReady() ? 'connected' : 'pending_qr_scan'
    },
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

initSockets(io);
setIo(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`\n🚀 ClinicFlow API running on port ${PORT}`);
  console.log(`📡 WebSocket server active`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    console.log('📱 Initializing WhatsApp client...');
    await whatsappService.initialize();
  } catch (err) {
    console.error('❌ WhatsApp initialization error:', err.message);
    console.warn('⚠️  Server will continue running. WhatsApp features will be unavailable until resolved.');
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await whatsappService.destroy();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received — shutting down gracefully');
  await whatsappService.destroy();
  server.close(() => process.exit(0));
});

module.exports = { app, server, io };
