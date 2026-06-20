# Automated Student ID Card Registration, Batching, and Notification System

A comprehensive web-based system for managing student ID card registration, batching, and notification processes. This system is designed to be generic and can be adapted for any educational institution.

## Features

### Student Portal

- **Online Registration**: Students can submit their personal information and passport photographs electronically
- **Real-time Status Tracking**: Students can monitor their application status through a visual workflow
- **Email Notifications**: Automated email alerts at key stages of the process
- **Profile Management**: Students can update their information

### Admin Dashboard

- **Registration Queue**: Administrative staff can review, approve, or reject registrations
- **Batch Management**: Create and manage production batches for efficient card printing
- **Status Updates**: Track and update batch status (Sent → Printed → Received)
- **Analytics**: Dashboard with statistics and performance metrics
- **Audit Logging**: Complete audit trail of all system activities
- **User Management**: Manage administrative staff accounts

### Key Capabilities

- **Workflow Automation**: State-based workflow engine ensuring process integrity
- **Email Notifications**: Automated email communication via SMTP
- **Data Validation**: Client and server-side validation for data integrity
- **Role-based Access Control**: Separate interfaces for students and staff
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: MySQL (relational, normalized schema)
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with SMTP
- **File Upload**: Multer
- **Validation**: express-validator

### Frontend

- **Framework**: React 18
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Axios

## Project Structure

```text
student-id-system/
├── backend/
│   ├── config/          # Database and email configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication, validation, error handling
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (notifications, workflow, batching)
│   ├── utils/           # Utility functions (validators, logger)
│   ├── uploads/         # Uploaded student photos
│   ├── logs/            # Application logs
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Authentication context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   ├── App.jsx      # Main app with routing
│   │   ├── main.jsx     # React entry point
│   │   └── index.css    # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql       # Database schema
│   └── seeds.sql        # Sample data
└── README.md
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=student_id_system
   DB_PORT=3306

   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d

   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@example.edu.ng
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=Institution ID Card System <noreply@example.edu.ng>

   # Institution Details
   INSTITUTION_NAME=Generic Institution Name
   INSTITUTION_SHORT_NAME=GIN
   INSTITUTION_ADDRESS=Institution Address, City, Country
   INSTITUTION_SUPPORT_EMAIL=ict@example.edu.ng

   SERVER_PORT=5000
   NODE_ENV=development

   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   ```

4. **Set up database**:

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p student_id_system < database/seeds.sql
   ```

5. **Start backend server**:

   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

## Usage

### Student Access

1. Navigate to `http://localhost:3000`
2. Click on "Student" tab
3. Enter matriculation number (e.g., CSC/22/001)
4. Complete registration form
5. Upload passport photograph
6. Submit application
7. Monitor status via dashboard

### Admin Access

1. Navigate to `http://localhost:3000`
2. Click on "Staff" tab
3. Enter username and password
   - Default: `admin` / `admin123`
   - Other users: `registry` / `admin123`, `ict` / `admin123`
4. Review pending registrations
5. Approve or reject applications
6. Create production batches
7. Update batch status
8. Monitor statistics and logs

## Default Credentials

### Staff Users

- **Admin**: username `admin`, password `admin123`
- **Registry**: username `registry`, password `admin123`
- **ICT**: username `ict`, password `admin123`

### Students

- Use matriculation number as both username and password
- Sample students in seed data: CSC/22/001, CSC/22/002, etc.

## API Endpoints

### Authentication

- `POST /api/auth/staff/login` - Staff login
- `POST /api/auth/student/login` - Student login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Student Operations

- `GET /api/registrations/my-registration` - Get student's registration
- `POST /api/registrations` - Create registration
- `PUT /api/registrations` - Update registration
- `POST /api/registrations/submit` - Submit registration
- `POST /api/registrations/photo` - Upload photo

### Admin Operations

- `GET /api/admin/statistics` - Dashboard statistics
- `GET /api/admin/registrations/pending` - Get pending registrations
- `GET /api/admin/registrations/approved` - Get approved registrations
- `PUT /api/admin/registrations/:id/approve` - Approve registration
- `PUT /api/admin/registrations/:id/reject` - Reject registration
- `GET /api/admin/batches` - Get all batches
- `GET /api/admin/batches/:id` - Get batch details
- `POST /api/admin/batches` - Create batch
- `PUT /api/admin/batches/:id/status` - Update batch status
- `GET /api/admin/batches/:id/report` - Generate batch report
- `GET /api/admin/audit-log` - Get audit log
- `GET /api/admin/notification-logs` - Get notification logs

## Workflow States

The system follows a state-based workflow:

1. **DRAFT** - Initial state when student starts registration
2. **SUBMITTED** - Student has submitted application
3. **UNDER_REVIEW** - Application is being reviewed by staff
4. **APPROVED** - Application has been approved
5. **BATCHED** - Application has been added to a production batch
6. **PRINTED** - Physical card has been printed
7. **READY_FOR_COLLECTION** - Card is ready for student collection
8. **COLLECTED** - Student has collected the card
9. **REJECTED** - Application was rejected
10. **HOLD** - Application is on hold

## Email Notifications

The system sends automated email notifications at the following stages:

- **Registration Submitted** - Confirmation of submission
- **Application Approved** - Notification of approval
- **Batched for Production** - Notification when batched
- **Ready for Collection** - Collection instructions
- **Application Rejected** - Rejection with reason

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Input validation
- File upload validation

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

### Code Linting

```bash
# Backend linting
cd backend
npm run lint
```

## Deployment

### Production Deployment Guide

See `DEPLOYMENT.md` for detailed deployment instructions including:

- Server setup
- Environment configuration
- Database setup
- SSL configuration
- Process management (PM2)
- Reverse proxy setup (Nginx)
- Monitoring and logging

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Email Not Sending**
   - Verify SMTP settings
   - Check email provider authentication
   - For Gmail, use App Password instead of regular password

3. **File Upload Error**
   - Ensure `uploads` directory exists with write permissions
   - Check file size limits in configuration

4. **CORS Errors**
   - Verify frontend URL in CORS configuration
   - Check API proxy settings in Vite config

## Support

For issues and questions:

- Contact the ICT Department of your institution
- Email: [Support Email]

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

**Developer**: George Ayomide Erebosi
