import { Link } from "react-router-dom";

export default function Sidebar() {
  const role = localStorage.getItem("role");

  const menu = {
    member: [
      { name: "Dashboard", path: "/member/dashboard" },
      { name: "Profile", path: "/member/profile" },
      { name: "Mark Attendance", path: "/member/attendance" },
      { name: "Attendance History", path: "/member/attendance-history" },
      { name: "Update Credentials", path: "/member/update-credentials" },
    ],
    trainer: [
      { name: "Dashboard", path: "/trainer/dashboard" },
      { name: "Members", path: "/trainer/members" },
    ],
    admin: [
      { name: "Dashboard", path: "/admin/dashboard" },
      { name: "Members", path: "/admin/members" },
      { name: "Trainers", path: "/admin/trainers" },
    ]
  };

  const items = menu[role] ?? [];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
      <h2 className="text-xl font-bold px-5 py-4 border-b border-gray-700">
        {role.toUpperCase()}
      </h2>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-3">
        {items.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="px-3 py-2 rounded-md hover:bg-gray-700"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
