// src/pages/admin/Trainers.jsx
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiEdit, FiTrash2, FiStar, FiSearch, FiPlus, FiUser, FiSave, FiX, FiKey } from 'react-icons/fi';

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editingFormData, setEditingFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    bio: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    bio: ''
  });

  const specializations = [
    'Yoga', 'Weight Training', 'Cardio', 'CrossFit', 'Pilates',
    'Martial Arts', 'Dance', 'Swimming', 'Nutrition', 'Boxing',
    'Cycling', 'Meditation', 'Functional Training', 'Bodybuilding'
  ];

  useEffect(() => {
    fetchTrainers();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchTrainers = async () => {
    try {
      console.log('📡 Fetching trainers...');
      // Try trainer endpoint first
      const res = await api.get('/trainer/admin/all');
      console.log('✅ Trainers response:', res.data);
      
      let trainersData = [];
      if (res.data.success && res.data.data) {
        trainersData = res.data.data;
      } else if (Array.isArray(res.data)) {
        trainersData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        trainersData = res.data.data;
      }
      
      console.log(`✅ Found ${trainersData.length} trainers`);
      setTrainers(trainersData);
      showNotification(`Loaded ${trainersData.length} trainers`, 'success');
      
    } catch (error) {
      console.error('❌ Error fetching trainers from trainer endpoint:', error);
      showNotification('Failed to load trainers. Using sample data.', 'error');
      
      // Fallback to mock data
      const mockTrainers = [
        {
          _id: '1',
          name: 'Trainer John',
          email: 'john@example.com',
          specialization: 'Weight Training',
          experience: 5,
          phone: '123-456-7890',
          bio: 'Certified personal trainer with 5 years experience'
        },
        {
          _id: '2',
          name: 'Trainer Sarah',
          email: 'sarah@example.com',
          specialization: 'Yoga',
          experience: 3,
          phone: '987-654-3210',
          bio: 'Yoga instructor specializing in Vinyasa flow'
        }
      ];
      setTrainers(mockTrainers);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainer = async () => {
    try {
      const trainerData = {
        ...formData,
        role: 'trainer',
        password: 'trainer123'
      };
      
      // Use the new trainer create endpoint
      await api.post('/trainer/admin/create', trainerData);
      
      showNotification('Trainer added successfully!', 'success');
      fetchTrainers();
      setShowAddModal(false);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        specialization: '', 
        experience: '', 
        bio: '' 
      });
      
    } catch (error) {
      console.error('❌ Error adding trainer:', error);
      showNotification(`Failed to add trainer: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleEditTrainer = (trainer) => {
    setEditingTrainer(trainer._id);
    setEditingFormData({
      name: trainer.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      specialization: trainer.specialization || '',
      experience: trainer.experience || '',
      bio: trainer.bio || ''
    });
  };

  const handleSaveEdit = async (trainerId) => {
    try {
      console.log('💾 Saving trainer edits:', trainerId);
      
      // Filter out empty values
      const updateData = Object.fromEntries(
        Object.entries(editingFormData).filter(([_, v]) => v !== '' && v !== null)
      );
      
      // Use the admin update endpoint
      const res = await api.put(`/trainer/admin/${trainerId}/update`, updateData);
      
      if (res.data.success) {
        showNotification('Trainer updated successfully!', 'success');
        
        // Update local state
        setTrainers(trainers.map(trainer => 
          trainer._id === trainerId 
            ? { ...trainer, ...updateData }
            : trainer
        ));
        
        setEditingTrainer(null);
        setEditingFormData({
          name: '',
          email: '',
          phone: '',
          specialization: '',
          experience: '',
          bio: ''
        });
      } else {
        throw new Error(res.data.message);
      }
      
    } catch (error) {
      console.error('❌ Error updating trainer:', error);
      showNotification(`Failed to update trainer: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingTrainer(null);
    setEditingFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      experience: '',
      bio: ''
    });
  };

  const handleResetPassword = async (trainerId, trainerName) => {
    if (!window.confirm(`Reset password for ${trainerName} to default (trainer123)?`)) {
      return;
    }
    
    try {
      console.log('🔐 Resetting password for trainer:', trainerId);
      
      // Use the admin reset password endpoint
      await api.put(`/trainer/admin/${trainerId}/reset-password`);
      
      showNotification(`Password for ${trainerName} has been reset to default`, 'success');
      
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      showNotification(`Failed to reset password: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleDeleteTrainer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      console.log(`🗑️ Deleting trainer ${id}...`);
      
      // Use the admin delete endpoint
      await api.delete(`/trainer/admin/${id}/delete`);
      
      showNotification(`Trainer "${name}" deleted successfully`, 'success');
      fetchTrainers();
      
    } catch (error) {
      console.error('❌ Error deleting trainer:', error);
      showNotification(`Failed to delete trainer: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading trainers...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white animate-slide-in`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trainers Management</h1>
          <p className="text-gray-600">Manage all gym trainers ({trainers.length} total)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiPlus className="mr-2" /> Add Trainer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search trainers by name, email, or specialization..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        Showing {filteredTrainers.length} of {trainers.length} trainers
      </div>

      {/* Trainers Grid */}
      {filteredTrainers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FiUser className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No trainers found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try a different search term' : 'Add your first trainer using the "Add Trainer" button'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <div key={trainer._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mr-4">
                    <span className="text-2xl font-bold text-white">
                      {trainer.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div className="flex-1">
                    {editingTrainer === trainer._id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingFormData.name}
                          onChange={(e) => setEditingFormData({...editingFormData, name: e.target.value})}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Name"
                        />
                        <input
                          type="email"
                          value={editingFormData.email}
                          onChange={(e) => setEditingFormData({...editingFormData, email: e.target.value})}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-800">{trainer.name}</h3>
                        <p className="text-gray-600 text-sm truncate">{trainer.email}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center">
                    <FiStar className="text-yellow-500 mr-2 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">Specialization:</span>
                      {editingTrainer === trainer._id ? (
                        <select
                          value={editingFormData.specialization}
                          onChange={(e) => setEditingFormData({...editingFormData, specialization: e.target.value})}
                          className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          {specializations.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          {trainer.specialization || 'General'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">Experience:</span>
                    {editingTrainer === trainer._id ? (
                      <input
                        type="number"
                        value={editingFormData.experience}
                        onChange={(e) => setEditingFormData({...editingFormData, experience: e.target.value})}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Years"
                        min="0"
                        max="50"
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold">
                        {trainer.experience || 0} years
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">Phone:</span>
                    {editingTrainer === trainer._id ? (
                      <input
                        type="tel"
                        value={editingFormData.phone}
                        onChange={(e) => setEditingFormData({...editingFormData, phone: e.target.value})}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone"
                      />
                    ) : (
                      <span className="text-gray-600">{trainer.phone || 'Not provided'}</span>
                    )}
                  </div>
                  
                  {/* Bio field */}
                  <div className="mt-2">
                    <span className="font-medium text-gray-700 mb-1 block">Bio:</span>
                    {editingTrainer === trainer._id ? (
                      <textarea
                        value={editingFormData.bio}
                        onChange={(e) => setEditingFormData({...editingFormData, bio: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Add bio..."
                        rows="2"
                      />
                    ) : (
                      <p className="text-gray-600 text-sm">
                        {trainer.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">
                    ID: {trainer._id?.substring(0, 8)}...
                  </div>
                  
                  <div className="flex space-x-3">
                    {editingTrainer === trainer._id ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800 p-1"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                        <button
                          onClick={() => handleSaveEdit(trainer._id)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Save changes"
                        >
                          <FiSave size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditTrainer(trainer)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit trainer"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(trainer._id, trainer.name)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Reset password to default"
                        >
                          <FiKey size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrainer(trainer._id, trainer.name)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete trainer"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Trainer</h2>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  >
                    <option value="">Select Specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    placeholder="Enter years of experience"
                    min="0"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio (Optional)
                  </label>
                  <textarea
                    placeholder="Tell us about the trainer's background, certifications, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
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
                  onClick={handleAddTrainer}
                  disabled={!formData.name || !formData.email}
                  className={`px-5 py-2 rounded-lg transition-colors ${
                    !formData.name || !formData.email
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Add Trainer
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>* Required fields</p>
                <p>Default password will be set to "trainer123"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}