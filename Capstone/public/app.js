const app = document.getElementById('app');
const toastContainer = document.getElementById('toastContainer');
const state = { token: localStorage.getItem('campusAccess'), refreshToken: localStorage.getItem('campusRefresh'), user: JSON.parse(localStorage.getItem('campusUser') || 'null'), view: 'dashboard' };

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  courses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M7 9v6c3 3 7 3 10 0V9"/></svg>',
  attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18m-13 4 2 2 4-4"/></svg>',
  announcements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21h-3.46"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>'
};

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed');
  return body;
}

function loginTemplate() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-visual">
        <div class="brand-on-image"><span class="brand-mark">C</span><span>CampusPulse</span></div>
        <div class="visual-copy">
          <h1>One campus.<br>One connected space.</h1>
          <p>Manage academics, attendance and announcements with clarity, speed and confidence.</p>
        </div>
      </section>
      <section class="login-panel">
        <div class="login-card">
          <div style="color:var(--blue);font-weight:800;font-size:13px">UNIVERSITY PORTAL</div>
          <h2>Welcome back</h2>
          <p class="subtitle">Sign in to continue to your campus dashboard.</p>
          <form id="loginForm">
            <div class="field"><label>Email address</label><input id="email" type="email" value="admin@campus.edu" required></div>
            <div class="field"><label>Password</label><div class="password-field"><input id="password" type="password" value="Admin@123" required><button type="button" class="password-toggle" id="togglePassword">Show</button></div></div>
            <button class="primary-btn" type="submit">Sign in</button>
          </form>
          <div class="demo-grid">
            <button class="demo-btn" data-login="admin@campus.edu|Admin@123">Admin</button>
            <button class="demo-btn" data-login="priya@campus.edu|Faculty@123">Faculty</button>
            <button class="demo-btn" data-login="sneha@campus.edu|Student@123">Student</button>
          </div>
        </div>
      </section>
    </main>`;

  document.getElementById('togglePassword').onclick = (event) => {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
    event.target.textContent = input.type === 'password' ? 'Show' : 'Hide';
  };
  document.querySelectorAll('.demo-btn').forEach((button) => button.onclick = () => {
    const [email, password] = button.dataset.login.split('|');
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
  });
  document.getElementById('loginForm').onsubmit = async (event) => {
    event.preventState?.();
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    button.textContent = 'Signing in...';
    try {
      const body = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value }) });
      state.token = body.data.accessToken;
      state.refreshToken = body.data.refreshToken;
      state.user = body.data.user;
      localStorage.setItem('campusAccess', state.token);
      localStorage.setItem('campusRefresh', state.refreshToken);
      localStorage.setItem('campusUser', JSON.stringify(state.user));
      toast(`Welcome, ${state.user.name}`);
      renderShell();
      connectSocket();
    } catch (error) {
      toast(error.message);
      button.disabled = false;
      button.textContent = 'Sign in';
    }
  };
}

function roleLabel(role) { return role.charAt(0).toUpperCase() + role.slice(1); }
function initials(name) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
function dateLabel(date = new Date()) { return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }

function renderShell() {
  const items = [
    ['dashboard', 'Dashboard'], ['courses', 'Courses'],
    ...(state.user.role === 'admin' ? [['users', 'People']] : []),
    ['attendance', 'Attendance'], ['announcements', 'Announcements']
  ];
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark">C</span><span>CampusPulse</span></div>
        <nav class="nav-list">${items.map(([key, label]) => `<button class="nav-item ${state.view === key ? 'active' : ''}" data-view="${key}">${icons[key]}<span>${label}</span></button>`).join('')}</nav>
        <div class="sidebar-bottom">
          <div class="profile-mini"><div class="avatar">${initials(state.user.name)}</div><div><strong>${state.user.name}</strong><span>${roleLabel(state.user.role)}</span></div></div>
          <button class="nav-item" id="logoutBtn">${icons.logout}<span>Log out</span></button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar"><div class="topbar-title"><h1>University Campus</h1><span>Academic year 2026–27</span></div><div class="top-actions"><button class="icon-btn" title="Notifications">${icons.announcements}</button><div class="avatar">${initials(state.user.name)}</div></div></header>
        <div class="content" id="content"></div>
      </main>
    </div>`;
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.onclick = () => {
    state.view = button.dataset.view;
    renderShell();
  });
  document.getElementById('logoutBtn').onclick = logout;
  renderView();
}

