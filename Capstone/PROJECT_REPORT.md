# University Campus Management System

## Cover Page

**Project:** University Campus Management System  
**Technology:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO  
**Application name:** CampusPulse

## Abstract

CampusPulse is a centralized campus administration platform for students, faculty and administrators. It manages academic users, courses, sections, enrolments, attendance, announcements and analytical reports. JWT authentication and role-based authorization protect private data and operations. The system provides a responsive demonstration UI and real-time notification support.

## Problem Statement

University academic information is often divided across manual records and disconnected portals. The project provides one backend and user interface for routine workflows while applying authentication, validation and role-specific access rules.

## Objectives

- Maintain course, section, faculty and student relationships.
- Secure user authentication and role-specific operations.
- Mark and correct attendance without duplicate sessions.
- Calculate subject-wise attendance percentages.
- Publish university, course and section announcements.
- Generate attendance and enrolment analytics.
- Demonstrate real-time announcements and attendance updates.

## Scope and Limitations

The project includes core campus administration workflows and seed data. CSV attendance export is included. Timetable and PDF report features are not required minimum deliverables. A real university identity system and genuine file-storage service are outside this academic scope.

## Functional and Non-Functional Requirements

Functional modules include authentication, profile management, user administration, course and section management, enrolment, attendance, announcements and reporting.

Non-functional requirements include password hashing, JWT authorization, centralized error handling, request logging, rate limiting, pagination, HTTP status consistency, responsive UI and MongoDB validation.

## System Architecture

The application follows an MVC/layered structure:

- Routes define REST endpoints.
- Controllers enforce workflow and business rules.
- Mongoose models define persistence and validation.
- Middleware performs authentication, authorization and centralized errors.
- Express serves the REST API and static frontend.
- Socket.IO serves authenticated real-time events.
- EventEmitter decouples application events from real-time delivery.

Request flow:

`Browser/Postman -> Route -> Authentication/Authorization Middleware -> Controller -> Mongoose Model -> MongoDB -> JSON/CSV Response`

## Database Design

Collections:

| Collection | Purpose |
|---|---|
| users | Students, faculty and administrators |
| courses | Course catalogue |
| sections | Faculty/course assignments and student enrolments |
| attendances | Class-session records and student statuses |
| announcements | University/course/section notices |
| attendanceaudits | Attendance correction history |
| settings | Configurable attendance threshold |

References connect sections to courses and faculty, sections to students, and attendance sessions to sections, courses and marking faculty.

Indexes include unique course codes, unique section/course names, role/department lookup, section attendance-date uniqueness, student/course attendance lookup, and announcement ordering.

## REST API Documentation

See `API_DOCUMENTATION.md` and `CampusPulse.postman_collection.json`.

## Authentication and Authorization

Passwords are hashed with bcrypt before storage. Login issues a short-lived JWT access token and a longer-lived refresh token. Refresh tokens are stored as SHA-256 hashes and rotated. Protected routes verify access-token signatures and the active user record. RBAC restricts administrator and faculty operations.

## Implementation Details

Attendance is stored once per section/date to prevent duplicate class sessions. Individual student records are embedded in the session, and a separate audit collection records every correction. Students can only read their own attendance. Faculty are checked against the section assignment before marking or correcting attendance.

Two MongoDB aggregation pipelines calculate low-attendance students and section/course enrolment counts.

## Real-Time Design

Meaningful EventEmitter events represent announcement creation and attendance updates. Socket.IO server listeners deliver corresponding real-time UI notifications. Socket connections require a valid JWT.

## Testing Strategy

The test suite covers:

- Successful login
- Missing login fields
- Protected route without a token
- Student access denied for administrator resources
- Unknown resource response

Postman scenarios cover positive requests, validation failures, unauthorized access, insufficient roles, duplicate or conflicting requests and resource-not-found cases.

Run:

```bash
npm run seed
npm test
```

## Screenshots and Demonstration

Demonstrate:

1. Administrator login and people/course views.
2. Faculty login and section attendance marking.
3. Student login and private attendance summary.
4. Announcement creation and real-time notification.
5. Low-attendance report and CSV download.
6. Unauthorized Postman request response.

## Conclusion

The project demonstrates backend architecture, MongoDB modelling, REST API design, authentication, role authorization, validation, reporting, audit handling and real-time communication.

## Future Enhancements

- PDF attendance reports
- Timetable module
- Automated low-attendance email or notification alerts
- Multi-file upload and cloud storage
- Automated CI/Postman test execution
