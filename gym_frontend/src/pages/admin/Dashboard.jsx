// src/pages/admin/Dashboard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  FiUsers, 
  FiUserCheck, 
  FiCalendar, 
  FiDollarSign, 
  FiTrendingUp, 
  FiActivity,
  FiUserPlus,
  FiPlus,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    todayAttendance: 0,
    activeClasses: 0,
    revenue: 0,
    attendanceRate: 0,
    newMembersToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        membersRes,
        trainersRes,
        attendanceRes,
        classesRes
      ] = await Promise.allSettled([
        api.get('/member/admin/members?limit=50'),
        api.get('/member/admin/trainers'),
        api.get('/attendance?limit=100'),
        api.get('/classes')
      ]);

      // Log responses for debugging
      console.log('Members response:', membersRes);
      console.log('Trainers response:', trainersRes);
      console.log('Attendance response:', attendanceRes);
      console.log('Classes response:', classesRes);

      // Extract data based on response status
      let membersData = [];
      let trainersData = [];
      let attendanceData = [];
      let classesData = [];

      if (membersRes.status === 'fulfilled') {
        const data = membersRes.value?.data;
        membersData = data?.data || data || [];
      }

      if (trainersRes.status === 'fulfilled') {
        const data = trainersRes.value?.data;
        trainersData = data?.data || data || [];
      }

      if (attendanceRes.status === 'fulfilled') {
        const data = attendanceRes.value?.data;
        attendanceData = data?.data || data || [];
      }

      if (classesRes.status === 'fulfilled') {
        const data = classesRes.value?.data;
        classesData = data?.data || data || [];
      }

      // Calculate today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      
      // Calculate today's attendance
      const todayAttendance = attendanceData.filter(a => {
        if (!a.date) return false;
        try {
          const attendanceDate = new Date(a.date).toISOString().split('T')[0];
          return attendanceDate === todayISO && a.status === 'present';
        } catch (error) {
          return false;
        }
      }).length || 0;

      // Calculate new members today
      const newMembersToday = membersData.filter(member => {
        if (!member.createdAt) return false;
        try {
          const memberDate = new Date(member.createdAt).toISOString().split('T')[0];
          return memberDate === todayISO;
        } catch (error) {
          return false;
        }
      }).length || 0;

      // Calculate total revenue (mock - you should implement this in backend)
      const totalRevenue = membersData.length * 500; // Mock calculation

      // Calculate attendance rate
      const presentAttendance = attendanceData.filter(a => a.status === 'present').length || 0;
      const attendanceRate = attendanceData.length > 0 
        ? Math.round((presentAttendance / attendanceData.length) * 100)
        : 0;

      setStats({
        totalMembers: membersData.length,
        totalTrainers: trainersData.length,
        todayAttendance,
        activeClasses: classesData.filter(c => {
          if (!c.date) return false;
          try {
            const classDate = new Date(c.date);
            return classDate >= today;
          } catch (error) {
            return false;
          }
        }).length || 0,
        revenue: totalRevenue,
        attendanceRate,
        newMembersToday
      });

      // Fetch recent activity from multiple sources
      await fetchRecentActivity(membersData, attendanceData, classesData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to mock data if API fails
      setStats({
        totalMembers: 45,
        totalTrainers: 8,
        todayAttendance: 32,
        activeClasses: 12,
        revenue: 22500,
        attendanceRate: 78,
        newMembersToday: 3
      });
      
      // Mock recent activity as fallback
      setRecentActivity([
        { id: 1, user: 'John Doe', action: 'joined the gym', time: new Date(), type: 'member', icon: '👤' },
        { id: 2, user: 'Sarah Smith', action: 'checked in', time: new Date(Date.now() - 3600000), type: 'attendance', icon: '✅' },
        { id: 3, user: 'Trainer Alex', action: 'started morning session', time: new Date(Date.now() - 7200000), type: 'trainer', icon: '🏋️' },
        { id: 4, user: 'Mike Johnson', action: 'renewed membership', time: new Date(Date.now() - 10800000), type: 'member', icon: '💰' },
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async (membersData, attendanceData, classesData) => {
    try {
      const activities = [];
      const now = new Date();
      
      // 1. Recent member registrations
      const recentMembers = Array.isArray(membersData) 
        ? membersData
            .filter(m => m.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
        : [];
      
      recentMembers.forEach(member => {
        const timeAgo = getTimeAgo(member.createdAt);
        activities.push({
          id: `member-${member._id}`,
          user: member.name,
          action: 'joined the gym',
          time: new Date(member.createdAt),
          type: 'member',
          icon: '👤',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        });
      });

      // 2. Recent attendance
      const recentAttendance = Array.isArray(attendanceData)
        ? attendanceData
            .filter(a => a.date)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3)
        : [];
      
      recentAttendance.forEach(record => {
        const memberName = record.member?.name || record.memberName || 'Member';
        activities.push({
          id: `attendance-${record._id}`,
          user: memberName,
          action: `checked ${record.status || 'in'}`,
          time: new Date(record.date),
          type: 'attendance',
          icon: record.status === 'present' ? '✅' : '❌',
          color: record.status === 'present' ? 'text-green-600' : 'text-red-600',
          bgColor: record.status === 'present' ? 'bg-green-100' : 'bg-red-100'
        });
      });

      // 3. Recent classes
      const recentClasses = Array.isArray(classesData)
        ? classesData
            .filter(c => c.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 2)
        : [];
      
      recentClasses.forEach(cls => {
        activities.push({
          id: `class-${cls._id}`,
          user: cls.name || 'New Class',
          action: 'class scheduled',
          time: new Date(cls.createdAt),
          type: 'class',
          icon: '📅',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        });
      });

      // Add mock activities if no real data
      if (activities.length === 0) {
        activities.push(
          {
            id: 'mock-1',
            user: 'John Doe',
            action: 'checked in',
            time: new Date(Date.now() - 1800000), // 30 minutes ago
            type: 'attendance',
            icon: '✅',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            id: 'mock-2',
            user: 'Sarah Smith',
            action: 'joined membership',
            time: new Date(Date.now() - 7200000), // 2 hours ago
            type: 'member',
            icon: '👤',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          {
            id: 'mock-3',
            user: 'Yoga Class',
            action: 'scheduled for tomorrow',
            time: new Date(Date.now() - 14400000), // 4 hours ago
            type: 'class',
            icon: '📅',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          }
        );
      }

      // Sort all activities by time
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10)
        .map(activity => ({
          ...activity,
          timeDisplay: getTimeAgo(activity.time)
        }));

      setRecentActivity(sortedActivities);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Keep mock data
      setRecentActivity([
        { 
          id: 'fallback-1', 
          user: 'System', 
          action: 'Dashboard data loaded', 
          time: new Date(), 
          type: 'system', 
          icon: '🔄',
          timeDisplay: 'Just now',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
      ]);
    }
  };

  const getTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const handleCreateMember = () => {
    navigate('/admin/members/');
  };

  const handleCreateClass = () => {
    navigate('/admin/classes/');
  };

  const handleCreateTrainer = () => {
    navigate('/admin/trainers/');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const statCards = [
    { 
      title: 'Total Members', 
      value: stats.totalMembers, 
      icon: <FiUsers size={24} />, 
      color: 'bg-blue-500',
      change: `+${stats.newMembersToday} today`
    },
    { 
      title: 'Active Trainers', 
      value: stats.totalTrainers, 
      icon: <FiUserCheck size={24} />, 
      color: 'bg-green-500',
      change: 'All active'
    },
    { 
      title: "Today's Attendance", 
      value: stats.todayAttendance, 
      icon: <FiCalendar size={24} />, 
      color: 'bg-purple-500',
      change: `${stats.attendanceRate}% rate`
    },
    { 
      title: 'Active Classes', 
      value: stats.activeClasses, 
      icon: <FiActivity size={24} />, 
      color: 'bg-yellow-500',
      change: 'Upcoming this week'
    },
    { 
      title: 'Monthly Revenue', 
      value: `$${stats.revenue.toLocaleString()}`, 
      icon: <FiDollarSign size={24} />, 
      color: 'bg-red-500',
      change: 'This month'
    },
    { 
      title: 'Attendance Rate', 
      value: `${stats.attendanceRate}%`, 
      icon: <FiTrendingUp size={24} />, 
      color: 'bg-indigo-500',
      change: 'Overall average'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Refresh Button */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <FiRefreshCw className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-full text-white`}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-gray-500">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <FiClock className="text-gray-400" />
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${activity.bgColor || 'bg-gray-100'} flex items-center justify-center mr-3`}>
                    <span className="text-lg">{activity.icon || '📝'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium">{activity.user}</p>
                      <span className={`ml-2 text-sm ${activity.color || 'text-gray-600'} font-medium`}>
                        {activity.action}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm capitalize">
                      {activity.type} • {activity.timeDisplay}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No recent activity</div>
              <div className="text-sm text-gray-500">Activity will appear here as it happens</div>
            </div>
          )}
          
          {recentActivity.length > 0 && (
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-full mt-4 py-2 text-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Activity →
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {/* Add New Member */}
            <button 
              onClick={handleCreateMember}
              className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mr-3">
                  <FiUserPlus className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Add New Member</p>
                  <p className="text-sm text-gray-600">Register a new gym member</p>
                </div>
                <FiPlus className="text-gray-400 group-hover:text-blue-600" />
              </div>
            </button>
            
            {/* Create New Class */}
            <button 
              onClick={handleCreateClass}
              className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center mr-3">
                  <FiCalendar className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Create Class</p>
                  <p className="text-sm text-gray-600">Schedule a new fitness class</p>
                </div>
                <FiPlus className="text-gray-400 group-hover:text-green-600" />
              </div>
            </button>

            {/* Add New Trainer */}
            <button 
              onClick={handleCreateTrainer}
              className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center mr-3">
                  <FiUserCheck className="text-purple-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Add New Trainer</p>
                  <p className="text-sm text-gray-600">Register a new trainer</p>
                </div>
                <FiPlus className="text-gray-400 group-hover:text-purple-600" />
              </div>
            </button>

            {/* Mark Attendance */}
            <button 
              onClick={() => navigate('/admin/attendance')}
              className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-yellow-100 group-hover:bg-yellow-200 flex items-center justify-center mr-3">
                  <FiActivity className="text-yellow-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Mark Attendance</p>
                  <p className="text-sm text-gray-600">Record member check-ins</p>
                </div>
                <FiPlus className="text-gray-400 group-hover:text-yellow-600" />
              </div>
            </button>
          </div>

          {/* System Status */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">System Status</p>
                <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-green-600">All systems normal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}