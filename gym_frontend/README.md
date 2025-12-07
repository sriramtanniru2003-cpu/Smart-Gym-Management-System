# Gym Management System - Frontend

A modern React application with Vite for managing gym memberships, classes, trainers, and attendance. Features role-based dashboards for admin, trainer, and member users.

## Overview

The frontend provides an intuitive user interface with separate dashboards for different user roles:
- **Admin**: Complete gym management control
- **Trainer**: Manage members and track attendance
- **Member**: Personal dashboard and attendance tracking

## Technology Stack

- **React** 19.2 - UI framework
- **Vite** 7 - Build tool and dev server
- **Tailwind CSS** 4 - Utility-first CSS
- **React Router** 7 - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **html5-qrcode** - QR code scanning
- **Lucide React** & **React Icons** - Icon libraries
- **React DatePicker** - Date selection

## Project Structure

\`\`\`
gym_frontend/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── Trainers.jsx
│   │   │   ├── Classes.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── trainer/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyMembers.jsx
│   │   │   ├── MarkAttendance.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── TrainerLayout.jsx
│   │   ├── member/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MarkAttendance.jsx
│   │   │   ├── AttendanceHistory.jsx
│   │   │   ├── Membership.jsx
│   │   │   ├── MyClasses.jsx
│   │   │   ├── SelectTrainer.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── UpdateCredentials.jsx
│   │   │   └── MemberLayout.jsx
│   │   └── NotFound.jsx
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation bar
│   │   ├── Sidebar.jsx         # Main sidebar
│   │   ├── Layout.jsx          # Main layout wrapper
│   │   ├── ProtectedRoute.jsx  # Route protection
│   │   ├── Card.jsx            # Card component
│   │   ├── QRScanner.jsx       # QR code scanner
│   │   ├── AutoLogout.jsx      # Session management
│   │   ├── trainer/            # Trainer-specific components
│   │   │   ├── NavbarTrainer.jsx
│   │   │   ├── SidebarTrainer.jsx
│   │   │   ├── ClassCard.jsx
│   │   │   └── AttendanceTable.jsx
│   │   └── hooks/
│   │       └── useAuth.jsx     # Authentication hook
│   ├── routes/
│   │   └── AppRoutes.jsx       # Route configuration
│   ├── utils/
│   │   └── api.js              # Axios API client
│   ├── App.jsx                 # Main App component
│   ├── App.css                 # App styles
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── public/
│   └── vite.svg               # Vite logo
├── package.json
├── vite.config.js             # Vite configuration
└── eslint.config.js           # ESLint configuration
\`\`\`

## Installation

\`\`\`bash
cd gym_frontend
npm install
\`\`\`

## Environment Configuration

Create a `.env` file in the frontend root:

\`\`\`env
VITE_API_URL=http://localhost:3000/api
\`\`\`

## Running the Application

### Development Mode
\`\`\`bash
npm run dev
\`\`\`
Development server runs on `http://localhost:5173` with hot module replacement.

### Build for Production
\`\`\`bash
npm run build
\`\`\`
Creates optimized build in the `dist` folder.

### Preview Production Build
\`\`\`bash
npm run preview
\`\`\`
Preview the production build locally.

### Linting
\`\`\`bash
npm run lint
\`\`\`
Check code quality with ESLint.

## Features

### Authentication
- User registration and login
- Role-based account creation (admin, trainer, member)
- JWT token management
- Automatic logout on inactivity

### Admin Dashboard
- **Members Management**: Create, view, update, delete members
- **Trainers Management**: Manage trainer profiles and assignments
- **Classes Management**: Create and organize fitness classes
- **Attendance Tracking**: Monitor member check-ins
- **Reports**: View gym statistics and analytics

### Trainer Dashboard
- **Member List**: View assigned members
- **Attendance Tracking**: Mark member attendance
- **Class Management**: View and manage assigned classes
- **Profile Management**: Update trainer information

### Member Dashboard
- **Attendance Check-in**: Mark attendance via QR code
- **Attendance History**: View past check-ins
- **Membership Info**: View membership details and status
- **Classes**: View and manage assigned classes
- **Trainer Selection**: Choose and manage trainer assignment
- **Profile**: Update personal information and credentials

### QR Code Scanning
- Real-time QR code scanning
- Attendance marking via QR
- QR code generation for gym entry

## API Integration

### Axios Configuration

The application uses Axios with a centralized API client:

\`\`\`javascript
// utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
\`\`\`

### Making API Calls

\`\`\`javascript
import API from '../utils/api';

// Example: Get all members
const response = await API.get('/member');

// Example: Create new member
const response = await API.post('/member', memberData);

// Example: Login
const response = await API.post('/auth/login', credentials);
\`\`\`

## Authentication Flow

1. User enters credentials on login/signup page
2. Credentials sent to backend API
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. Token included in all subsequent API requests
6. User redirected to appropriate dashboard based on role
7. Protected routes check authentication and role

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Dark mode support
- Responsive design utilities
- Custom theme configuration in Tailwind config

### Component Styling
- Modular component-specific CSS
- Consistent color scheme
- Responsive layouts
- Mobile-first approach

## Key Components

### ProtectedRoute
Wraps routes that require authentication and specific roles:

\`\`\`jsx
<ProtectedRoute>
  <AdminDashboard />
</ProtectedRoute>
\`\`\`

### useAuth Hook
Custom hook for authentication state management:

\`\`\`javascript
const { user, token, login, logout, isAuthenticated } = useAuth();
\`\`\`

### QRScanner
Component for scanning QR codes:

\`\`\`jsx
<QRScanner onScan={(code) => handleAttendance(code)} />
\`\`\`

### Card
Reusable card component for displaying information:

\`\`\`jsx
<Card title="Membership" data={membershipInfo} />
\`\`\`

## Role-Based Navigation

The application automatically shows different navigation and features based on user role:

- **Admin**: Full menu with management options
- **Trainer**: Trainer-specific menu
- **Member**: Member-specific menu

## Performance Optimization

- Component code splitting with React Router
- Lazy loading of pages
- Optimized re-renders with React hooks
- Efficient state management
- Asset minification and bundling with Vite

## Error Handling

- Centralized API error handling
- User-friendly error messages
- Network error recovery
- Session timeout handling

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Modern browsers supporting ES6+

## Development Tools

### Vite Features
- Lightning-fast HMR (Hot Module Replacement)
- Pre-configured optimizations
- Built-in CSS preprocessing
- Environment variable support

### ESLint
Code quality checking with React-specific rules

## Deployment

### Build Steps
\`\`\`bash
npm install
npm run build
\`\`\`

### Deploy to Vercel
\`\`\`bash
vercel
\`\`\`

### Deploy to Other Platforms
1. Build: `npm run build`
2. Serve: `dist/` folder contains production files
3. Configure environment variables
4. Set API URL to production backend

## Troubleshooting

### API Connection Issues
- Check `VITE_API_URL` environment variable
- Verify backend is running
- Check browser console for CORS errors
- Verify token is being sent with requests

### Authentication Issues
- Clear localStorage and cache
- Check token expiration
- Verify backend JWT_SECRET matches
- Check role-based access rules

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check Node.js version compatibility

### QR Code Scanning Issues
- Allow camera permissions
- Check browser console for errors
- Verify QR code format

## Contributing

Follow the existing code structure and conventions. Test changes in development mode before committing.



**Built with React, Vite, Tailwind CSS, and modern web technologies**
