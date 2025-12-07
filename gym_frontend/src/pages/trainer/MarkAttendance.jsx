import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Users, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Clock,
  Smartphone,
  AlertCircle,
  BarChart3,
  Target,
  Clock3
} from 'lucide-react';
import api from '../../utils/api';

const MarkAttendance = () => {
  const [activeTab, setActiveTab] = useState('gym'); // 'gym' or 'training'
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrMessage, setQrMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    fetchTodayStatus();
    fetchMembers();
    fetchTrainerStats();
    fetchRecentSessions();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const response = await api.get('/attendance/trainer/today-status');
      if (response.data.success) {
        setTodayStatus(response.data.today);
      }
    } catch (error) {
      console.error('Error fetching today status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/attendance/trainer/members');
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchTrainerStats = async () => {
    try {
      const response = await api.get('/attendance/trainer/stats');
      if (response.data.success) {
        setAttendanceStats(response.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const response = await api.get('/attendance/trainer/recent-sessions');
      if (response.data.success) {
        setRecentSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  };

  const markGymVisit = async () => {
    setIsMarking(true);
    try {
      await api.post('/attendance/trainer/gym-visit', {
        method: 'manual'
      });
      
      alert('✅ Gym visit attendance marked successfully!');
      await fetchTodayStatus();
      await fetchTrainerStats();
    } catch (error) {
      console.error('Error marking gym visit:', error);
      alert(error.response?.data?.message || 'Error marking gym visit');
    } finally {
      setIsMarking(false);
    }
  };

  const markPersonalTraining = async () => {
    if (!selectedMember) {
      alert('Please select a member');
      return;
    }

    setIsMarking(true);
    try {
      await api.post('/attendance/trainer/personal-training', {
        memberId: selectedMember,
        duration: duration,
        notes: notes,
        method: 'manual'
      });
      
      alert('✅ Personal training session recorded successfully!');
      
      // Reset form
      setSelectedMember('');
      setDuration(60);
      setNotes('');
      
      await fetchTodayStatus();
      await fetchTrainerStats();
      await fetchRecentSessions();
    } catch (error) {
      console.error('Error marking personal training:', error);
      alert(error.response?.data?.message || 'Error recording session');
    } finally {
      setIsMarking(false);
    }
  };

 const generateQRCode = async () => {
  setQrLoading(true);
  setQrMessage('');
  
  try {
    // ✅ CORRECT: Use the unified endpoint with qrType parameter
    const response = await api.post('/attendance/generate-qr', {
      qrType: 'trainer'  // Important: specify this is a trainer QR code
    });
    
    if (response.data.success) {
      setQrCode(response.data.qrCode);
      setQrMessage('✅ QR Code generated! Show at scanner.');
      
      // Display QR code details in console for debugging
      console.log('QR Code generated successfully:', {
        trainerName: response.data.details?.name,
        qrType: response.data.details?.type,
        expiresAt: new Date(response.data.expiresAt).toLocaleTimeString()
      });
      
      setTimeout(() => {
        setQrMessage('⚠️ QR code expired. Generate new one.');
        setQrCode('');
      }, 300000); // 5 minutes
    }
  } catch (error) {
    console.error('Error generating QR:', error);
    setQrMessage('❌ Failed to generate QR code');
    
    // Provide more specific error message
    if (error.response?.status === 404) {
      setQrMessage('❌ API endpoint not found. Contact administrator.');
    } else if (error.response?.status === 403) {
      setQrMessage('❌ Unauthorized. Only trainers can generate QR codes.');
    } else {
      setQrMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  } finally {
    setQrLoading(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trainer Attendance</h1>
          <p className="text-gray-600 mt-2">Mark your gym visits and record personal training sessions</p>
        </div>

        {/* Stats Overview */}
        {attendanceStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.totalSessions}</h3>
                  <p className="text-sm font-medium text-gray-900">Total Sessions</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <User className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.gymVisits}</h3>
                  <p className="text-sm font-medium text-gray-900">Gym Visits</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Target className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.trainingSessions}</h3>
                  <p className="text-sm font-medium text-gray-900">Training Sessions</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.uniqueMembersTrained}</h3>
                  <p className="text-sm font-medium text-gray-900">Members Trained</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Status - {new Date().toLocaleDateString()}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg border-2 ${todayStatus?.gymVisitMarked ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${todayStatus?.gymVisitMarked ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Gym Visit</h3>
                    <p className={`text-sm font-semibold ${todayStatus?.gymVisitMarked ? 'text-green-700' : 'text-yellow-700'}`}>
                      {todayStatus?.gymVisitMarked ? '✓ Marked' : 'Not Marked'}
                    </p>
                  </div>
                </div>
                {todayStatus?.gymVisitMarked && todayStatus.gymVisit && (
                  <span className="text-sm text-gray-500">
                    {new Date(todayStatus.gymVisit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            
            <div className={`p-6 rounded-lg border-2 ${todayStatus?.personalSessions > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${todayStatus?.personalSessions > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Training Sessions</h3>
                  <p className="text-2xl font-bold text-gray-900">{todayStatus?.personalSessions || 0}</p>
                  <p className="text-sm text-gray-500">Today</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('gym')}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'gym'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 mr-2" />
                  Gym Visit Check-in
                </div>
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'training'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Users className="h-5 w-5 mr-2" />
                  Record Training Session
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'gym' ? (
              // Gym Visit Tab
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Manual Check-in Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center mb-6">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900">Manual Check-in</h3>
                        <p className="text-gray-600">Mark your gym visit manually</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={markGymVisit}
                      disabled={isMarking || todayStatus?.gymVisitMarked}
                      className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-medium text-lg ${
                        todayStatus?.gymVisitMarked
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {isMarking ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-6 w-6 mr-3" />
                          {todayStatus?.gymVisitMarked ? '✓ Already Checked In' : 'Check In Now'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* QR Code Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center mb-6">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900">QR Code Check-in</h3>
                        <p className="text-gray-600">Generate QR for scanner</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={generateQRCode}
                      disabled={qrLoading || todayStatus?.gymVisitMarked}
                      className="w-full flex items-center justify-center px-6 py-4 rounded-xl font-medium text-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      {qrLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-6 w-6 mr-3" />
                          Generate QR Code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code Display */}
                {qrMessage && (
                  <div className={`p-4 rounded-lg ${
                    qrMessage.includes('✅') 
                      ? 'bg-green-50 text-green-800 border-2 border-green-200' 
                      : qrMessage.includes('⚠️')
                      ? 'bg-yellow-50 text-yellow-800 border-2 border-yellow-200'
                      : 'bg-red-50 text-red-800 border-2 border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {qrMessage.includes('✅') 
                        ? <CheckCircle className="h-5 w-5 mr-2" />
                        : qrMessage.includes('⚠️')
                        ? <AlertCircle className="h-5 w-5 mr-2" />
                        : <XCircle className="h-5 w-5 mr-2" />
                      }
                      <span className="font-medium">{qrMessage}</span>
                    </div>
                  </div>
                )}

                {qrCode && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Gym Check-in QR Code</h3>
                    <div className="flex flex-col items-center">
                      <img 
                        src={qrCode} 
                        alt="Gym Check-in QR Code" 
                        className="w-80 h-80 border-4 border-gray-300 rounded-2xl p-6 mb-6"
                      />
                      
                      <div className="space-y-3 max-w-md">
                        <div className="flex items-center justify-center text-gray-600">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="font-medium">Expires in 5 minutes</span>
                        </div>
                        
                        <div className="flex items-center justify-center text-gray-600">
                          <Smartphone className="h-5 w-5 mr-2" />
                          <span>Show at gym scanner or save to phone</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setQrCode('')}
                        className="mt-6 px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Close QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Personal Training Tab
              <div className="space-y-8">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Record Personal Training Session</h3>
                  <p className="text-blue-700">
                    Record your personal training sessions with members. Each session will be tracked in your attendance history.
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="space-y-6">
                    {/* Member Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Member <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isMarking}
                      >
                        <option value="">Choose a member...</option>
                        {members.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name} • {member.membershipType || 'Member'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Duration (minutes) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                            min="15"
                            max="180"
                            step="15"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isMarking}
                          />
                          <div className="absolute right-3 top-3 text-gray-500">
                            mins
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter session details, exercises covered, progress notes..."
                        disabled={isMarking}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={markPersonalTraining}
                      disabled={isMarking || !selectedMember}
                      className="w-full flex items-center justify-center px-6 py-4 rounded-xl font-medium text-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {isMarking ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Recording Session...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-6 w-6 mr-3" />
                          Record Training Session
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Today's Sessions */}
                {todayStatus?.personalSessionsList && todayStatus.personalSessionsList.length > 0 && (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Today's Training Sessions</h3>
                    <div className="space-y-4">
                      {todayStatus.personalSessionsList.map((session) => (
                        <div key={session._id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="ml-4">
                              <h4 className="font-medium text-gray-900">
                                {session.member?.name || 'Member'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {session.duration} minutes • {session.notes || 'No notes'}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(session.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions Table */}
        {recentSessions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Training Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSessions.map((session) => (
                    <tr key={session._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {session.member?.name || 'Member'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.member?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock3 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {session.duration} minutes
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {session.notes || 'No notes'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-2">How Trainer Attendance Works</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Gym Visit:</strong> Mark when you arrive at the gym (once per day)</li>
                <li>• <strong>Personal Training:</strong> Record each personal training session with members</li>
                <li>• <strong>QR Code:</strong> Generate for quick check-in at gym entrance</li>
                <li>• <strong>Manual Check-in:</strong> Use when QR scanner is not available</li>
                <li>• <strong>Attendance History:</strong> All your sessions are tracked for reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;