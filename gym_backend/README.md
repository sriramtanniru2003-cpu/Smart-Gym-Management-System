# Gym Management System - Backend

A robust REST API built with Express.js and MongoDB for managing gym operations including members, trainers, classes, and attendance.

## Overview

The backend provides RESTful API endpoints for all gym management operations with JWT authentication, role-based authorization, and comprehensive data validation.

## Architecture

\`\`\`
gym_backend/
├── config/              # Database connection configuration
├── controllers/         # Request handlers and business logic
│   ├── auth.controller.js
│   ├── member.controller.js
│   ├── trainer.controller.js
│   ├── class.controller.js
│   └── attendance.controller.js
├── middlewares/         # Custom middleware
│   ├── auth/           # Authentication and authorization
│   ├── validators/     # Input validation
│   └── errorhandler.js # Error handling
├── models/             # MongoDB schemas
│   ├── Member.js
│   ├── Trainer.js
│   ├── Class.js
│   └── Attendance.js
├── routes/             # API route definitions
│   ├── auth.routes.js
│   ├── member.routes.js
│   ├── trainer.routes.js
│   ├── class.routes.js
│   └── attendance.routes.js
├── utils/              # Utility functions
│   └── jwt.js         # JWT token management
└── app.js             # Express application setup
\`\`\`

## Installation

\`\`\`bash
cd gym_backend
npm install
\`\`\`

### Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **dotenv** - Environment variable management
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation and verification
- **cors** - Cross-Origin Resource Sharing
- **express-validator** - Input validation
- **qrcode** - QR code generation

### Dev Dependencies

- **nodemon** - Auto-restart server on file changes

## Environment Configuration

Create a `.env` file in the backend root:

\`\`\`env
# Database
MONGO_URI=mongodb://localhost:27017/gym_management

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
\`\`\`

## Running the Server

### Development Mode
\`\`\`bash
npm run dev
\`\`\`
Starts the server with auto-reload using nodemon.

### Production Mode
\`\`\`bash
npm start
\`\`\`

The server runs on `http://localhost:3000` by default.

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Sign Up
\`\`\`
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "member"  // or "trainer", "admin"
}

Response: { token, user }
\`\`\`

#### Login
\`\`\`
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: { token, user }
\`\`\`

### Member Routes (`/api/member`)

\`\`\`
GET    /api/member              # Get all members
POST   /api/member              # Create member
GET    /api/member/:id          # Get member by ID
PUT    /api/member/:id          # Update member
DELETE /api/member/:id          # Delete member
\`\`\`

### Trainer Routes (`/api/trainer`)

\`\`\`
GET    /api/trainer             # Get all trainers
POST   /api/trainer             # Create trainer
GET    /api/trainer/:id         # Get trainer by ID
PUT    /api/trainer/:id         # Update trainer
DELETE /api/trainer/:id         # Delete trainer
\`\`\`

### Class Routes (`/api/classes`)

\`\`\`
GET    /api/classes             # Get all classes
POST   /api/classes             # Create class
GET    /api/classes/:id         # Get class by ID
PUT    /api/classes/:id         # Update class
DELETE /api/classes/:id         # Delete class
\`\`\`

### Attendance Routes (`/api/attendance`)

\`\`\`
POST   /api/attendance/generate-qr              # Generate QR code
POST   /api/attendance/mark-qr                  # Mark attendance via QR
POST   /api/attendance/trainer/gym-visit        # Trainer gym visit
POST   /api/attendance/trainer/personal-training # Mark personal training
GET    /api/attendance/trainer/today-status     # Get today's status
GET    /api/attendance/trainer/members          # Get trainer's members
GET    /api/attendance/trainer/stats            # Get attendance stats
\`\`\`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

### Token Structure
- **Header**: JWT algorithm (HS256)
- **Payload**: User ID, role, email, issued and expiry times
- **Signature**: Signed with JWT_SECRET

## Middleware

### Authentication (`authenticate.js`)
Verifies JWT token and extracts user information.

### Authorization (`authorize.js`)
Checks user roles and grants access based on permissions.

### Validators
- `member.validator.js` - Member input validation
- `trainer.validator.js` - Trainer input validation
- `validateClass.js` - Class input validation
- `attendance.validator.js` - Attendance input validation

### Error Handler
Centralized error handling with appropriate HTTP status codes and messages.

## Database Models

### Member
\`\`\`javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  membership: {
    plan: String,
    startDate: Date,
    endDate: Date,
    active: Boolean
  },
  trainer: ObjectId (reference to Trainer),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Trainer
\`\`\`javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  specialization: String,
  members: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Class
\`\`\`javascript
{
  name: String,
  description: String,
  trainer: ObjectId (reference to Trainer),
  schedule: String,
  capacity: Number,
  members: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Attendance
\`\`\`javascript
{
  user: ObjectId,
  date: Date,
  checkIn: Time,
  checkOut: Time,
  type: String (gym-visit, personal-training, class),
  qrCode: String,
  createdAt: Date
}
\`\`\`

## Testing

### Available Test Endpoints

\`\`\`
GET  /                        # Root endpoint info
GET  /api/test               # API health check
GET  /api/check-routes       # List all available routes
GET  /api/all-routes         # Debug: all registered routes
GET  /api/test-attendance    # Debug: attendance controller status
POST /api/test-generate-qr   # Debug: QR generation test
\`\`\`

## Error Handling

All errors return consistent JSON format:

\`\`\`json
{
  "success": false,
  "message": "Error description",
  "error": "Error details (development only)"
}
\`\`\`

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: express-validator for all inputs
- **CORS**: Configured for frontend communication
- **Error Messages**: Safe error messages without exposing internals

## Development Tips

1. Use nodemon for auto-reload during development
2. Test endpoints using Postman or similar tools
3. Check `/api/check-routes` to verify mounted endpoints
4. Use `/api/test` for quick health checks
5. Monitor console logs for debugging

## Deployment

Before deploying:

1. Set `NODE_ENV=production`
2. Configure production `MONGO_URI`
3. Use a strong `JWT_SECRET`
4. Set appropriate `JWT_EXPIRY`
5. Configure CORS for production domain
6. Use environment-specific `.env` files

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running
- Verify connection string in `.env`
- Check network access if using MongoDB Atlas

### JWT Errors
- Verify JWT_SECRET is set
- Check token format in Authorization header
- Ensure token hasn't expired

### Validation Errors
- Check request body format
- Verify required fields are included
- See validation rules in middleware

## Performance Optimization

- Database indexes on frequently queried fields
- JWT token caching in frontend
- Pagination for large data sets
- Request validation before database queries

## Contributing

Follow the existing code structure and conventions. Test changes thoroughly before committing.


