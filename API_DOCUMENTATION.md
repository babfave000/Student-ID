# API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://yourdomain.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... }
}
```

## Endpoints

### Authentication

#### Staff Login
```http
POST /auth/staff/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@oaustech.edu.ng",
    "role": "admin"
  }
}
```

#### Student Login
```http
POST /auth/student/login
```

**Request Body:**
```json
{
  "matric_no": "CSC/22/001",
  "password": "CSC/22/001"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "matric_no": "CSC/22/001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@oaustech.edu.ng",
    "faculty": "Computing",
    "department": "Computer Science",
    "level": "200"
  }
}
```

#### Get Current User
```http
GET /auth/me
```
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@oaustech.edu.ng",
    "role": "admin"
  }
}
```

#### Logout
```http
POST /auth/logout
```
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Student Registration

#### Get My Registration
```http
GET /registrations/my-registration
```
**Authentication:** Student required

**Response:**
```json
{
  "success": true,
  "hasRegistration": true,
  "registration": {
    "id": 1,
    "student_id": 1,
    "status": "SUBMITTED",
    "photo_path": "/uploads/photo-1234567890.jpg",
    "submitted_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-01-15T10:30:00.000Z",
    "matric_no": "CSC/22/001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@oaustech.edu.ng",
    "phone": "+2348012345678",
    "faculty": "Computing",
    "department": "Computer Science",
    "level": "200"
  }
}
```

#### Create/Update Registration
```http
POST /registrations
```
**Authentication:** Student required
**Content-Type:** multipart/form-data

**Request Body:**
```
first_name: John
last_name: Doe
email: john.doe@oaustech.edu.ng
phone: +2348012345678
faculty: Computing
department: Computer Science
level: 200
photo: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Registration created successfully",
  "registrationId": 1
}
```

