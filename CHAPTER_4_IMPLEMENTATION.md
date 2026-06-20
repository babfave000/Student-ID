# Chapter 4: Implementation Write-Up

## 4.1 Introduction

This chapter describes the implementation of the Automated Student ID Card Registration, Batching, and Notification System. The application was implemented as a web-based system with a Node.js/Express backend and a React frontend, backed by a MySQL database. The implementation was designed to support student registration, approval workflow, batch production management, and automated notifications.

> Image placeholder: Student login or dashboard screenshot

![Figure 4.1: System Login or Dashboard](images/placeholder-login-dashboard.png)

## 4.2 System Architecture

The application is structured in a two-tier architecture:

- Backend API server built with Node.js and Express
- Frontend client built with React and Vite
- MySQL relational database for persistent storage

The backend exposes REST API routes for authentication, student registration, administrative workflows, batching, and reporting. The frontend consumes these APIs and provides role-based interfaces for students and staff.

> Image placeholder: Architecture diagram

![Figure 4.2: System Architecture Overview](images/placeholder-architecture.png)

## 4.3 Backend Implementation

The backend is implemented inside the `backend/` directory and includes the following core parts:

- `server.js`
- `config/` for configuration utilities
- `controllers/` for request handlers
- `routes/` for endpoint definitions
- `middleware/` for authentication and validation
- `models/` for data access
- `services/` for workflow and notification logic
- `uploads/` for student passport photos
- `utils/` for shared helpers and logging

### 4.3.1 Server Configuration

The server entry point is `backend/server.js`. It initializes Express middleware, security headers, CORS rules, body parsing, rate limiting, and static file serving for uploaded images.

Key middleware and setup include:

- `helmet` for basic security headers
- `cors` configured for local development and production origins
- `express.json()` and `express.urlencoded()` for request parsing
- `express-rate-limit` to prevent request spamming
- static serving of `/uploads` for photo retrieval

### 4.3.2 Authentication

Authentication is implemented using JWT tokens. The backend provides separate login routes for student and staff accounts under `/api/auth`.

Important features:

- Student login by matriculation number
- Staff login by username and password
- JWT generation for authenticated sessions
- Middleware guards in `backend/middleware/authMiddleware.js` that validate tokens and restrict access by role

### 4.3.3 Registration Workflow

Student registration is handled through the `backend/routes/registrations.js` route module. All registration routes require authenticated student access.

Registration flow highlights:

- Create or update registration with student details and photo upload
- Submit registration for approval
- Save registration status transitions in the `id_registrations` table
- Store uploaded passport photos in `backend/uploads`

File upload support uses `multer` with restrictions for JPEG/JPG/PNG images and a 5MB file size limit.

### 4.3.4 Batch Management and Admin Operations

Administrative functionality is implemented in `backend/routes/admin.js` and `backend/controllers/adminController.js`.

Admin features include:

- Review pending and approved registrations
- Approve or reject student applications
- Create production batches and update batch statuses
- Generate batch reports and monitor batch lifecycle
- Retrieve audit logs and notification logs

Batch operations are supported by the `production_batches` and `batch_registrations` tables, enabling a many-to-many relationship between batches and registrations.

### 4.3.5 Workflow and Notifications

The workflow engine is implemented in `backend/services/workflowService.js`.

The workflow service defines valid status transitions and enforces state rules such as:

- `DRAFT` → `SUBMITTED`
- `SUBMITTED` → `UNDER_REVIEW` / `APPROVED` / `REJECTED`
- `APPROVED` → `BATCHED`
- `BATCHED` → `PRINTED`
- `PRINTED` → `READY_FOR_COLLECTION`
- `READY_FOR_COLLECTION` → `COLLECTED`

Notifications are implemented in `backend/services/notificationService.js`. The service:

- Sends emails through configured SMTP
- Logs notification attempts in `notification_logs`
- Provides notification routines for registration submission, approval, batching, collection readiness, and rejection

> Image placeholder: Admin batch management or notifications screenshot

