require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { appEvents, EVENTS } = require('./events/appEvents');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    socket.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch (error) {
    next(new Error('Invalid socket token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`role:${socket.user.role}`);
  socket.join(`user:${socket.user.id}`);
  socket.on('join:section', (sectionId) => socket.join(`section:${sectionId}`));
  socket.on('disconnect', () => {});
});

appEvents.on(EVENTS.ANNOUNCEMENT_CREATED, (announcement) => {
  const audience = announcement.audience?.type || 'university';
  const room = audience === 'section' ? `section:${announcement.audience.section}`
    : audience === 'course' ? `course:${announcement.audience.course}`
    : 'role:student';
  io.to(room).emit('announcement:new', announcement);
});

appEvents.on(EVENTS.ATTENDANCE_MARKED, (payload) => {
  io.to(`section:${payload.section}`).emit('attendance:updated', payload);
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_management')
  .then(() => {
    const port = process.env.PORT || 5000;
    server.listen(port, () => console.log(`CampusPulse running at http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
