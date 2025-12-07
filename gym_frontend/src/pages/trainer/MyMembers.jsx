import React, { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Phone, Search, Calendar } from 'lucide-react';
import api from '../../utils/api';

const MyMembers = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyMembers();
  }, []);

  // Memoize the filter function
  const filterMembers = useCallback(() => {
    if (!searchTerm) {
      setFilteredMembers(members);
      return;
    }
    
    const filtered = members.filter(member =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm))
    );
    
    setFilteredMembers(filtered);
  }, [members, searchTerm]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  const fetchMyMembers = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      let trainerId;
      
      if (userStr) {
        const user = JSON.parse(userStr);
        trainerId = user.id || user._id;
      } else {
        throw new Error('User not found in localStorage');
      }

      if (!trainerId) {
        throw new Error('Trainer ID not found');
      }

      // Try multiple endpoint variations
      let response;
      try {
        // First try the trainer-specific endpoint
        response = await api.get('/trainer/me/classes');
      } catch (firstError) {
        console.log('First endpoint failed, trying alternative...');
        try {
          // Try alternative endpoint
          response = await api.get('/trainer/classes');
        } catch (secondError) {
          console.log('Second endpoint failed, trying trainer ID endpoint...');
          // Last resort - use ID endpoint
          response = await api.get(`/trainer/${trainerId}/classes`);
        }
      }

      // Extract data based on response structure
      const responseData = response.data;
      const classes = responseData?.data || responseData || [];
      
      console.log('Classes data:', classes); // Debug log

      // Extract unique members from all classes
      const allMembers = [];
      const memberIds = new Set(); // Use Set for better duplicate checking
      
      classes.forEach(classItem => {
        if (classItem.members && Array.isArray(classItem.members)) {
          classItem.members.forEach(member => {
            if (member && member._id && !memberIds.has(member._id)) {
              memberIds.add(member._id);
              allMembers.push({
                _id: member._id,
                name: member.name || 'Unknown Member',
                email: member.email || 'No email',
                phone: member.phone || '',
                createdAt: member.createdAt || new Date(),
                className: classItem.name || 'Unnamed Class',
                classDate: classItem.date || 'No date'
              });
            }
          });
        }
      });
      
      setMembers(allMembers);
      setFilteredMembers(allMembers);
      
      if (allMembers.length === 0) {
        setError('No members found in your classes');
      }
      
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.message || 'Failed to load members. Please try again.');
      
      // Mock data for development
      const mockMembers = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          createdAt: '2024-01-15',
          className: 'Morning Yoga',
          classDate: '2024-12-20'
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '987-654-3210',
          createdAt: '2024-01-10',
          className: 'Weight Training',
          classDate: '2024-12-21'
        }
      ];
      setMembers(mockMembers);
      setFilteredMembers(mockMembers);
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Members</h1>
          <p className="text-gray-600 mt-2">Members assigned to your classes</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Members Grid */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Members ({filteredMembers.length})
            </h2>
            <button
              onClick={fetchMyMembers}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="p-6">
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <MemberCard key={member._id} member={member} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm ? 'No members found' : 'No members assigned'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Members will appear here when assigned to your classes'
                  }
                </p>
                <button
                  onClick={fetchMyMembers}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MemberCard = ({ member }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-lg">
          {member.name?.charAt(0) || 'M'}
        </span>
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{member.name}</h3>
        <div className="flex items-center mt-1">
          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full truncate">
            {member.className}
          </span>
        </div>
      </div>
    </div>

    <div className="space-y-2 text-sm text-gray-600">
      <div className="flex items-center p-2 bg-gray-50 rounded-lg">
        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="truncate" title={member.email}>{member.email}</span>
      </div>
      {member.phone && (
        <div className="flex items-center p-2 bg-gray-50 rounded-lg">
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate" title={member.phone}>{member.phone}</span>
        </div>
      )}
    </div>

    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
      <span className="text-xs text-gray-500">
        Since {new Date(member.createdAt).toLocaleDateString()}
      </span>
      <span className="text-xs text-gray-500">
        Next: {member.classDate ? new Date(member.classDate).toLocaleDateString() : 'No date'}
      </span>
    </div>
  </div>
);

export default MyMembers;