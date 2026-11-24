# CampusPulse - University Campus Management System

A full-stack university administration system built with Node.js, Express.js, MongoDB, Mongoose and Socket.IO. It includes a lively responsive UI and role-based APIs for administrators, faculty and students.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | admin@campus.edu | Admin@123 |
| Faculty | priya@campus.edu | Faculty@123 |
| Student | sneha@campus.edu | Student@123 |

## Prerequisites

- Node.js 18+
- MongoDB 6+
- npm

## Setup

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

Open `http://localhost:5050`.

Update `.env` to use another MongoDB URI or port. Never commit the real `.env` file.

## Environment variables

```text
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/campus_management
JWT_ACCESS_SECRET=replace_with_a_long_random_access_secret
JWT_REFRESH_SECRET=replace_with_a_long_random_refresh_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

## Core REST APIs

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Student/faculty registration |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Authenticated |
| GET/PATCH | `/api/users/me` | Authenticated |
| CRUD | `/api/users/*` | Administrator |
| CRUD | `/api/courses/*` | Admin writes, authenticated reads |
| CRUD | `/api/sections/*` | Admin writes, role-filtered reads |
| POST | `/api/attendance` | Admin/faculty |
| PATCH | `/api/attendance/:id/correct` | Admin/faculty |
| GET | `/api/attendance/me` | Student |
| CRUD | `/api/announcements/*` | Admin/faculty writes |
| GET | `/api/reports/dashboard` | Authenticated |
| GET | `/api/reports/attendance/low?threshold=75` | Admin/faculty |
| GET | `/api/reports/enrolments` | Admin/faculty |

Send authenticated requests with `Authorization: Bearer <accessToken>`.

Additional reports:

- `GET /api/reports/attendance/csv` - download CSV attendance
- `GET /api/reports/attendance/audit` - view attendance corrections
- `GET /api/reports/settings/attendance-threshold` - administrator threshold
- `PUT /api/reports/settings/attendance-threshold` - update threshold

## API testing

Start MongoDB and seed the database, then run:

```bash
npm run seed
npm test
```

A Postman collection is provided in `CampusPulse.postman_collection.json`. API details are in `API_DOCUMENTATION.md`, and the academic report is in `PROJECT_REPORT.md`.

## Real-time events

Socket.IO connections require a valid access token:

```javascript
io("http://localhost:5050", { auth: { token: accessToken } })
```

- `announcement:new` - delivered to relevant announcement audiences
- `attendance:updated` - emitted when attendance is marked for a section

## MongoDB design

The application uses `User`, `Course`, `Section`, `Attendance`, and `Announcement` collections. Sections connect courses, faculty and enrolled students. Attendance stores a one-class-session document with embedded student records. Suitable indexes include unique course codes, unique section/course combinations, role/department lookup, section date uniqueness, student/course attendance lookup, and announcement ordering.

Aggregation reports cover low-attendance students and section/course enrolment counts.

## Testing

Use the demo UI or send POST requests for login and protected resources. Positive, validation, unauthorized, forbidden, duplicate-enrolment and low-attendance scenarios can be exercised through the API.
