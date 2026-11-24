require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Section = require('./models/Section');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const Setting = require('./models/Setting');
const AttendanceAudit = require('./models/AttendanceAudit');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_management');
  await Promise.all([
    User.deleteMany({}), Course.deleteMany({}), Section.deleteMany({}),
    Attendance.deleteMany({}), Announcement.deleteMany({}), Setting.deleteMany({}), AttendanceAudit.deleteMany({})
  ]);

  const [admin, faculty1, faculty2, ...students] = await User.create([
    { name: 'Aarav Mehta', email: 'admin@campus.edu', password: 'Admin@123', role: 'admin', department: 'Administration', employeeId: 'ADM-001' },
    { name: 'Dr. Priya Sharma', email: 'priya@campus.edu', password: 'Faculty@123', role: 'faculty', department: 'Computer Science', employeeId: 'FAC-101' },
    { name: 'Prof. Rohan Das', email: 'rohan@campus.edu', password: 'Faculty@123', role: 'faculty', department: 'Computer Science', employeeId: 'FAC-102' },
    { name: 'Sneha Joshi', email: 'sneha@campus.edu', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'CS-2024-018' },
    { name: 'Arjun Patel', email: 'arjun@campus.edu', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'CS-2024-021' },
    { name: 'Meera Nair', email: 'meera@campus.edu', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'CS-2024-024' },
    { name: 'Kabir Singh', email: 'kabir@campus.edu', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'CS-2024-031' },
    { name: 'Ishita Rao', email: 'ishita@campus.edu', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'CS-2024-035' }
  ]);

  const [course1, course2, course3] = await Course.create([
    { code: 'CS301', title: 'Data Structures & Algorithms', description: 'Core data structures, algorithms and problem solving.', credits: 4, department: 'Computer Science', semester: 5 },
    { code: 'CS305', title: 'Database Management Systems', description: 'Relational and NoSQL database systems.', credits: 4, department: 'Computer Science', semester: 5 },
    { code: 'CS310', title: 'Operating Systems', description: 'Processes, memory, scheduling and file systems.', credits: 3, department: 'Computer Science', semester: 5 }
  ]);

  const [section1, section2, section3] = await Section.create([
    { name: 'A', course: course1._id, faculty: faculty1._id, students: students.map((student) => student._id), room: 'C-201', schedule: 'Mon & Wed, 9:00 AM', academicYear: '2026-27' },
    { name: 'B', course: course2._id, faculty: faculty2._id, students: students.map((student) => student._id), room: 'C-305', schedule: 'Tue & Thu, 11:00 AM', academicYear: '2026-27' },
    { name: 'A', course: course3._id, faculty: faculty1._id, students: students.map((student) => student._id), room: 'D-102', schedule: 'Fri, 10:00 AM', academicYear: '2026-27' }
  ]);

  const attendanceDays = [3, 5, 7, 10, 12];
  const attendanceDocs = [];
  for (let i = 0; i < attendanceDays.length; i++) {
    for (const section of [section1, section2, section3]) {
      attendanceDocs.push({
        course: section.course,
        section: section._id,
        markedBy: section.faculty,
        classDate: new Date(2026, 10, attendanceDays[i]),
        topic: ['Graphs', 'Sorting', 'Trees', 'SQL Joins', 'Indexing'][i],
        records: students.map((student, index) => ({
          student: student._id,
          status: (i === 4 && index === 3) || (i === 2 && index === 4) ? 'absent' : (index === 1 && i === 1 ? 'late' : 'present')
        }))
      });
    }
  }
  await Attendance.create(attendanceDocs);

  await Announcement.create([
    { title: 'Mid-semester examinations scheduled', body: 'The mid-semester examination timetable will be available on the student portal from Monday. Please verify your course registrations.', category: 'academic', audience: { type: 'university' }, createdBy: admin._id },
    { title: 'Data Structures lab begins Friday', body: 'Section A students should bring their laptops to C-201 for the practical lab session.', category: 'general', audience: { type: 'section', section: section1._id }, createdBy: faculty1._id },
    { title: 'Campus Innovation Fest', body: 'Registrations are open for the annual innovation showcase. Submit project proposals before November 30.', category: 'event', audience: { type: 'university' }, createdBy: admin._id }
  ]);

  await Setting.create({ key: 'attendanceThreshold', value: 75 });

  console.log('Seed complete');
  console.log('Admin: admin@campus.edu / Admin@123');
  console.log('Faculty: priya@campus.edu / Faculty@123');
  console.log('Student: sneha@campus.edu / Student@123');
  await mongoose.disconnect();
}

seed().catch((error) => { console.error(error); process.exit(1); });