async function logout() {
  try { await api('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: state.refreshToken }) }); } catch (_) {}
  ['campusAccess', 'campusRefresh', 'campusUser'].forEach((key) => localStorage.removeItem(key));
  state.token = state.refreshToken = null; state.user = null;
  loginTemplate();
}

async function renderView() {
  const content = document.getElementById('content');
  if (state.view === 'dashboard') return renderDashboard(content);
  if (state.view === 'courses') return renderCourses(content);
  if (state.view === 'users') return renderUsers(content);
  if (state.view === 'attendance') return renderAttendance(content);
  if (state.view === 'announcements') return renderAnnouncements(content);
}

async function renderDashboard(content) {
  content.innerHTML = `<div class="welcome"><div><h2>Good morning, ${state.user.name.split(' ')[0]}</h2><p>Here is what is happening across your campus today.</p></div><div class="date-pill">${dateLabel()}</div></div><div id="dashboardStats" class="stat-grid"><div class="stat-card"><div class="stat-icon">•••</div><div><strong>—</strong><span>Loading</span></div></div></div><div class="grid-main"><div class="card"><div class="card-head"><h3>Today’s schedule</h3><button class="text-btn" data-go="courses">View all</button></div><div class="schedule" id="schedule"></div></div><div class="card"><div class="card-head"><h3>Announcements</h3><button class="text-btn" data-go="announcements">View all</button></div><div class="announcements" id="announcementsPreview"></div></div></div>`;
  content.querySelector('[data-go="courses"]').onclick = () => { state.view = 'courses'; renderShell(); };
  content.querySelector('[data-go="announcements"]').onclick = () => { state.view = 'announcements'; renderShell(); };
  try {
    const [stats, sections, announcements] = await Promise.all([
      api('/api/reports/dashboard'),
      api('/api/sections'),
      api('/api/announcements?limit=4')
    ]);
    const numbers = state.user.role === 'student'
      ? [sections.data.length, '5 of 6', '92%', '3']
      : [stats.data.students, stats.data.faculty, stats.data.sections, stats.data.attendanceSessions];
    const labels = state.user.role === 'student'
      ? ['Enrolled courses', 'Classes today', 'Attendance', 'Announcements']
      : ['Total students', 'Faculty members', 'Active sections', 'Classes recorded'];
    document.getElementById('dashboardStats').innerHTML = numbers.map((number, i) => `<div class="stat-card"><div class="stat-icon">${['◫','♙','▦','♪'][i]}</div><div><strong>${number}</strong><span>${labels[i]}</span></div></div>`).join('');
    const schedules = sections.data.slice(0, 4);
    document.getElementById('schedule').innerHTML = schedules.length ? schedules.map((section, i) => `
      <div class="schedule-row"><div class="time">${['09:00','11:00','14:30','16:00'][i]}</div><div class="course-cell"><strong>${section.course?.code || 'Course'} · ${section.course?.title || section.name}</strong><span>${section.room || 'Campus'} · ${section.faculty?.name || 'Faculty'}</span></div><span class="status present">Scheduled</span></div>`).join('') : '<div class="empty">No classes assigned.</div>';
    document.getElementById('announcementsPreview').innerHTML = announcements.data.length ? announcements.data.map((item) => `
      <div class="announcement"><div class="announcement-icon">⌁</div><div><strong>${item.title}</strong><p>${item.body}</p></div></div>`).join('') : '<div class="empty">No announcements yet.</div>';
  } catch (error) { toast(error.message); }
}

async function renderCourses(content) {
  content.innerHTML = `<div class="page-header"><div><h2>Courses</h2><p style="color:var(--muted);margin:5px 0 0;font-size:12px">Manage and explore academic programs</p></div>${state.user.role === 'admin' ? '<button class="secondary-btn" id="addCourse">+ Add course</button>' : ''}</div><div class="course-grid" id="courseGrid"><div class="empty">Loading courses...</div></div>`;
  if (document.getElementById('addCourse')) document.getElementById('addCourse').onclick = () => openCourseModal();
  try {
    const body = await api('/api/courses?limit=100');
    const images = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=700&q=80'
    ];
    document.getElementById('courseGrid').innerHTML = body.data.map((course, i) => `
      <article class="card course-card"><div class="course-cover" style="background-image:url('${images[i % images.length]}')"><span>${course.code}</span></div><div class="course-body"><h3>${course.title}</h3><p>${course.description || 'Explore course content, classes and academic resources.'}</p><div class="course-meta"><span>${course.department}</span><span>${course.credits} credits</span></div></div></article>`).join('') || '<div class="empty">No courses found.</div>';
  } catch (error) { toast(error.message); }
}

function openCourseModal() {
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal"><div class="modal"><div class="modal-head"><h3>Add course</h3><button class="icon-btn" id="closeModal">×</button></div><form class="modal-body" id="courseForm"><div class="modal-grid"><div class="field"><label>Course code</label><input name="code" required placeholder="CS401"></div><div class="field"><label>Credits</label><input name="credits" type="number" min="1" max="10" value="4" required></div></div><div class="field"><label>Title</label><input name="title" required></div><div class="modal-grid"><div class="field"><label>Department</label><input name="department" value="Computer Science" required></div><div class="field"><label>Semester</label><input name="semester" type="number" min="1" max="12" value="6" required></div></div><div class="field"><label>Description</label><textarea name="description" rows="3"></textarea></div><div class="modal-actions"><button type="button" class="secondary-btn" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Create course</button></div></form></div></div>`);
  const close = () => document.getElementById('modal').remove();
  document.getElementById('closeModal').onclick = close;
  document.getElementById('cancelModal').onclick = close;
  document.getElementById('courseForm').onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    values.credits = Number(values.credits); values.semester = Number(values.semester);
    try { await api('/api/courses', { method: 'POST', body: JSON.stringify(values) }); close(); toast('Course created'); renderCourses(document.getElementById('content')); }
    catch (error) { toast(error.message); }
  };
}