![Figure 4.3: Admin Batch Management Interface](images/placeholder-admin-batch.png)

### 4.3.6 Database Schema

The database schema is defined in `database/schema.sql`. Key tables include:

- `students`: stores student profile data
- `staff_users`: stores administrative user accounts
- `id_registrations`: stores registration application records and workflow status
- `production_batches`: stores production batch records
- `batch_registrations`: links registrations to batches
- `audit_log`: records actions and status changes
- `notification_logs`: records notification history

The schema uses foreign key constraints and indexes to support referential integrity and query performance. Status fields are implemented with `ENUM` values for workflow control.

> Image placeholder: Database schema diagram

![Figure 4.4: Database Schema Diagram](images/placeholder-schema.png)

## 4.4 Frontend Implementation

The frontend is implemented inside the `frontend/` directory using React with Vite and Tailwind CSS.

### 4.4.1 Routing and Access Control

The main application file is `frontend/src/App.jsx`. It uses React Router to define routes for:

- `/login`
- `/student/dashboard`
- `/student/registration`
- `/admin/dashboard`
- `/admin/registrations`
- `/admin/batches`
- `/admin/batches/:id`

Protected routes are wrapped with a `ProtectedRoute` component that checks authentication state and user role through `frontend/src/context/AuthContext.jsx`.

### 4.4.2 Application Pages

Relevant page components include:

- `LoginPage.jsx` — student and staff login interface
- `StudentDashboard.jsx` — registration summary and status tracking
- `StudentRegistration.jsx` — form for student ID registration and photo upload
- `AdminDashboard.jsx` — analytics and quick access to pending work
- `AdminRegistrationQueue.jsx` — list of pending registrations with action controls
- `AdminBatchManagement.jsx` — create and manage production batches
- `AdminBatchDetails.jsx` — inspect batch contents and status details

### 4.4.3 API Service and Authentication Context

The client uses an API service module in `frontend/src/services/api.js` to communicate with the backend. This service centralizes:

- HTTP requests using Axios
- Authorization header injection with JWT tokens
- Error handling

Authentication state is managed by `AuthContext.jsx`, which stores:

- `user` and `userType`
- `isAuthenticated`
- `loading` state
- login and logout functions

This allows the application to preserve session state and enforce access control across components.

### 4.4.4 Form Validation and Upload

Student registration forms enforce validation on required fields before submission. File upload handling is implemented on the client and sent as multipart form data to the backend.

The application also provides:

- input validation for email, phone, and student data
- status updates and success/error alerts after submission
- real-time visibility of application status

> Image placeholder: Student registration form screenshot

![Figure 4.5: Student Registration Form](images/placeholder-registration-form.png)

### 4.4.5 Responsive UI

The user interface is styled using Tailwind CSS, making the application responsive across desktop and mobile screens. Layouts are designed for both student and admin workflows with clear cards, tables, and action buttons.

## 4.5 Integration and Testing

Integration between frontend and backend was verified by:

- Testing login flows for both student and staff
- Submitting registration forms with photo uploads
- Approving and rejecting registrations from the admin dashboard
- Creating batches and updating their lifecycle status
- Confirming email notifications are created and logged

Backend health is checked through `/api/health`, and authentication-protected endpoints are verified with valid JWT tokens.

## 4.6 Deployment Notes

The system can be deployed in two stages:

1. Backend deployment with Node.js and MySQL
2. Frontend deployment as a static React app served by Vite or a web server

Important environment variables are defined in `.env` for database and SMTP configuration. The backend uses `dotenv` to load environment values from the project directory.

> Image placeholder: Deployment or environment setup screenshot

![Figure 4.6: Deployment Setup](images/placeholder-deployment.png)

## 4.7 Summary

The implementation successfully delivers a full-featured student ID registration and batching system. It combines a secure backend workflow engine, notification management, and a responsive frontend interface. The modular design supports future extensions such as additional notification channels, more robust student profile management, and production batch analytics.

> Image placeholder: Final summary or system overview screenshot

![Figure 4.7: System Summary](images/placeholder-summary.png)
