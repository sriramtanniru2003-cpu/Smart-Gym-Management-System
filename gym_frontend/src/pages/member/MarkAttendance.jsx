import { useState, useEffect } from "react";
import api from "../../utils/api";

// Get API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function MarkAttendance() {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attendanceType, setAttendanceType] = useState("gym-visit");

  const generateQR = async () => {
    try {
      setLoading(true);
      setMessage(""); // Clear previous messages
      
      const token = localStorage.getItem("token");
      let userId = localStorage.getItem("userId");

      console.log("Initial userId:", userId);
      
      // ⭐ FIX: If userId is "undefined" string, get it from user object
      if (userId === "undefined" || userId === "null" || !userId || userId.length !== 24) {
        console.log("Fixing userId from user object...");
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.id; // Get correct ID from user object
            console.log("Got correct userId from user object:", userId);
            
            // Update localStorage with correct value for next time
            localStorage.setItem('userId', userId);
          } catch (e) {
            console.error("Failed to parse user object:", e);
          }
        }
      }
      
      // Now check again
      console.log("Final userId:", userId);
      console.log("userId length:", userId?.length);
      console.log("Is valid MongoDB ObjectId?", /^[0-9a-fA-F]{24}$/.test(userId || ""));
      
      if (!token || !userId) {
        setMessage("❌ Authentication error. Please login again.");
        setLoading(false);
        return;
      }

      // Clean the userId
      const cleanUserId = userId.trim();
      console.log("Cleaned userId:", cleanUserId);
      
      if (!/^[0-9a-fA-F]{24}$/.test(cleanUserId)) {
        setMessage("❌ Invalid user ID format. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/attendance/generate-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: cleanUserId }),
      });

      console.log("QR Response status:", response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log("QR Response text:", responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText || "Unknown error" };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      setQrCode(data.qrCode);
      setMessage("✅ QR Code generated! Valid for 24 hours.");
      
    } catch (error) {
      console.error("QR Generation error:", error);
      
      if (error.message === "Failed to fetch") {
        setMessage("❌ Cannot connect to server. Please ensure the backend is running on http://localhost:3000");
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const markManualAttendance = async () => {
    try {
      setLoading(true);
      setMessage(""); // Clear previous messages
      
      const token = localStorage.getItem("token");
      let userId = localStorage.getItem("userId");

      console.log("=== DEBUG MARK ATTENDANCE ===");
      console.log("Initial userId:", userId);
      
      // ⭐ FIX: If userId is "undefined" string, get it from user object
      if (userId === "undefined" || userId === "null" || !userId || userId.length !== 24) {
        console.log("Fixing userId from user object...");
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.id; // Get correct ID from user object
            console.log("Got correct userId from user object:", userId);
            
            // Update localStorage with correct value for next time
            localStorage.setItem('userId', userId);
          } catch (e) {
            console.error("Failed to parse user object:", e);
          }
        }
      }
      
      console.log("Token exists:", !!token);
      console.log("Final userId:", userId);
      console.log("userId length:", userId?.length);
      console.log("Attendance Type:", attendanceType);

      if (!token) {
        setMessage("❌ Authentication token missing. Please login again.");
        setLoading(false);
        return;
      }

      if (!userId) {
        setMessage("❌ User ID not found. Please login again.");
        setLoading(false);
        return;
      }

      // Clean the userId
      const cleanUserId = userId.trim();
      console.log("Cleaned userId:", cleanUserId);
      
      if (!/^[0-9a-fA-F]{24}$/.test(cleanUserId)) {
        setMessage("❌ Invalid user ID format. Please login again.");
        setLoading(false);
        return;
      }

      // Send minimal data first
      const requestBody = {
        memberId: cleanUserId,
        attended: true,
        attendanceType: attendanceType
        // Don't send classId or date initially
      };

      console.log("Request body:", requestBody);

      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      
      // Get response as text first to debug
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText || "Unknown error" };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log("Success:", data);
      setMessage("✅ Attendance marked successfully!");
      
    } catch (error) {
      console.error("Full error details:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      if (error.message === "Failed to fetch") {
        setMessage("❌ Cannot connect to server. Please ensure the backend is running on http://localhost:3000");
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Mark Attendance
        </h1>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.includes("✅") || message.includes("generated")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}>
            {message}
          </div>
        )}

        {/* Attendance Type Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <label className="block text-gray-700 font-medium mb-3">
            Select Attendance Type:
          </label>
          <select
            value={attendanceType}
            onChange={(e) => setAttendanceType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gym-visit">Gym Visit</option>
            <option value="class">Class</option>
            <option value="personal-training">Personal Training</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Attendance */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Manual Check-in
            </h2>
            <p className="text-gray-600 mb-6">
              Click the button below to mark your attendance manually.
            </p>
            <button
              onClick={markManualAttendance}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Mark Attendance Now"}
            </button>
          </div>

          {/* QR Code Generation */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Generate QR Code
            </h2>
            <p className="text-gray-600 mb-6">
              Generate a QR code for quick check-in at the gym entrance.
            </p>
            <button
              onClick={generateQR}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate QR Code"}
            </button>
          </div>
        </div>

        {/* Display QR Code */}
        {qrCode && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your QR Code
            </h2>
            <p className="text-gray-600 mb-4">
              Show this QR code at the gym entrance for quick check-in
            </p>
            <div className="flex justify-center mb-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="border-4 border-gray-300 rounded-lg w-64 h-64"
              />
            </div>
            <p className="text-sm text-gray-500">
              Valid for 24 hours from generation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}