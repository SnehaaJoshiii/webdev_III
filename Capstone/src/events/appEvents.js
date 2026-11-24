const EventEmitter = require('events');

const appEvents = new EventEmitter();
const EVENTS = Object.freeze({
  ANNOUNCEMENT_CREATED: 'announcement:created',
  ATTENDANCE_MARKED: 'attendance:marked',
  ATTENDANCE_CORRECTED: 'attendance:corrected'
});

module.exports = { appEvents, EVENTS };
