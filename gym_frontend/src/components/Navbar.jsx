import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";      // hamburger
import { FiUser, FiLogOut } from "react-icons/fi"; // icons

export default function Navbar({ setShowLayout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };
const goBack = () => {
  setShowLayout(false);

  // If user has previous route → go there
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    // Fallback: go to default dashboard based on role
    navigate(
      role === "member"
        ? "/member/dashboard"
        : role === "trainer"
        ? "/trainer/dashboard"
        : "/admin/dashboard"
    );
  }
};

  return (
    <nav className="bg-white shadow flex justify-between items-center px-6 py-3 border-b">

      {/* LEFT: Back Button */}
      <button
        onClick={goBack}
        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
      >
        ← Back
      </button>

      {/* MIDDLE: Title */}
      <h1 className="text-xl font-semibold">Gym Management</h1>

      {/* RIGHT: Hamburger Menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-2 rounded-md hover:bg-gray-200"
        >
          <FiMenu size={22} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-md">

            {/* Profile */}
            <button
              onClick={() =>
                navigate(
                  role === "member"
                    ? "/member/profile"
                    : role === "trainer"
                    ? "/trainer/profile"
                    : "/admin/profile"
                )
              }
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              <FiUser /> Profile
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
            >
              <FiLogOut /> Logout
            </button>

          </div>
        )}
      </div>
    </nav>
  );
}
