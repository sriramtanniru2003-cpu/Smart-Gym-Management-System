// import { Navigate } from 'react-router-dom';

// export default function ProtectedRoute({ role, children }) {
//   const token = localStorage.getItem('token');
//   const userRole = localStorage.getItem('role');

//   if (!token) return <Navigate to="/login" />;
//   if (role && role !== userRole) return <Navigate to="/" />;

//   return children;
// }


// components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function ProtectedRoute({ requiredRole, children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authorization
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (!token) {
      setIsAuthorized(false);
    } else if (requiredRole && userRole !== requiredRole) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
    
    setIsLoading(false);
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    const userRole = localStorage.getItem('role');
    
    // Redirect to appropriate dashboard based on actual role
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'trainer') {
      return <Navigate to="/trainer/dashboard" replace />;
    } else if (userRole === 'member') {
      return <Navigate to="/member/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}