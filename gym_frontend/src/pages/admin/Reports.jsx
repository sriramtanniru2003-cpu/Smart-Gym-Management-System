// src/pages/admin/Reports.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  FiDownload, FiBarChart2, FiTrendingUp, FiUsers, FiCalendar, 
  FiUserCheck, FiDollarSign, FiActivity, FiTarget, FiRefreshCw, FiAward 
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export default function Reports() {
  const [reportType, setReportType] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [memberList, setMemberList] = useState([]);
  const [trainerList, setTrainerList] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled to handle failed API calls gracefully
      const [
        membersRes,
        trainersRes,
        attendanceRes
      ] = await Promise.allSettled([
        api.get('/member/admin/members?limit=100'),
        api.get('/member/admin/trainers'),
        api.get('/attendance?limit=50')
      ]);

      console.log('API Responses:', { membersRes, trainersRes, attendanceRes });

      // Extract data from responses
      let membersData = [];
      let trainersData = [];
      let attendanceRecords = [];

      if (membersRes.status === 'fulfilled') {
        const data = membersRes.value?.data;
        membersData = data?.data || data || [];
        console.log(`Fetched ${membersData.length} members`);
      }

      if (trainersRes.status === 'fulfilled') {
        const data = trainersRes.value?.data;
        trainersData = data?.data || data || [];
        console.log(`Fetched ${trainersData.length} trainers`);
      }

      if (attendanceRes.status === 'fulfilled') {
        const data = attendanceRes.value?.data;
        attendanceRecords = data?.data || data || [];
        console.log(`Fetched ${attendanceRecords.length} attendance records`);
      }

      // Set data to state
      setMemberList(membersData);
      setTrainerList(trainersData);

      // Calculate dashboard stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      
      const todayAttendance = attendanceRecords.filter(a => {
        if (!a.date) return false;
        try {
          const attendanceDate = new Date(a.date).toISOString().split('T')[0];
          return attendanceDate === todayISO && a.status === 'present';
        } catch (error) {
          return false;
        }
      }).length;

      const newMembersToday = membersData.filter(member => {
        if (!member.createdAt) return false;
        try {
          const memberDate = new Date(member.createdAt).toISOString().split('T')[0];
          return memberDate === todayISO;
        } catch (error) {
          return false;
        }
      }).length;

      const totalRevenue = membersData.length * 500; // Mock calculation

      const presentAttendance = attendanceRecords.filter(a => a.status === 'present').length;
      const attendanceRate = attendanceRecords.length > 0 
        ? Math.round((presentAttendance / attendanceRecords.length) * 100)
        : 0;

      setDashboardStats({
        totalMembers: membersData.length,
        totalTrainers: trainersData.length,
        todayAttendance,
        activeClasses: 12, // Mock - you should fetch classes
        revenue: totalRevenue,
        attendanceRate,
        newMembersThisMonth: newMembersToday
      });

      // Calculate top performers
      const memberStats = membersData.map(member => {
        const attendanceRate = calculateMemberAttendanceRate(member);
        return {
          id: member._id,
          name: member.name,
          attendanceRate,
          totalClasses: member.attendanceHistory?.length || 0,
          type: 'member'
        };
      });

      const topMembers = memberStats
        .filter(m => m.attendanceRate > 0)
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .slice(0, 5)
        .map((member, index) => ({
          ...member,
          rank: index + 1,
          metric: 'attendance',
          value: member.attendanceRate
        }));

      const topTrainers = trainersData
        .map(trainer => ({
          id: trainer._id,
          name: trainer.name,
          experience: trainer.experience || 0,
          type: 'trainer'
        }))
        .sort((a, b) => b.experience - a.experience)
        .slice(0, 3)
        .map((trainer, index) => ({
          ...trainer,
          rank: index + 1,
          metric: 'experience',
          value: trainer.experience
        }));

      setTopPerformers([...topMembers, ...topTrainers]);

      // Process attendance data for charts
      const attendanceByDate = processAttendanceData(attendanceRecords);
      setAttendanceData(attendanceByDate);

      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching reports data:', error);
      
      // Fallback mock data
      setDashboardStats({
        totalMembers: 45,
        totalTrainers: 8,
        todayAttendance: 32,
        activeClasses: 12,
        revenue: 22500,
        attendanceRate: 78,
        newMembersThisMonth: 3
      });

      setTopPerformers([
        { id: '1', name: 'John Doe', rank: 1, metric: 'attendance', value: 95 },
        { id: '2', name: 'Jane Smith', rank: 2, metric: 'attendance', value: 88 },
        { id: '3', name: 'Trainer Alex', rank: 1, metric: 'experience', value: 5 }
      ]);

      setAttendanceData([
        { date: 'Jan 1', present: 85, absent: 15 },
        { date: 'Jan 2', present: 92, absent: 8 },
        { date: 'Jan 3', present: 88, absent: 12 },
        { date: 'Jan 4', present: 95, absent: 5 },
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate member attendance rate
  const calculateMemberAttendanceRate = (member) => {
    if (!member.attendanceHistory || member.attendanceHistory.length === 0) return 0;
    
    const presentCount = member.attendanceHistory.filter(a => a.status === 'present').length;
    return Math.round((presentCount / member.attendanceHistory.length) * 100);
  };

  // Helper function to process attendance data for charts
  const processAttendanceData = (attendanceRecords) => {
    const grouped = {};
    const now = new Date();
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[dateStr] = { date: dateStr, present: 0, absent: 0 };
    }
    
    attendanceRecords.forEach(record => {
      if (!record.date) return;
      
      try {
        const date = new Date(record.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (grouped[dateStr]) {
          if (record.status === 'present') grouped[dateStr].present++;
          else if (record.status === 'absent') grouped[dateStr].absent++;
        }
      } catch (error) {
        console.error('Error processing attendance record:', error);
      }
    });
    
    return Object.values(grouped);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const refreshData = () => {
    fetchAllData();
  };

  const downloadReport = async () => {
    try {
      let data = [];
      let filename = '';
      
      switch(reportType) {
        case 'members':
          data = memberList.map(member => ({
            Name: member.name,
            Email: member.email,
            Phone: member.phone || '',
            Membership: member.membershipType || 'None',
            Trainer: member.trainer?.name || 'Not Assigned',
            'Attendance Rate': `${calculateMemberAttendanceRate(member)}%`,
            'Total Classes': member.attendanceHistory?.length || 0,
            Status: member.status || 'active'
          }));
          filename = 'members_report';
          break;
        case 'trainers':
          data = trainerList.map(trainer => ({
            Name: trainer.name,
            Email: trainer.email,
            Specialization: trainer.specialization || 'General',
            Experience: `${trainer.experience || 0} years`,
            Phone: trainer.phone || '',
            Bio: trainer.bio || ''
          }));
          filename = 'trainers_report';
          break;
        case 'attendance':
          data = attendanceData.map(day => ({
            Date: day.date,
            Present: day.present,
            Absent: day.absent,
            Total: day.present + day.absent,
            'Attendance Rate': `${Math.round((day.present / (day.present + day.absent || 1)) * 100)}%`
          }));
          filename = 'attendance_report';
          break;
        default:
          data = [{
            'Total Members': dashboardStats?.totalMembers || 0,
            'Total Trainers': dashboardStats?.totalTrainers || 0,
            'Today Attendance': dashboardStats?.todayAttendance || 0,
            'Attendance Rate': `${dashboardStats?.attendanceRate || 0}%`,
            'Monthly Revenue': `$${dashboardStats?.revenue || 0}`,
            'New Members This Month': dashboardStats?.newMembersThisMonth || 0
          }];
          filename = 'dashboard_report';
      }
      
      if (data.length > 0) {
        const csvContent = [
          Object.keys(data[0]).join(','),
          ...data.map(row => Object.values(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        alert('No data to export!');
      }
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  if (loading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-600">
            Real-time insights and performance metrics
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                (Last updated: {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiRefreshCw className="mr-2" /> Refresh
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setReportType('dashboard')}
              className={`px-4 py-2 rounded-lg ${reportType === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setReportType('members')}
              className={`px-4 py-2 rounded-lg ${reportType === 'members' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Member Stats
            </button>
            <button
              onClick={() => setReportType('attendance')}
              className={`px-4 py-2 rounded-lg ${reportType === 'attendance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Attendance
            </button>
            <button
              onClick={() => setReportType('trainers')}
              className={`px-4 py-2 rounded-lg ${reportType === 'trainers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Trainer Stats
            </button>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FiDownload className="mr-2" /> Export {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
          </button>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Members</p>
                <p className="text-2xl font-bold">{dashboardStats.totalMembers || 0}</p>
                <p className="text-sm text-green-600">
                  +{dashboardStats.newMembersThisMonth || 0} this month
                </p>
              </div>
              <FiUsers className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Trainers</p>
                <p className="text-2xl font-bold">{dashboardStats.totalTrainers || 0}</p>
                <p className="text-sm text-gray-500">
                  {dashboardStats.topTrainers?.length || 0} active
                </p>
              </div>
              <FiUserCheck className="text-purple-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Today's Attendance</p>
                <p className="text-2xl font-bold">{dashboardStats.todayAttendance || 0}</p>
                <p className="text-sm text-green-600">
                  {dashboardStats.attendanceRate || 0}% rate
                </p>
              </div>
              <FiCalendar className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Active Classes</p>
                <p className="text-2xl font-bold">{dashboardStats.activeClasses || 0}</p>
                <p className="text-sm text-blue-600">
                  Revenue: ${dashboardStats.revenue || 0}
                </p>
              </div>
              <FiActivity className="text-orange-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Attendance Trend (Last 7 Days)</h2>
          <div className="h-80">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="absent" stroke="#FF8042" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No attendance data available
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Top Performers</h2>
          <div className="space-y-4">
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, index) => (
                <div key={`${performer.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      performer.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                      performer.rank === 2 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      <span className="font-bold">{performer.rank}</span>
                    </div>
                    <div>
                      <div className="font-medium">{performer.name}</div>
                      <div className="text-sm text-gray-500">
                        {performer.metric}: {performer.value}{performer.metric === 'attendance' ? '%' : ''}
                      </div>
                    </div>
                  </div>
                  <FiAward className={`${
                    performer.rank === 1 ? 'text-yellow-500' :
                    performer.rank === 2 ? 'text-gray-400' :
                    'text-orange-400'
                  }`} />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No performance data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Member Statistics Table */}
      {reportType === 'members' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-700">Member Statistics</h3>
            <p className="text-sm text-gray-500">Showing {memberList.length} members</p>
          </div>
          <div className="overflow-x-auto">
            {memberList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No member data available
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memberList.slice(0, 10).map((member) => (
                    <tr key={member._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="font-bold">{member.name?.charAt(0) || 'M'}</span>
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {member.membershipType || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.trainer?.name || 'Not Assigned'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-green-600 h-2.5 rounded-full" 
                              style={{ width: `${calculateMemberAttendanceRate(member)}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{calculateMemberAttendanceRate(member)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.attendanceHistory?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Trainer Statistics */}
      {reportType === 'trainers' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-700">Trainer Statistics</h3>
            <p className="text-sm text-gray-500">Showing {trainerList.length} trainers</p>
          </div>
          <div className="overflow-x-auto">
            {trainerList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No trainer data available
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience (Years)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trainerList.map((trainer) => (
                    <tr key={trainer._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="font-bold">{trainer.name?.charAt(0) || 'T'}</span>
                          </div>
                          <div>
                            <div className="font-medium">{trainer.name}</div>
                            <div className="text-sm text-gray-500">{trainer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {trainer.specialization || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min((trainer.experience || 0) * 20, 100)}%` }}
                            ></div>
                          </div>
                          <span>{trainer.experience || 0} years</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-yellow-500 mr-1">★</div>
                          <span className="font-medium">4.5</span>
                          <span className="text-gray-500 text-sm ml-1">/5.0</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}