import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const userId = "69216ad9e9128a1531812f3f"; // Your user ID from logs

      console.log("Fetching attendance for user:", userId);
      console.log("API URL:", `${API_BASE_URL}/attendance/member/${userId}`);

      if (!token) {
        setError("Please login to view attendance history");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/attendance/member/${userId}`,
        {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      console.log("Response status:", response.status);

      // Check if response is HTML error page
      const responseText = await response.text();
      console.log("Response first 200 chars:", responseText.substring(0, 200));
      
      if (!response.ok) {
        if (responseText.includes("<!DOCTYPE html>")) {
          throw new Error("Server error. Check if backend is running on port 3000.");
        }
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText || "Unknown error" };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log("Attendance data:", data);
      console.log("First record:", data.data?.[0]);
      
      // Handle response format
      if (data.success && data.data) {
        setAttendance(data.data); 
      } else {
        setAttendance([]);
      }
      
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError(error.message || "Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter((record) => {
    // Filter by type
    if (filter !== "all" && record.attendanceType !== filter) return false;

    // Filter by date range
    if (dateRange !== "all") {
      const recordDate = new Date(record.date);
      const now = new Date();
      const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

      if (dateRange === "week" && daysDiff > 7) return false;
      if (dateRange === "month" && daysDiff > 30) return false;
    }

    return true;
  });

  const stats = {
    total: filteredAttendance.length,
    gym: filteredAttendance.filter((r) => r.attendanceType === "gym").length,
    classes: filteredAttendance.filter((r) => r.attendanceType === "class").length,
    present: filteredAttendance.filter((r) => r.status === "present").length,
    absent: filteredAttendance.filter((r) => r.status === "absent").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading attendance history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          Error: {error}
        </div>
        <button
          onClick={fetchAttendance}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Attendance History
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-500 text-sm mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-500 text-sm mb-1">Gym Visits</p>
            <p className="text-2xl font-bold text-blue-600">{stats.gym}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-500 text-sm mb-1">Classes</p>
            <p className="text-2xl font-bold text-green-600">{stats.classes}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-500 text-sm mb-1">Present</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-500 text-sm mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Filter by Type:
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="gym">Gym Visits</option>
                <option value="class">Classes</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Filter by Date:
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.attendanceType === "gym"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {record.attendanceType === "gym"
                            ? "Gym Visit"
                            : "Class"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.status === "present" ? "✓ Present" : "✗ Absent"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {record.method === "manual" ? "Manual" : "QR Code"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6">
          <button
            onClick={fetchAttendance}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Attendance
          </button>
        </div>
      </div>
    </div>
  );
}