

// AppRoutes.js
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';

// Admin pages
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import Members from '../pages/admin/Members';
import Trainers from '../pages/admin/Trainers';
import Attendance from '../pages/admin/Attendance';
import Classes from '../pages/admin/Classes';
import Reports from '../pages/admin/Reports';


// Member pages
import MemberDashboard from '../pages/member/Dashboard';
import MemberProfile from '../pages/member/Profile';
import MemberMarkAttendance from '../pages/member/MarkAttendance';
import AttendanceHistory from '../pages/member/AttendanceHistory';
import UpdateCredentials from '../pages/member/UpdateCredentials';
import Membership from '../pages/member/Membership';
import SelectTrainer from '../pages/member/SelectTrainer';
import MyClasses from '../pages/member/MyClasses';
import MemberLayout from '../pages/member/MemberLayout';

// Trainer pages
import Dashboard from '../pages/trainer/Dashboard';
import Profile from '../pages/trainer/Profile';
import MyMembers from '../pages/trainer/MyMembers';
import MarkAttendance from '../pages/trainer/MarkAttendance';
import TrainerLayout from '../pages/trainer/TrainerLayout';

// Utils
import ProtectedRoute from '../components/ProtectedRoute';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authState, setAuthState] = useState({ token: null, role: null });

  useEffect(() => {
    // Check auth on mount
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log('📊 AppRoutes - Initial auth check:');
    console.log('Token exists:', !!token);
    console.log('User role:', role);
    
    setAuthState({ token, role });
    setIsCheckingAuth(false);
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  const { token, role } = authState;

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          token ? (
            role === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : role === "trainer" ? (
              <Navigate to="/trainer/dashboard" replace />
            ) : (
              <Navigate to="/member/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Member Routes */}
      <Route
        path="/member/*"
        element={
          <ProtectedRoute requiredRole="member">
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MemberDashboard />} />
        <Route path="profile" element={<MemberProfile />} />
        <Route path="mark-attendance" element={<MemberMarkAttendance />} />
        <Route path="attendance-history" element={<AttendanceHistory />} />
        <Route path="update-credentials" element={<UpdateCredentials />} />
        <Route path="membership" element={<Membership />} />
        <Route path="select-trainer" element={<SelectTrainer />} />
        <Route path="classes" element={<MyClasses />} />
      </Route>

      {/* Admin Routes */}
      <Route
  path="/admin/*"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="members" element={<Members />} />
  <Route path="trainers" element={<Trainers />} />
  <Route path="attendance" element={<Attendance />} />
  <Route path="classes" element={<Classes />} />
  <Route path="reports" element={<Reports />} />
</Route>

      {/* Trainer Routes */}
      <Route
        path="/trainer/*"
        element={
          <ProtectedRoute requiredRole="trainer">
            <TrainerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="my-members" element={<MyMembers />} />
        <Route path="attendance" element={<MarkAttendance />} />
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}