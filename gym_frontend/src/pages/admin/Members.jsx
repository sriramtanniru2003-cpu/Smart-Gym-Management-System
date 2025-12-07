// src/pages/admin/Members.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiEdit, FiTrash2, FiEye, FiSearch, FiPlus, FiUser, FiKey, FiSave, FiX } from 'react-icons/fi';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membershipType: '',
    role: 'member'
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: 'member123'
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const filtered = members.filter(member =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
    );
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  const fetchMembers = async () => {
    try {
      // Use the new admin endpoint
      const res = await api.get('/member/admin/members');
      if (res.data.success) {
        setMembers(res.data.data);
        setFilteredMembers(res.data.data);
      } else {
        console.error('Error fetching members:', res.data.message);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      // Use the new admin create endpoint
      await api.post('/member/admin/member/create', formData);
      fetchMembers();
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', membershipType: '', role: 'member' });
    } catch (error) {
      console.error('Error adding member:', error);
      alert(`Failed to add member: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditMember = async () => {
    try {
      // Use the new admin update endpoint
      await api.put(`/member/admin/member/${selectedMember._id}/update`, formData);
      fetchMembers();
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error editing member:', error);
      alert(`Failed to update member: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleResetPassword = async () => {
    try {
      // Use the new admin reset password endpoint
      await api.put(`/member/admin/member/${selectedMember._id}/reset-password`, resetPasswordData);
      fetchMembers();
      setShowResetPasswordModal(false);
      setSelectedMember(null);
      setResetPasswordData({ newPassword: 'member123' });
      alert('Password reset successfully!');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(`Failed to reset password: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        // Use the new admin delete endpoint
        await api.delete(`/member/admin/member/${id}/delete`);
        fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        alert(`Failed to delete member: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      membershipType: member.membershipType || '',
      role: member.role
    });
    setShowEditModal(true);
  };

  const openResetPasswordModal = (member) => {
    setSelectedMember(member);
    setShowResetPasswordModal(true);
  };

  const membershipTypes = [
    'Basic', 'Premium', 'VIP', 'Monthly', 'Quarterly', 'Annual', 'Student',
    '1 Month', '3 Months', '6 Months', 'Yearly'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading members...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Members Management</h1>
          <p className="text-gray-600">Manage all gym members ({members.length} total)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" /> Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        Showing {filteredMembers.length} of {members.length} members
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <FiUser className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No members found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try a different search term' : 'Add your first member using the "Add Member" button'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-3">
                          <span className="text-white font-bold">{member.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">ID: {member._id?.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.membershipType 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.membershipType || 'No Membership'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {member.trainer?.name || 'No trainer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => openEditModal(member)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit member"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(member)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Reset password"
                        >
                          <FiKey size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete member"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Member</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Membership Type
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.membershipType}
                    onChange={(e) => setFormData({...formData, membershipType: e.target.value})}
                  >
                    <option value="">Select Membership Type</option>
                    {membershipTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!formData.name || !formData.email}
                  className={`px-5 py-2 rounded-lg transition-colors ${
                    !formData.name || !formData.email
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Add Member
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>* Required fields</p>
                <p>Default password will be set to "member123"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Edit Member</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Membership Type
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.membershipType}
                    onChange={(e) => setFormData({...formData, membershipType: e.target.value})}
                  >
                    <option value="">Select Membership Type</option>
                    {membershipTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditMember}
                  disabled={!formData.name}
                  className={`px-5 py-2 rounded-lg transition-colors ${
                    !formData.name
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Update Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">
                  Reset password for <strong>{selectedMember.name}</strong> ({selectedMember.email})
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="text"
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({newPassword: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!resetPasswordData.newPassword || resetPasswordData.newPassword.length < 6}
                  className={`px-5 py-2 rounded-lg transition-colors ${
                    !resetPasswordData.newPassword || resetPasswordData.newPassword.length < 6
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}