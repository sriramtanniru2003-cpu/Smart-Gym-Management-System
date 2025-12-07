// MyClasses.jsx - Clean version
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MemberClasses.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MyClasses = () => {
    const [myClasses, setMyClasses] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Debug: Check if component loads
    console.log('🎯 MyClasses component loaded');
    console.log('🔧 API_BASE_URL:', API_BASE_URL);

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        console.log('🔍 Auth check - Token:', token ? 'Yes' : 'No');
        console.log('🔍 Auth check - Role:', role);
        
        if (!token) {
            console.log('❌ No token, redirecting to login');
            navigate('/login');
            return;
        }
        
        if (role !== 'member') {
            console.log(`❌ Role is "${role}", should be "member"`);
            alert('Access denied. Members only.');
            navigate('/dashboard');
            return;
        }
        
        console.log('✅ Auth passed, fetching data...');
        fetchMyClasses();
        fetchAllClasses();
    }, [navigate]);

    const fetchMyClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('📤 Fetching my classes...');
            console.log('🔑 Using token (first 20 chars):', token?.substring(0, 20));
            
            const url = `${API_BASE_URL}/classes/member/my-classes`;
            console.log('🌐 URL:', url);
            
            const response = await axios.get(url, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ My classes fetched:', response.data.length, 'classes');
            setMyClasses(response.data);
        } catch (err) {
            console.error('❌ Error fetching my classes:', err.message);
            console.error('Full error:', err);
            
            if (err.response?.status === 401) {
                alert('Session expired. Please login again.');
                localStorage.clear();
                navigate('/login');
            }
            setError('Failed to load your enrolled classes');
        }
    };

    const fetchAllClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('📤 Fetching all classes...');
            
            const response = await axios.get(`${API_BASE_URL}/classes`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ All classes fetched:', response.data.length, 'classes');
            setAllClasses(response.data);
        } catch (err) {
            console.error('❌ Error fetching all classes:', err.message);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (classId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/classes/${classId}/enroll`, {}, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            alert('Successfully enrolled!');
            fetchMyClasses();
            fetchAllClasses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to enroll');
        }
    };

    const handleUnenroll = async (classId) => {
        if (!window.confirm('Are you sure you want to unenroll?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/classes/${classId}/unenroll`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            alert('Unenrolled successfully');
            fetchMyClasses();
            fetchAllClasses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unenroll');
        }
    };

    const formatTime = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading classes...</p>
            </div>
        );
    }

    return (
        <div className="member-classes-container">
            <div className="header-section">
                <h1>My Classes</h1>
                <p>Manage your class enrollments</p>
            </div>

            {error && (
                <div className="error-alert">
                    <span>{error}</span>
                    <button onClick={() => { 
                        setError('');
                        fetchMyClasses();
                        fetchAllClasses();
                    }}>
                        Retry
                    </button>
                </div>
            )}

            {/* Enrolled Classes */}
            <section className="enrolled-classes-section">
                <h2>Enrolled Classes ({myClasses.length})</h2>

                {myClasses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <h3>No classes enrolled</h3>
                        <p>Browse available classes below to get started!</p>
                    </div>
                ) : (
                    <div className="classes-grid">
                        {myClasses.map((classItem) => (
                            <div key={classItem._id} className="class-card enrolled">
                                <div className="class-header">
                                    <h3>{classItem.name}</h3>
                                    <span className="enrolled-badge">Enrolled</span>
                                </div>

                                <p className="class-description">{classItem.description}</p>

                                <div className="class-details">
                                    <div><b>📅 Schedule:</b> {classItem.schedule || 'Not scheduled'}</div>
                                    <div><b>⏱ Duration:</b> {formatTime(classItem.duration)}</div>
                                    <div><b>👤 Trainer:</b> {classItem.trainerId?.name || 'Not Assigned'}</div>
                                </div>

                                <button 
                                    className="btn-unenroll" 
                                    onClick={() => handleUnenroll(classItem._id)}
                                >
                                    Unenroll
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Available Classes */}
            <section className="available-classes-section">
                <h2>Available Classes</h2>

                <div className="classes-grid">
                    {allClasses
                        .filter(c => !myClasses.some(m => m._id === c._id))
                        .map((classItem) => {
                            const capacity = classItem.capacity || 20;
                            const membersCount = classItem.members?.length || 0;
                            const isFull = membersCount >= capacity;

                            return (
                                <div key={classItem._id} className="class-card available">
                                    <div className="class-header">
                                        <h3>{classItem.name}</h3>
                                        {isFull ? (
                                            <span className="full-badge">Full</span>
                                        ) : (
                                            <span className="spots-badge">
                                                {capacity - membersCount} spots left
                                            </span>
                                        )}
                                    </div>

                                    <p className="class-description">{classItem.description}</p>

                                    <div className="class-details">
                                        <div><b>📅 Schedule:</b> {classItem.schedule}</div>
                                        <div><b>⏱ Duration:</b> {formatTime(classItem.duration)}</div>
                                        <div><b>👤 Trainer:</b> {classItem.trainerId?.name || 'Not Assigned'}</div>
                                    </div>

                                    <button
                                        className={`btn-enroll ${isFull ? 'disabled' : ''}`}
                                        disabled={isFull}
                                        onClick={() => !isFull && handleEnroll(classItem._id)}
                                    >
                                        {isFull ? 'Class Full' : 'Enroll Now'}
                                    </button>
                                </div>
                            );
                        })}

                    {/* No available classes */}
                    {allClasses.filter(c => !myClasses.some(m => m._id === c._id)).length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">🎉</div>
                            <h3>No More Classes</h3>
                            <p>You are already enrolled in all available classes!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MyClasses;