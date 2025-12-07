// src/pages/admin/Attendance.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { FiCalendar, FiCheckCircle, FiXCircle, FiSearch, FiDownload, FiCamera } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import QRScanner from '../../components/QRScanner'; // We'll create this component

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0
  });
  const [allMembers, setAllMembers] = useState([]);
  const [membersWithoutAttendance, setMembersWithoutAttendance] = useState([]);

  // Memoize fetchAttendance to prevent infinite loops
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await api.get(`/attendance?date=${dateStr}`);
      const attendanceData = res.data.data || [];
      setAttendance(attendanceData);
      
      // Also fetch all members to show who hasn't checked in
      const membersRes = await api.get('/members');
      const allMembersData = membersRes.data.data || [];
      setAllMembers(allMembersData);

      // Find members without attendance for today
      const attendedMemberIds = new Set(attendanceData.map(a => a.member?._id).filter(Boolean));
      const missingAttendance = allMembersData.filter(member => 
        !attendedMemberIds.has(member._id)
      );
      setMembersWithoutAttendance(missingAttendance);

      // Calculate stats
      const total = allMembersData.length;
      const present = attendanceData.filter(a => a.status === 'present').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      
      setStats({
        total,
        present,
        absent: total - present,
        rate
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleMarkAttendance = async (memberId, status) => {
    try {
      await api.post('/attendance/mark', {
        memberId,
        status,
        date: selectedDate.toISOString(),
        method: 'manual'
      });
      
      // Update local state immediately
      setAttendance(prev => {
        // Check if attendance already exists for this member on this date
        const existingIndex = prev.findIndex(a => 
          a.member?._id === memberId && 
          new Date(a.date).toDateString() === selectedDate.toDateString()
        );
        
        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status,
            method: 'manual',
            time: new Date().toLocaleTimeString()
          };
          return updated;
        } else {
          // Add new record
          const newRecord = {
            _id: `temp_${Date.now()}`,
            member: allMembers.find(m => m._id === memberId),
            status,
            method: 'manual',
            date: selectedDate,
            time: new Date().toLocaleTimeString()
          };
          return [...prev, newRecord];
        }
      });
      
      // Update members without attendance
      setMembersWithoutAttendance(prev => 
        prev.filter(member => member._id !== memberId)
      );
      
      // Recalculate stats
      const presentCount = status === 'present' ? stats.present + 1 : stats.present;
      const absentCount = status === 'absent' ? stats.absent + 1 : stats.absent;
      
      setStats({
        ...stats,
        present: presentCount,
        absent: absentCount,
        rate: Math.round((presentCount / stats.total) * 100)
      });
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      const response = await api.post('/attendance/qr/scan', {
        qrToken: qrData
      });
      
      if (response.data.success) {
        if (response.data.alreadyMarked) {
          alert('Attendance already marked for today!');
        } else {
          alert(`Attendance marked for ${response.data.role}!`);
          // Refresh attendance data
          fetchAttendance();
        }
        setShowScanner(false);
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      alert('Failed to scan QR: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredAttendance = attendance.filter(record =>
    record.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.member?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvData = [
      ...filteredAttendance.map(record => ({
        Name: record.member?.name,
        Email: record.member?.email,
        Status: record.status,
        Time: record.time || record.checkedInAt || '-',
        Method: record.method || 'manual'
      })),
      ...membersWithoutAttendance.map(member => ({
        Name: member.name,
        Email: member.email,
        Status: 'absent',
        Time: '-',
        Method: 'not marked'
      }))
    ];
    
    const csvContent = [
      ['Name', 'Email', 'Status', 'Time', 'Method'].join(','),
      ...csvData.map(row => [
        `"${row.Name || ''}"`,
        `"${row.Email || ''}"`,
        `"${row.Status}"`,
        `"${row.Time}"`,
        `"${row.Method}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate.toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generateMemberQR = async (memberId) => {
    try {
      const response = await api.get('/attendance/qr/generate');
      if (response.data.success) {
        // Show QR code modal
        const qrWindow = window.open('', '_blank');
        qrWindow.document.write(`
          <html>
            <head><title>Member QR Code</title></head>
            <body style="text-align:center; padding:20px;">
              <h2>Scan QR Code for Attendance</h2>
              <img src="${response.data.qrCode}" style="max-width:300px;">
              <p>Valid for today only</p>
              <button onclick="window.print()">Print QR</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
        <p className="text-gray-600">Track and manage member attendance</p>
      </div>

      {/* Stats and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* ... (stats cards remain the same) ... */}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <span className="mr-2">Date:</span>
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
            />
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FiCamera className="mr-2" /> Scan QR Code
          </button>
          <button
            onClick={() => generateMemberQR()}
            className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Generate QR Code
          </button>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiDownload className="mr-2" /> Export CSV
        </button>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>
            <QRScanner onScan={handleQRScan} />
            <button
              onClick={() => setShowScanner(false)}
              className="mt-4 w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">
            Attendance Records ({filteredAttendance.length})
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAttendance.map((record) => (
              <tr key={record._id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="font-bold">{record.member?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{record.member?.name}</div>
                      <div className="text-sm text-gray-500">{record.member?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {record.time || record.checkedInAt ? 
                    new Date(record.checkedInAt || record.date).toLocaleTimeString() : 
                    '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="capitalize">{record.method || 'manual'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMarkAttendance(record.member?._id, 'present')}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(record.member?._id, 'absent')}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => generateMemberQR(record.member?._id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      QR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members Without Attendance */}
      {membersWithoutAttendance.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-yellow-50 border-b">
            <h3 className="font-semibold text-yellow-700">
              Members Without Attendance ({membersWithoutAttendance.length})
            </h3>
            <p className="text-sm text-yellow-600">These members haven't checked in today</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {membersWithoutAttendance.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="font-bold">{member.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMarkAttendance(member._id, 'present')}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Mark Present
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(member._id, 'absent')}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Mark Absent
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
  );
}