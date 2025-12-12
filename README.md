# Teacher Payroll Management System

A complete system for managing teacher attendance, teaching loads, and salary computation with separate admin and teacher interfaces.

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── models/
│   ├── Teacher.js            # Teacher model
│   ├── Attendance.js         # Attendance model
│   ├── TeachingLoad.js       # Teaching load model
│   ├── Salary.js             # Salary model
│   └── Notification.js       # Notification model
├── controllers/
│   ├── TeacherController.js           # Teacher CRUD operations
│   ├── AttendanceController.js        # Attendance CRUD operations
│   ├── TeachingLoadController.js      # Teaching load CRUD operations
│   ├── SalaryController.js            # Salary computation
│   └── NotificationController.js      # Notification management
├── routes/
│   ├── teacherRoutes.js          # Teacher endpoints
│   ├── attendanceRoutes.js        # Attendance endpoints
│   ├── teachingLoadRoutes.js      # Teaching load endpoints
│   ├── salaryRoutes.js            # Salary endpoints
│   └── notificationRoutes.js      # Notification endpoints
└── server.js                # Express server entry point

dashboard-frontend/
├── src/
│   ├── teacher/
│   │   ├── TeacherHome.tsx       # Teacher dashboard with all tabs
│   │   └── TeacherLogin.tsx      # Teacher login page
│   ├── admin/
│   │   ├── AdminDashboard.tsx    # Admin dashboard with all tabs
│   │   └── AdminLogin.tsx        # Admin login page
│   └── services/
│       └── api.ts                # API service file with all endpoints
```

## Features

### Teacher Module

- **Login/Home**: Welcome screen with teacher information
- **Attendance Submission**: Submit class attendance with date, subject, class section, and hours
- **Teaching Load**: View assigned classes with day, time, subject, and section
- **Salary/Payslip View**: View salary breakdown with download/print options

### Admin Module

- **Dashboard**: Overview of submissions, pending verifications, alerts
- **Verify Attendance**: Review and approve teacher attendance submissions
- **Compute Salary**: Calculate salary based on verified attendance
- **Reports/Notifications**: Generate reports and view notifications

## Database Schema

### Teachers Table

```sql
CREATE TABLE teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  basic_pay DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Attendance Table

```sql
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  class_section VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  hours_taught DECIMAL(5, 2) NOT NULL,
  status ENUM('Submitted', 'Verified', 'Pending') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
```

### Teaching Load Table

```sql
CREATE TABLE teaching_load (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  class_section VARCHAR(100) NOT NULL,
  day VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
```

### Salary Table

```sql
CREATE TABLE salary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  verified_hours DECIMAL(10, 2) DEFAULT 0,
  hourly_rate DECIMAL(10, 2) DEFAULT 0,
  basic_pay DECIMAL(10, 2) DEFAULT 0,
  allowances DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  total_salary DECIMAL(10, 2) DEFAULT 0,
  status ENUM('Draft', 'Generated', 'Finalized') DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
```

### Notifications Table

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('Alert', 'Info', 'Warning') DEFAULT 'Info',
  message TEXT NOT NULL,
  related_to VARCHAR(100),
  related_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Teachers

- `POST /api/teachers` - Create teacher
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Attendance

- `POST /api/attendance` - Submit attendance
- `GET /api/attendance` - Get all attendance
- `GET /api/attendance/teacher/:teacherId` - Get teacher attendance
- `GET /api/attendance/:id` - Get attendance by ID
- `PUT /api/attendance/:id` - Update attendance
- `PATCH /api/attendance/:id/approve` - Approve attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Teaching Load

- `POST /api/teaching-load` - Create teaching load
- `GET /api/teaching-load` - Get all teaching loads
- `GET /api/teaching-load/teacher/:teacherId` - Get teacher teaching load
- `GET /api/teaching-load/:id` - Get teaching load by ID
- `PUT /api/teaching-load/:id` - Update teaching load
- `DELETE /api/teaching-load/:id` - Delete teaching load

### Salary

- `POST /api/salary/compute` - Compute salary
- `GET /api/salary` - Get all salaries
- `GET /api/salary/teacher/:teacherId` - Get teacher salary
- `GET /api/salary/period/:periodStart/:periodEnd` - Get salary by period
- `GET /api/salary/:id` - Get salary by ID
- `PUT /api/salary/:id` - Update salary
- `PATCH /api/salary/:id/finalize` - Finalize salary
- `DELETE /api/salary/:id` - Delete salary

### Notifications

- `POST /api/notifications` - Create notification
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MySQL Server
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Database**
   - Create a MySQL database named `payrolldb`
   - Create a `.env` file in the backend folder:

   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=payrolldb
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Initialize Database Schema**
   ```bash
   npm run migrate
   ```

5. **Start Backend Server**
   ```bash
   npm start
   ```
   - Server will run at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd dashboard-frontend/dashboard-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   - Frontend will open at `http://localhost:3000`

### Production Build

1. **Build Frontend**
   ```bash
   cd dashboard-frontend/dashboard-frontend
   npm run build
   ```

2. **Deploy Backend**
   - Set `NODE_ENV=production`
   - Deploy to hosting service (Heroku, AWS, DigitalOcean, etc.)
   - Ensure MySQL database is accessible

## Demo Credentials

### Admin Login

- **Email**: admin@school.com
- **Password**: admin123

### Teacher Login

- Use any teacher email from the database

## Usage Flow

### For Teachers:

1. Login with email
2. View home dashboard
3. Submit attendance
4. View assigned teaching load
5. View and download payslips

### For Admin:

1. Login with credentials
2. View dashboard with summary
3. Verify teacher attendance submissions
4. Compute salaries for a period
5. Generate reports and view notifications

## Technology Stack

### Backend

- Node.js/Express
- MySQL
- Axios

### Frontend

- React with TypeScript
- Tailwind CSS
- Axios

## Notes

- All tables are auto-created on server startup
- Foreign key constraints ensure data integrity
- Status tracking for all submissions and salaries
- Notification system for alerts and updates
# jeremias-dash
# dashboard-rep
# systems-dashboard
