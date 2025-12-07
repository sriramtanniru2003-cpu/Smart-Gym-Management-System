// src/pages/admin/Classes.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiEdit, FiTrash2, FiUsers, FiCalendar, FiPlus, FiClock } from 'react-icons/fi';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trainerId: '',
    date: '',
    time: '',
    duration: 60,
    capacity: 20,
    type: 'group'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, trainersRes] = await Promise.all([
        api.get('/classes'),
        api.get('/trainers')
      ]);
      setClasses(classesRes.data);
      setTrainers(trainersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    try {
      await api.post('/classes', formData);
      fetchData();
      setShowAddModal(false);
      setFormData({
        name: '', description: '', trainerId: '', date: '', time: '',
        duration: 60, capacity: 20, type: 'group'
      });
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.delete(`/classes/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const classTypes = ['Group', 'Personal', 'Yoga', 'Cardio', 'Strength', 'Dance'];
  const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
                    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Classes Management</h1>
          <p className="text-gray-600">Schedule and manage fitness classes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <FiPlus className="mr-2" /> Schedule Class
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => {
          const classDate = new Date(cls.date);
          const isPast = classDate < new Date();
          const enrolled = cls.members?.length || 0;
          const available = cls.capacity - enrolled;

          return (
            <div key={cls._id} className={`bg-white rounded-xl shadow-md overflow-hidden ${
              isPast ? 'opacity-75' : ''
            }`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{cls.name}</h3>
                    <p className="text-gray-600 text-sm">{cls.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isPast ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isPast ? 'Completed' : 'Upcoming'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-400 mr-2" />
                    <span>{classDate.toLocaleDateString()} • {cls.time}</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="text-gray-400 mr-2" />
                    <span>{cls.duration} minutes • {cls.type}</span>
                  </div>
                  <div className="flex items-center">
                    <FiUsers className="text-gray-400 mr-2" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>Enrolled: {enrolled}/{cls.capacity}</span>
                        <span className={available <= 3 ? 'text-red-600' : 'text-green-600'}>
                          {available} spots left
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(enrolled / cls.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {cls.trainerId && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Trainer:</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {cls.trainerId.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleDeleteClass(cls._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 size={20} />
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Schedule New Class</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Class Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <textarea
                  placeholder="Description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.trainerId}
                  onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                >
                  <option value="">Select Trainer</option>
                  {trainers.map(trainer => (
                    <option key={trainer._id} value={trainer._id}>{trainer.name}</option>
                  ))}
                </select>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  {classTypes.map(type => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Duration (minutes)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Capacity"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Schedule Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}