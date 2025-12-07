import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function MemberDashboard() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalAttendance: 0,
    thisMonth: 0,
    membershipDaysLeft: 0,
    thisWeek: 0,
    attendanceStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch profile
      const profileRes = await fetch(`${API_BASE_URL}/member/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!profileRes.ok) {
        throw new Error(`Failed to fetch profile: ${profileRes.status}`);
      }
      
      const profileData = await profileRes.json();
      console.log("Profile data received:", profileData);
      setProfile(profileData);

      // Calculate membership days left
      if (profileData.endDate) {
        const endDate = new Date(profileData.endDate);
        const today = new Date();
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        setStats(prev => ({ 
          ...prev, 
          membershipDaysLeft: Math.max(0, daysLeft) 
        }));
      }

      // Get attendance history from profile
      let attendanceList = [];
      
      // Check different possible locations for attendance data
      if (profileData.attendanceHistory && Array.isArray(profileData.attendanceHistory)) {
        attendanceList = profileData.attendanceHistory;
        console.log("Using attendanceHistory from profile:", attendanceList.length, "records");
      } else if (profileData.attendance && Array.isArray(profileData.attendance)) {
        attendanceList = profileData.attendance;
      } else if (profileData.attendances && Array.isArray(profileData.attendances)) {
        attendanceList = profileData.attendances;
      }
      
      setAttendance(attendanceList);
      
      // Calculate attendance stats
      calculateAttendanceStats(attendanceList);
      
      setLoading(false);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (attendanceList) => {
    if (!attendanceList || !Array.isArray(attendanceList) || attendanceList.length === 0) {
      console.log("No attendance data available");
      setStats(prev => ({
        ...prev,
        totalAttendance: 0,
        thisMonth: 0,
        thisWeek: 0,
        attendanceStreak: 0
      }));
      return;
    }

    console.log("Calculating stats from", attendanceList.length, "attendance records");

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter for present attendance only
    const presentAttendance = attendanceList.filter(entry => {
      if (!entry || typeof entry !== 'object') return false;
      
      const status = entry.status?.toString().toLowerCase().trim();
      return status === 'present' || status === 'p';
    });
    
    console.log("Present attendance records:", presentAttendance.length);
    
    // Total present attendance
    const totalPresent = presentAttendance.length;
    
    // This month's attendance
    const thisMonthAttendance = presentAttendance.filter(entry => {
      let entryDate;
      
      if (entry.date) {
        entryDate = new Date(entry.date);
      } else if (entry.createdAt) {
        entryDate = new Date(entry.createdAt);
      } else if (entry.timestamp) {
        entryDate = new Date(entry.timestamp);
      } else {
        return false;
      }
      
      return (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    });
    
    // This week's attendance (current week, Monday to Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);
    
    const thisWeekAttendance = presentAttendance.filter(entry => {
      let entryDate;
      
      if (entry.date) {
        entryDate = new Date(entry.date);
      } else if (entry.createdAt) {
        entryDate = new Date(entry.createdAt);
      } else if (entry.timestamp) {
        entryDate = new Date(entry.timestamp);
      } else {
        return false;
      }
      
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });
    
    // Calculate attendance streak (consecutive days)
    let streak = 0;
    const sortedAttendance = [...presentAttendance]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.date ? new Date(b.date) : b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      })
      .map(entry => {
        const date = entry.date ? new Date(entry.date) : entry.createdAt ? new Date(entry.createdAt) : null;
        return date ? date.toDateString() : null;
      })
      .filter(dateStr => dateStr !== null);
    
    if (sortedAttendance.length > 0) {
      const today = new Date().toDateString();
      let currentDate = new Date();
      let consecutiveDays = 0;
      
      // Check last 30 days for streak
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toDateString();
        if (sortedAttendance.includes(dateStr)) {
          consecutiveDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      streak = consecutiveDays;
    }

    setStats(prev => ({
      ...prev,
      totalAttendance: totalPresent,
      thisMonth: thisMonthAttendance.length,
      thisWeek: thisWeekAttendance.length,
      attendanceStreak: streak
    }));
  };

  // Get today's attendance status
  const getTodaysAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(entry => {
      let entryDate;
      
      if (entry.date) {
        entryDate = new Date(entry.date).toISOString().split('T')[0];
      } else if (entry.createdAt) {
        entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
      } else {
        return false;
      }
      
      return entryDate === today;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const todaysAttendance = getTodaysAttendance();
  const isAttendanceMarkedToday = todaysAttendance && 
    (todaysAttendance.status?.toString().toLowerCase() === 'present' || 
     todaysAttendance.status?.toString().toLowerCase() === 'p');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {profile?.name || "Member"}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your fitness journey overview
          </p>
          
          {/* Today's Attendance Status */}
          {isAttendanceMarkedToday ? (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <span className="mr-2">✓</span>
              <span className="font-medium">Attendance marked for today</span>
              {todaysAttendance.time && (
                <span className="ml-2 text-sm text-green-600">
                  at {todaysAttendance.time}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
              <span className="mr-2">⏰</span>
              <span className="font-medium">Attendance not marked today</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Attendance */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Total Visits
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {stats.totalAttendance}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  All time gym visits
                </p>
              </div>
              <div className="text-4xl text-blue-500">📈</div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  This Month
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {stats.thisMonth}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleString('default', { month: 'long' })} visits
                </p>
              </div>
              <div className="text-4xl text-green-500">📅</div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  This Week
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {stats.thisWeek}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {7 - stats.thisWeek} days remaining
                </p>
              </div>
              <div className="text-4xl text-purple-500">🔥</div>
            </div>
          </div>

          {/* Membership Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Days Remaining
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {stats.membershipDaysLeft}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.membershipDaysLeft > 0 ? "Active" : "Expired"}
                </p>
              </div>
              <div className="text-4xl text-orange-500">⏰</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/member/mark-attendance"
            className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 ${
              isAttendanceMarkedToday 
                ? "bg-gradient-to-br from-green-500 to-green-600" 
                : "bg-gradient-to-br from-blue-500 to-blue-600"
            } text-white`}
          >
            <div className="text-4xl mb-3">{isAttendanceMarkedToday ? "✓" : "📝"}</div>
            <h3 className="text-xl font-bold mb-2">
              {isAttendanceMarkedToday ? "Attendance Marked" : "Mark Attendance"}
            </h3>
            <p className="opacity-90 text-sm">
              {isAttendanceMarkedToday 
                ? "You've checked in for today" 
                : "Check in for today's workout session"}
            </p>
          </Link>

          <Link
            to="/member/classes"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold mb-2">My Classes</h3>
            <p className="opacity-90 text-sm">
              View and manage your enrolled classes
            </p>
          </Link>

          <Link
            to="/member/select-trainer"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-3">💪</div>
            <h3 className="text-xl font-bold mb-2">
              {profile?.trainer ? "My Trainer" : "Choose Trainer"}
            </h3>
            <p className="opacity-90 text-sm">
              {profile?.trainer 
                ? `Trainer: ${profile.trainer.name}` 
                : "Find the perfect trainer for your goals"}
            </p>
          </Link>
        </div>

        {/* Recent Attendance */}
        {attendance.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Attendance</h2>
              <Link 
                to="/member/attendance-history" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.slice(0, 5).map((entry, index) => {
                    let entryDate;
                    
                    if (entry.date) {
                      entryDate = new Date(entry.date);
                    } else if (entry.createdAt) {
                      entryDate = new Date(entry.createdAt);
                    } else {
                      return null;
                    }
                    
                    const isToday = entryDate.toDateString() === new Date().toDateString();
                    const status = entry.status?.toString().toLowerCase().trim();
                    const isPresent = status === 'present' || status === 'p';
                    
                    return (
                      <tr key={index} className={isToday ? "bg-blue-50" : ""}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {entryDate.toLocaleDateString()}
                            {isToday && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Today
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isPresent
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {entry.time || entryDate.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="capitalize">{entry.method || 'Manual'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {attendance.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Attendance Records</h3>
                <p className="text-gray-600">Start marking your attendance to see records here</p>
              </div>
            )}
          </div>
        )}

        {/* Membership Info */}
        {profile?.membershipType && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Membership Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Plan Type</p>
                <p className="text-lg font-semibold text-gray-800">
                  {profile.membershipType}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Start Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {profile.startDate ? new Date(profile.startDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">End Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {profile.endDate ? new Date(profile.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Status</p>
                <p className={`text-lg font-semibold ${
                  stats.membershipDaysLeft > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.membershipDaysLeft > 0 ? 'Active' : 'Expired'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}