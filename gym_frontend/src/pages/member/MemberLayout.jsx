import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function MemberLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const memberName = localStorage.getItem("userName") || "Member";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    { path: "/member/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/member/profile", label: "My Profile", icon: "👤" },
    { path: "/member/membership", label: "Membership", icon: "💳" },
    { path: "/member/mark-attendance", label: "Mark Attendance", icon: "✓" },
    { path: "/member/attendance-history", label: "Attendance History", icon: "📊" },
    { path: "/member/select-trainer", label: "Select Trainer", icon: "💪" },
    { path: "/member/classes", label: "My Classes", icon: "📚" },
    { path: "/member/update-credentials", label: "Update Credentials", icon: "🔐" },
  ];

  return (
    <div className="flex h-screen bg-black text-green-400">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-gray-900 to-black text-green-400 transition-all duration-300 flex flex-col border-r border-green-700/40`}
      >
        {/* Header */}
        <div className="p-4 border-b border-green-700/40">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div>
                <h2 className="text-xl font-bold text-green-300">GYM Portal</h2>
                <p className="text-sm text-green-500">{memberName}</p>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded hover:bg-gray-800 text-green-300"
            >
              {isSidebarOpen ? "←" : "→"}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                location.pathname === item.path
                  ? "bg-gray-800 border-l-4 border-green-400 text-green-300"
                  : "hover:bg-gray-800"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {isSidebarOpen && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-green-700/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
        >
          <span className="text-xl">🚪</span>
          {isSidebarOpen && <span className="ml-2 font-medium">Logout</span>}
        </button>
      </div>
    </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-black text-green-300 p-4">
        <Outlet />
      </main>
    </div>
  );
}
