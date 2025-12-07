import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'member', adminPasskey: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.role !== 'admin') delete payload.adminPasskey;

      const res = await api.post('/auth/signup', payload);
      console.log(res.data);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="name">Name:</label>
          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" required />
          <br />
          <label htmlFor="email">Email:</label>
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" required />
          <br />
          <label htmlFor="phone">Phone Number:</label>
          <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded" required />
          <br />
          <label htmlFor="password">Password:</label>
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border p-2 rounded" required />
          <br />
          <label htmlFor="role">Role:</label>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded" required>
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
          <br />
          {formData.role === 'admin' && (
            <>
              <label htmlFor="adminPasskey">Admin Passkey:</label>
              <input name="adminPasskey" placeholder="Admin Passkey" value={formData.adminPasskey} onChange={handleChange} className="w-full border p-2 rounded" required />
            </>
          )}
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Sign Up</button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
