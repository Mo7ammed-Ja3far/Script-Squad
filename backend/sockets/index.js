const jwt = require('jsonwebtoken');

const socketIoSetup = (io) => {
  // Socket.io Authentication Middleware
  io.use((socket, next) => {
    try {
      // Allow passing token in handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = decoded; // Attach user info to socket
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);

    // Patient or Doctor joins a room specific to a doctor or clinic (for the day)
    // The client should emit a 'joinRoom' event with the roomName (e.g. `doctor_${doctorId}`)
    socket.on('joinRoom', (roomName) => {
      socket.join(roomName);
      console.log(`User ${socket.user.id} joined room: ${roomName}`);
    });

    // Leave room
    socket.on('leaveRoom', (roomName) => {
      socket.leave(roomName);
      console.log(`User ${socket.user.id} left room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketIoSetup;
