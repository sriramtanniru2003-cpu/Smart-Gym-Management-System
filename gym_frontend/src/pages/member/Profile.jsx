import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/member/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/member/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
        setIsEditing(false);
        setMessage("✅ Profile updated successfully!");
        // Update localStorage if name changed
        localStorage.setItem("userName", data.name);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to update profile");
      }
    } catch (error) {
      setMessage("Error updating profile");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-lg ${
              message.includes("✅")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-5xl font-bold">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {profile?.name}
              </h2>
              <p className="text-gray-600 mb-1">{profile?.email}</p>
              <p className="text-gray-600 mb-4">{profile?.phone || "No phone"}</p>
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {profile?.role?.toUpperCase()}
              </div>
            </div>

            {/* Trainer Info */}
            {profile?.trainer && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Your Trainer
                </h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-3">
                    {profile.trainer.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {profile.trainer.name}
                    </p>
                    <p className="text-sm text-gray-600">{profile.trainer.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Personal Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: profile.name,
                            email: profile.email,
                            phone: profile.phone || "",
                          });
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile?.name}
                    </p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile?.email}
                    </p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile?.phone || "Not provided"}
                    </p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-500 mb-1">Member Since</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(profile?.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}