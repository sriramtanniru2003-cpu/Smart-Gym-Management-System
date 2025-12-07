import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Membership() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPlans, setShowPlans] = useState(false);

  const membershipPlans = [
    {
      id: 1,
      name: "Basic",
      duration: "1 month",
      price: "$29.99",
      features: ["Gym Access", "Locker Room", "Free Wi-Fi"],
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      name: "Pro",
      duration: "3 months",
      price: "$79.99",
      features: ["All Basic Features", "Group Classes", "Fitness Assessment"],
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      name: "Elite",
      duration: "6 months",
      price: "$149.99",
      features: ["All Pro Features", "Personal Trainer Sessions", "Nutrition Planning"],
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      name: "Ultimate",
      duration: "annual",
      price: "$279.99",
      features: ["All Elite Features", "Unlimited Guest Passes", "Massage Therapy"],
      color: "from-orange-500 to-orange-600"
    }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/member/profile`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        // Token expired - show message instead of immediate logout
        setMessage({
          type: 'warning',
          text: 'Your session has expired. Please login again.'
        });
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }, 3000);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile information'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan) => {
  console.log("Selecting plan:", plan);
  
  setUpdating(true);
  setMessage({ type: '', text: '' });

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Debug: Check token payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('User role in token:', payload.role);
      
      if (payload.role !== 'member') {
        setMessage({
          type: 'error',
          text: `❌ You are logged in as ${payload.role}. Only members can update membership.`
        });
        setUpdating(false);
        return;
      }
    } catch (e) {
      console.error('Error decoding token:', e);
    }

    const response = await fetch(`${API_BASE_URL}/member/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        membershipType: plan.duration,
      }),
    });

    console.log("Update response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Update success:", data);
      // Handle success...
    } else if (response.status === 403) {
      const errorData = await response.json();
      console.error("403 Forbidden:", errorData);
      
      setMessage({
        type: 'error',
        text: '❌ Permission denied. You do not have permission to update membership.'
      });
      
      // Check if user needs to login as member
      setTimeout(() => {
        const confirm = window.confirm(
          "You don't have permission to update membership. Would you like to login as a member?"
        );
        if (confirm) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }, 1000);
    } else {
      const errorData = await response.json();
      console.error("Update error:", errorData);
      setMessage({
        type: 'error',
        text: `❌ ${errorData.message || "Failed to update membership"}`
      });
    }
  } catch (error) {
    console.error("Network error:", error);
    setMessage({
      type: 'error',
      text: '❌ Network error. Please check your connection.'
    });
  } finally {
    setUpdating(false);
  }
};

  const calculateDaysRemaining = () => {
    if (!profile?.endDate) return 0;
    
    const endDate = new Date(profile.endDate);
    const today = new Date();
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading membership information...</div>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining();
  const hasActiveMembership = profile?.membershipType && daysRemaining > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Membership Management</h1>
          <p className="text-gray-600">View and manage your gym membership plans</p>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {message.type === 'error' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {message.type === 'warning' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Current Membership Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {hasActiveMembership ? profile.membershipType : "No Active Membership"}
              </h2>
              <div className="flex items-center">
                <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                  hasActiveMembership 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasActiveMembership ? 'Active' : 'Inactive'}
                </span>
                {hasActiveMembership && (
                  <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {daysRemaining} days remaining
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowPlans(!showPlans)}
              disabled={updating}
              className={`mt-4 md:mt-0 px-6 py-3 rounded-lg font-semibold transition-colors ${
                updating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showPlans ? 'Hide Plans' : 'Change Plan'}
            </button>
          </div>

          {/* Membership Details */}
          {hasActiveMembership ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Start Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(profile.startDate)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">End Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(profile.endDate)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Member Since</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Membership</h3>
              <p className="text-gray-600 mb-6">Select a plan below to start your fitness journey</p>
              <button
                onClick={() => setShowPlans(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                Browse Plans
              </button>
            </div>
          )}
        </div>

        {/* Membership Plans */}
        {showPlans && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipPlans.map((plan) => {
                const isCurrentPlan = profile?.membershipType === plan.duration;
                
                return (
                  <div
                    key={plan.id}
                    className={`bg-gradient-to-br ${plan.color} text-white rounded-xl shadow-lg p-6 transform transition-all hover:scale-105 hover:shadow-xl ${
                      isCurrentPlan ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
                    }`}
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold mb-2">{plan.price}</div>
                      <p className="text-blue-100">{plan.duration}</p>
                    </div>

                    <ul className="mb-6 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={updating || isCurrentPlan}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        isCurrentPlan
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : updating
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {isCurrentPlan ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Current Plan
                        </span>
                      ) : updating ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Select Plan'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Membership Benefits */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Membership Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">🏋️‍♂️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">24/7 Access</h3>
              <p className="text-gray-600">Work out anytime that fits your schedule</p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">👨‍🏫</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Expert Trainers</h3>
              <p className="text-gray-600">Guidance from certified fitness professionals</p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mobile App</h3>
              <p className="text-gray-600">Track progress and book classes on the go</p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Group Classes</h3>
              <p className="text-gray-600">Join motivating group fitness sessions</p>
            </div>
          </div>
        </div>

        {/* Need Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="text-blue-600 mr-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Need Help?</h3>
              <p className="text-blue-700 mb-4">
                Have questions about your membership or want to discuss custom plans? 
                Our support team is here to help you achieve your fitness goals.
              </p>
              <button
                onClick={() => window.location.href = "mailto:support@gymportal.com"}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}