async function renderUsers(content) {
  content.innerHTML = `<div class="page-header"><div><h2>People</h2><p style="color:var(--muted);margin:5px 0 0;font-size:12px">Students and faculty directory</p></div></div><div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Person</th><th>Role</th><th>Department</th><th>ID</th><th>Status</th></tr></thead><tbody id="usersTable"></tbody></table></div></div>`;
  try {
    const body = await api('/api/users?limit=100');
    document.getElementById('usersTable').innerHTML = body.data.map((user) => `<tr><td><div class="person"><div class="avatar">${initials(user.name)}</div><strong>${user.name}<br><span style="color:var(--muted);font-weight:400">${user.email}</span></strong></div></td><td><span class="pill">${roleLabel(user.role)}</span></td><td>${user.department}</td><td>${user.studentId || user.employeeId || '—'}</td><td><span class="status ${user.isActive ? 'present' : 'absent'}">${user.isActive ? 'Active' : 'Inactive'}</span></td></tr>`).join('');
  } catch (error) { toast(error.message); }
}

async function renderAttendance(content) {
  content.innerHTML = `<div class="page-header"><div><h2>Attendance</h2><p style="color:var(--muted);margin:5px 0 0;font-size:12px">Session records and subject-wise performance</p></div>${state.user.role !== 'student' ? '<div style="display:flex;gap:8px"><button class="secondary-btn" id="downloadAttendance">Download CSV</button><button class="secondary-btn" id="markAttendance">+ Mark attendance</button></div>' : ''}</div><div class="card table-card"><div class="card-head"><h3>${state.user.role === 'student' ? 'My attendance summary' : 'Low attendance report'}</h3></div><div class="table-wrap"><table><thead><tr><th>Course</th><th>Present / Late</th><th>Total classes</th><th>Percentage</th><th>Status</th></tr></thead><tbody id="attendanceTable"></tbody></table></div></div>`;
  if (document.getElementById('markAttendance')) document.getElementById('markAttendance').onclick = openAttendanceModal;
  if (document.getElementById('downloadAttendance')) document.getElementById('downloadAttendance').onclick = async () => {
    try {
      const response = await fetch('/api/reports/attendance/csv', { headers: { Authorization: `Bearer ${state.token}` } });
      if (!response.ok) throw new Error('Unable to download attendance report');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'attendance-report.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) { toast(error.message); }
  };
  try {
    if (state.user.role === 'student') {
      const body = await api('/api/attendance/me');
      document.getElementById('attendanceTable').innerHTML = body.data.summary.map((item) => `<tr><td><strong>${item.course.code}</strong><br><span style="color:var(--muted)">${item.course.title}</span></td><td>${item.attended}</td><td>${item.total}</td><td><strong>${item.percentage}%</strong></td><td><span class="status ${item.percentage >= 75 ? 'present' : 'absent'}">${item.percentage >= 75 ? 'Good standing' : 'Low attendance'}</span></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No attendance data.</td></tr>';
    } else {
      const body = await api('/api/reports/attendance/low?threshold=75');
      document.getElementById('attendanceTable').innerHTML = body.data.map((item) => `<tr><td><strong>${item.courseCode}</strong><br><span style="color:var(--muted)">${item.courseTitle}</span></td><td>${item.attended}</td><td>${item.total}</td><td><strong>${item.percentage}%</strong></td><td><span class="status absent">Needs alert</span></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No low-attendance students.</td></tr>';
    }
  } catch (error) { toast(error.message); }
}

async function openAttendanceModal() {
  let sections;
  try { sections = (await api('/api/sections')).data; } catch (error) { return toast(error.message); }
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal"><div class="modal"><div class="modal-head"><h3>Mark attendance</h3><button class="icon-btn" id="closeModal">×</button></div><form class="modal-body" id="attendanceForm"><div class="field"><label>Section</label><select name="sectionId" id="sectionSelect" required>${sections.map((section) => `<option value="${section._id}">${section.course?.code} · Section ${section.name}</option>`).join('')}</select></div><div class="modal-grid"><div class="field"><label>Class date</label><input name="classDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Topic</label><input name="topic" placeholder="e.g. Graph Traversal"></div></div><div id="attendanceRecords"></div><div class="modal-actions"><button type="button" class="secondary-btn" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Save attendance</button></div></form></div></div>`);
  const close = () => document.getElementById('modal').remove();
  document.getElementById('closeModal').onclick = close; document.getElementById('cancelModal').onclick = close;
  const populate = () => {
    const section = sections.find((item) => item._id === document.getElementById('sectionSelect').value);
    document.getElementById('attendanceRecords').innerHTML = section?.students?.map((student, i) => `<div class="field"><label>${student.name} · ${student.studentId}</label><select name="status-${i}" data-student="${student._id}"><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option></select></div>`).join('') || '<p class="empty">No students enrolled.</p>';
  };
  document.getElementById('sectionSelect').onchange = populate; populate();
  document.getElementById('attendanceForm').onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    const records = [...event.target.querySelectorAll('[data-student]')].map((select) => ({ student: select.dataset.student, status: select.value }));
    try {
      await api('/api/attendance', { method: 'POST', body: JSON.stringify({ sectionId: values.sectionId, classDate: values.classDate, topic: values.topic, records }) });
      close(); toast('Attendance recorded'); renderAttendance(document.getElementById('content'));
    } catch (error) { toast(error.message); }
  };
}

async function renderAnnouncements(content) {
  content.innerHTML = `<div class="page-header"><div><h2>Announcements</h2><p style="color:var(--muted);margin:5px 0 0;font-size:12px">Campus updates and academic notices</p></div>${state.user.role !== 'student' ? '<button class="secondary-btn" id="addAnnouncement">+ New announcement</button>' : ''}</div><div class="card" id="announcementList"><div class="empty">Loading announcements...</div></div>`;
  if (document.getElementById('addAnnouncement')) document.getElementById('addAnnouncement').onclick = openAnnouncementModal;
  loadAnnouncements();
}

async function loadAnnouncements() {
  try {
    const body = await api('/api/announcements?limit=50');
    document.getElementById('announcementList').innerHTML = body.data.length ? `<div class="announcements">${body.data.map((item) => `<div class="announcement" style="padding:16px 18px"><div class="announcement-icon">${item.category === 'urgent' ? '!' : '⌁'}</div><div style="flex:1"><strong style="font-size:14px">${item.title}</strong><p style="font-size:12px">${item.body}</p><span class="pill" style="margin-top:8px">${item.category}</span></div><span style="color:var(--muted);font-size:10px">${new Date(item.createdAt).toLocaleDateString()}</span></div>`).join('')}</div>` : '<div class="empty">No announcements yet.</div>';
  } catch (error) { toast(error.message); }
}

function openAnnouncementModal() {
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal"><div class="modal"><div class="modal-head"><h3>New announcement</h3><button class="icon-btn" id="closeModal">×</button></div><form class="modal-body" id="announcementForm"><div class="field"><label>Title</label><input name="title" required></div><div class="field"><label>Message</label><textarea name="body" rows="4" required></textarea></div><div class="modal-grid"><div class="field"><label>Category</label><select name="category"><option value="general">General</option><option value="academic">Academic</option><option value="event">Event</option><option value="urgent">Urgent</option></select></div><div class="field"><label>Audience</label><select name="audienceType"><option value="university">University-wide</option></select></div></div><div class="modal-actions"><button type="button" class="secondary-btn" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Publish</button></div></form></div></div>`);
  const close = () => document.getElementById('modal').remove();
  document.getElementById('closeModal').onclick = close; document.getElementById('cancelModal').onclick = close;
  document.getElementById('announcementForm').onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    try {
      await api('/api/announcements', { method: 'POST', body: JSON.stringify({ title: values.title, body: values.body, category: values.category, audience: { type: values.audienceType } }) });
      close(); toast('Announcement published'); loadAnnouncements();
    } catch (error) { toast(error.message); }
  };
}

function connectSocket() {
  if (!window.io) return;
  const socket = io({ auth: { token: state.token } });
  socket.on('announcement:new', (announcement) => toast(`New announcement: ${announcement.title}`));
  socket.on('attendance:updated', () => toast('Attendance was updated'));
}

if (state.token && state.user) { renderShell(); connectSocket(); } else { loginTemplate(); }
