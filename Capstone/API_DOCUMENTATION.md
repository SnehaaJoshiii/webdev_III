# CampusPulse REST API Documentation

Base URL: `http://localhost:5050/api`

Send protected requests with:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

## Authentication

### POST /auth/register
Creates a `student` or `faculty` account. `name`, `email`, and `password` are required.

```json
{
  "name": "Student Name",
  "email": "student@campus.edu",
  "password": "Student@123",
  "role": "student",
  "department": "Computer Science",
  "studentId": "CS-2026-001"
}
```

Success: `201` with user and access/refresh tokens. Validation: `400`. Duplicate email: `409`.

### POST /auth/login

```json
{ "email": "admin@campus.edu", "password": "Admin@123" }
```

Success: `200`. Invalid credentials: `401`. Missing fields: `400`.

### POST /auth/refresh

```json
{ "refreshToken": "<refreshToken>" }
```

Success: `200` with a rotated refresh token and new access token. Invalid or expired token: `401`.

### POST /auth/logout
Authenticated. Body: `{ "refreshToken": "<refreshToken>" }`.

## Users

- `GET /users/me` - authenticated profile
- `PATCH /users/me` - update name, department, phone or avatar
- `GET /users?page=1&limit=10&role=student&search=Sneha` - administrator only
- `POST /users` - administrator account creation
- `PATCH /users/:id` - administrator
- `DELETE /users/:id` - administrator

Unauthorized token: `401`. Insufficient role: `403`. Missing resource: `404`.

## Courses

- `GET /courses?page=1&limit=10&department=Computer&search=database`
- `GET /courses/:id`
- `POST /courses` - administrator only
- `PATCH /courses/:id` - administrator only
- `DELETE /courses/:id` - administrator only

Course payload:

```json
{
  "code": "CS401",
  "title": "Artificial Intelligence",
  "description": "AI foundations",
  "credits": 4,
  "department": "Computer Science",
  "semester": 6
}
```

## Sections

- `GET /sections` - role-filtered
- `POST /sections` - administrator
- `PATCH /sections/:id` - administrator
- `DELETE /sections/:id` - administrator
- `POST /sections/:id/enroll` - administrator

Section payload:

```json
{
  "name": "A",
  "course": "<courseId>",
  "faculty": "<facultyUserId>",
  "room": "C-201",
  "schedule": "Mon & Wed, 9:00 AM",
  "academicYear": "2026-27"
}
```

Duplicate enrolment: `409`. Invalid course/faculty: `400`.

## Attendance

### POST /attendance
Administrator or assigned faculty.

```json
{
  "sectionId": "<sectionId>",
  "classDate": "2026-11-24",
  "topic": "Graph Traversal",
  "records": [
    { "student": "<studentId>", "status": "present" },
    { "student": "<studentId>", "status": "absent" }
  ]
}
```

Valid statuses are `present`, `absent`, and `late`. Duplicate section/date or duplicate student: `409`.

- `PATCH /attendance/:id/correct` - administrator or assigned faculty
- `GET /attendance/me` - student
- `GET /attendance/student/:studentId` - administrator/faculty

Correction body:

```json
{
  "recordId": "<embeddedAttendanceRecordId>",
  "status": "present",
  "reason": "Faculty confirmed attendance"
}
```

## Announcements

- `GET /announcements?page=1&limit=10&category=academic`
- `POST /announcements` - administrator/faculty
- `DELETE /announcements/:id` - creator or administrator

```json
{
  "title": "Examination timetable",
  "body": "The timetable is available on the student portal.",
  "category": "academic",
  "audience": { "type": "university" }
}
```

Section audience example: `{ "type": "section", "section": "<sectionId>" }`.

## Reports

- `GET /reports/dashboard`
- `GET /reports/attendance/low?threshold=75`
- `GET /reports/enrolments`
- `GET /reports/attendance/csv`
- `GET /reports/attendance/audit`
- `GET /reports/settings/attendance-threshold` - administrator
- `PUT /reports/settings/attendance-threshold` - administrator

Threshold payload:

```json
{ "threshold": 75 }
```

## Real-time Socket.IO

Connect with an access token:

```javascript
const socket = io("http://localhost:5050", {
  auth: { token: accessToken }
});
```

- `announcement:new` - receives an announcement object
- `attendance:updated` - receives `{ section, course, classDate, records }`