#### Update Registration Details
```http
PUT /registrations
```
**Authentication:** Student required

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@oaustech.edu.ng",
  "phone": "+2348012345678",
  "faculty": "Computing",
  "department": "Computer Science",
  "level": "200"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration updated successfully"
}
```

#### Submit Registration
```http
POST /registrations/submit
```
**Authentication:** Student required

**Response:**
```json
{
  "success": true,
  "message": "Registration submitted successfully",
  "registrationId": 1
}
```

#### Upload Photo
```http
POST /registrations/photo
```
**Authentication:** Student required
**Content-Type:** multipart/form-data

**Request Body:**
```
photo: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "photoPath": "/uploads/photo-1234567890.jpg"
}
```

### Admin Operations

#### Get Statistics
```http
GET /admin/statistics
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalStudents": 1000,
    "totalRegistrations": 850,
    "pendingRegistrations": 25,
    "approvedRegistrations": 100,
    "batchedRegistrations": 50,
    "readyForCollection": 30,
    "collected": 645,
    "totalBatches": 10,
    "totalStaff": 5,
    "batches": {
      "total": 10,
      "sent": 2,
      "printed": 5,
      "received": 3,
      "totalRegistrations": 150
    }
  }
}
```

#### Get Pending Registrations
```http
GET /admin/registrations/pending?page=1&limit=50
```
**Authentication:** Staff required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "registrations": [
    {
      "id": 1,
      "student_id": 1,
      "status": "SUBMITTED",
      "submitted_at": "2026-01-15T10:30:00.000Z",
      "matric_no": "CSC/22/001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@oaustech.edu.ng",
      "phone": "+2348012345678",
      "faculty": "Computing",
      "department": "Computer Science",
      "level": "200"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

#### Get Approved Registrations
```http
GET /admin/registrations/approved?faculty=Computing&department=Computer Science&page=1&limit=50
```
**Authentication:** Staff required

**Query Parameters:**
- `faculty` (optional): Filter by faculty
- `department` (optional): Filter by department
- `level` (optional): Filter by level
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:** Same format as pending registrations

#### Approve Registration
```http
PUT /admin/registrations/:id/approve
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "result": {
    "oldStatus": "UNDER_REVIEW",
    "newStatus": "APPROVED"
  }
}
```

#### Reject Registration
```http
PUT /admin/registrations/:id/reject
```
**Authentication:** Staff required

**Request Body:**
```json
{
  "rejection_reason": "Photo quality is poor. Please upload a clear passport photograph."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration rejected successfully",
  "result": {
    "oldStatus": "UNDER_REVIEW",
    "newStatus": "REJECTED"
  }
}
```

#### Mark as Collected
```http
PUT /admin/registrations/:id/collect
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "message": "Registration marked as collected"
}
```

### Batch Management

#### Get All Batches
```http
GET /admin/batches?page=1&limit=20
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "batches": [
    {
      "id": 1,
      "batch_name": "January 2026 Batch",
      "description": "First batch of 2026",
      "created_at": "2026-01-15T10:00:00.000Z",
      "status": "SENT",
      "total_count": 50,
      "created_by_name": "System Administrator",
      "registration_count": 50
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

#### Get Batch Details
```http
GET /admin/batches/:id
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "batch": {
    "id": 1,
    "batch_name": "January 2026 Batch",
    "description": "First batch of 2026",
    "created_at": "2026-01-15T10:00:00.000Z",
    "status": "SENT",
    "total_count": 50,
    "created_by_name": "System Administrator",
    "registrations": [
      {
        "id": 1,
        "matric_no": "CSC/22/001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@oaustech.edu.ng",
        "phone": "+2348012345678",
        "faculty": "Computing",
        "department": "Computer Science",
        "level": "200",
        "photo_path": "/uploads/photo-1234567890.jpg"
      }
    ]
  }
}
```

#### Create Batch
```http
POST /admin/batches
```
**Authentication:** Staff required

**Request Body:**
```json
{
  "batch_name": "January 2026 Batch",
  "description": "First batch of 2026",
  "registration_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch created successfully",
  "result": {
    "batchId": 1,
    "addedCount": 5,
    "totalRequested": 5,
    "errors": []
  }
}
```

#### Update Batch Status
```http
PUT /admin/batches/:id/status
```
**Authentication:** Staff required

**Request Body:**
```json
{
  "status": "PRINTED"
}
```

**Valid statuses:** `SENT`, `PRINTED`, `RECEIVED`

**Response:**
```json
{
  "success": true,
  "message": "Batch status updated successfully",
  "result": {
    "oldStatus": "SENT",
    "newStatus": "PRINTED"
  }
}
```

#### Generate Batch Report
```http
GET /admin/batches/:id/report
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "report": {
    "batch": {
      "id": 1,
      "name": "January 2026 Batch",
      "description": "First batch of 2026",
      "created_at": "2026-01-15T10:00:00.000Z",
      "status": "SENT",
      "total_count": 50,
      "created_by": "System Administrator"
    },
    "registrations": [
      {
        "matric_no": "CSC/22/001",
        "name": "Doe, John",
        "faculty": "Computing",
        "department": "Computer Science",
        "level": "200",
        "email": "john.doe@oaustech.edu.ng",
        "phone": "+2348012345678",
        "photo_path": "/uploads/photo-1234567890.jpg"
      }
    ],
    "summary": {
      "by_faculty": {
        "Computing": 30,
        "Engineering": 20
      },
      "by_department": {
        "Computer Science": 30,
        "Electrical Engineering": 15,
        "Mechanical Engineering": 5
      },
      "by_level": {
        "200": 30,
        "300": 15,
        "400": 5
      }
    }
  }
}
```

### Logs and Audit

#### Get Audit Log
```http
GET /admin/audit-log?page=1&limit=100
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "action": "STATUS_CHANGE",
      "entity_type": "registration",
      "entity_id": 1,
      "user_id": 1,
      "user_type": "staff",
      "user_name": "System Administrator",
      "old_value": {
        "status": "SUBMITTED"
      },
      "new_value": {
        "status": "APPROVED"
      },
      "timestamp": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 500,
    "pages": 5
  }
}
```

#### Get Notification Logs
```http
GET /admin/notification-logs?page=1&limit=50&status=FAILED
```
**Authentication:** Staff required

**Query Parameters:**
- `status` (optional): Filter by status (`PENDING`, `SENT`, `FAILED`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "registration_id": 1,
      "recipient_email": "john.doe@oaustech.edu.ng",
      "notification_type": "REGISTRATION_SUBMITTED",
      "status": "SENT",
      "message_content": "Registration submitted notification",
      "sent_at": "2026-01-15T10:30:00.000Z",
      "matric_no": "CSC/22/001",
      "first_name": "John",
      "last_name": "Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

#### Get All Students
```http
GET /admin/students?page=1&limit=100
```
**Authentication:** Staff required

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": 1,
      "matric_no": "CSC/22/001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@oaustech.edu.ng",
      "phone": "+2348012345678",
      "faculty": "Computing",
      "department": "Computer Science",
      "level": "200",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1000,
    "pages": 10
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Error Response Format

### Validation Error
```json
{
  "errors": [
    {
      "msg": "Invalid email format",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### Authentication Error
```json
{
  "error": "Authentication required"
}
```

### Authorization Error
```json
{
  "error": "Insufficient permissions"
}
```

### Not Found Error
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found"
}
```

### Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers Included**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## File Upload

- **Max File Size**: 5 MB
- **Allowed Formats**: JPEG, JPG, PNG
- **Endpoint**: `/registrations/photo`
- **Method**: POST with multipart/form-data

## Webhooks

Currently no webhooks are implemented, but the system is designed to support:
- Status change notifications
- Email delivery confirmations
- Batch completion alerts

## Testing

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## Support

For API-related issues:
- Contact the ICT Department of your institution
- Email: [Support Email]