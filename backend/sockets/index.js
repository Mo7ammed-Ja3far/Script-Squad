const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map();

const initSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication token is required.'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) return next(new Error('Authentication failed.'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    const { _id: userId, role, name } = socket.user;
    const userIdStr = userId.toString();

    connectedUsers.set(userIdStr, socket.id);
    console.log(`🔌 [Socket] Connected: ${name} (${role}) — ${socket.id}`);

    socket.join(`user:${userIdStr}`);
    socket.join(`role:${role}`);

    socket.emit('CONNECTED', {
      message: 'Socket connected successfully.',
      userId: userIdStr,
      role
    });

    socket.on('JOIN_DOCTOR_QUEUE_ROOM', ({ doctorId }) => {
      if (role === 'doctor' && userIdStr === doctorId) {
        socket.join(`queue:${doctorId}`);
        socket.emit('QUEUE_ROOM_JOINED', { doctorId });
      } else if (role === 'admin') {
        socket.join(`queue:${doctorId}`);
        socket.emit('QUEUE_ROOM_JOINED', { doctorId });
      }
    });

    socket.on('LEAVE_DOCTOR_QUEUE_ROOM', ({ doctorId }) => {
      socket.leave(`queue:${doctorId}`);
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userIdStr);
      console.log(`🔌 [Socket] Disconnected: ${name} (${role}) — ${socket.id}`);
    });
  });
};

const emitToUser = (io, userId, event, payload) => {
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

const emitToRole = (io, role, event, payload) => {
  io.to(`role:${role}`).emit(event, payload);
};

const emitToQueueRoom = (io, doctorId, event, payload) => {
  io.to(`queue:${doctorId.toString()}`).emit(event, payload);
};

module.exports = { initSockets, emitToUser, emitToRole, emitToQueueRoom, connectedUsers };
