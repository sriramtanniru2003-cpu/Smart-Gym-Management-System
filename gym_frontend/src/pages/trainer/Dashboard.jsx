import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  User, 
  BarChart3, 
  Clock,
  Dumbbell
} from 'lucide-react';
import api from '../../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalMembers: 0,
    upcomingClasses: 0,
    todayAttendance: 0
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const trainerId = localStorage.getItem('userId');
      
      // Fetch trainer's classes
      const response = await api.get(`/trainers/${trainerId}/classes`);
      const classes = response.data;
      
      // Calculate stats
      const totalClasses = classes.length;
      const totalMembers = classes.reduce((acc, cls) => acc + (cls.members?.length || 0), 0);
      
      // Filter upcoming classes (next 7 days)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = classes.filter(cls => {
        const classDate = new Date(cls.date);
        return classDate >= today && classDate <= nextWeek;
      });

      setStats({
        totalClasses,
        totalMembers,
        upcomingClasses: upcoming.length,
        todayAttendance: 0
      });

      setUpcomingClasses(upcoming.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Dumbbell className="h-6 w-6 text-blue-600" />}
            title="Total Classes"
            value={stats.totalClasses}
            description="Classes assigned to you"
          />
          <StatCard
            icon={<Users className="h-6 w-6 text-green-600" />}
            title="Total Members"
            value={stats.totalMembers}
            description="Across all classes"
          />
          <StatCard
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            title="Upcoming Classes"
            value={stats.upcomingClasses}
            description="Next 7 days"
          />
          <StatCard
            icon={<User className="h-6 w-6 text-orange-600" />}
            title="Today's Attendance"
            value={stats.todayAttendance}
            description="Members attended"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Classes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Classes</h2>
              <Link 
                to="/trainer/classes" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((classItem) => (
                  <ClassCard key={classItem._id} classItem={classItem} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming classes</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <ActionCard
                icon={<Calendar className="h-8 w-8" />}
                title="My Classes"
                description="View and manage your classes"
                link="/trainer/classes"
                color="blue"
              />
              <ActionCard
                icon={<Users className="h-8 w-8" />}
                title="My Members"
                description="View assigned members"
                link="/trainer/my-members"
                color="green"
              />
              <ActionCard
                icon={<User className="h-8 w-8" />}
                title="Profile"
                description="Update your profile"
                link="/trainer/profile"
                color="purple"
              />
              <ActionCard
                icon={<BarChart3 className="h-8 w-8" />}
                title="Attendance"
                description="Mark and view attendance"
                link="/trainer/attendance"
                color="orange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, description }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

const ClassCard = ({ classItem }) => (
  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
    <div>
      <h4 className="font-medium text-gray-900">{classItem.name}</h4>
      <p className="text-sm text-gray-500">
        {new Date(classItem.date).toLocaleDateString()} • {classItem.time}
      </p>
      <p className="text-xs text-gray-400">
        {classItem.members?.length || 0} members
      </p>
    </div>
    <Link 
      to={`/trainer/classes/${classItem._id}`}
      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
    >
      View
    </Link>
  </div>
);

const ActionCard = ({ icon, title, description, link, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
  };

  return (
    <Link
      to={link}
      className={`${colorClasses[color]} rounded-lg p-4 text-center transition-colors duration-200`}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs opacity-75">{description}</p>
    </Link>
  );
};

export default Dashboard;