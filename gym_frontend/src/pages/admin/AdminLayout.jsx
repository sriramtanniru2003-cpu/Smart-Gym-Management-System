// src/pages/admin/AdminLayout.js
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  FiMenu, FiX, FiLogOut, FiHome, FiUsers, FiUserCheck, 
  FiCalendar, FiBarChart2, FiSettings, FiUserPlus 
} from 'react-icons/fi';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/admin/members', icon: <FiUsers />, label: 'Members' },
    { path: '/admin/trainers', icon: <FiUserCheck />, label: 'Trainers' },
    { path: '/admin/attendance', icon: <FiCalendar />, label: 'Attendance' },
    { path: '/admin/classes', icon: <FiCalendar />, label: 'Classes' },
    { path: '/admin/reports', icon: <FiBarChart2 />, label: 'Reports' },
  
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold">GYM Admin</h1>
          ) : (
            <div className="text-center w-full">
              <span className="text-2xl">🏋️</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-800"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="font-bold">{user.name?.charAt(0) || 'A'}</span>
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="font-medium">{user.name || 'Admin'}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiLogOut />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}