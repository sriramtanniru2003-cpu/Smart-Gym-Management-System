import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.email || !formData.password) {
    setError("Please enter both email and password");
    return;
  }

  try {
    console.log('🔄 Sending login request...');
    
    const res = await api.post('/auth/login', {
      email: formData.email,
      password: formData.password
    });

    console.log('✅ Login response:', res.data);
    
    // Store token and user info
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.user.role);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('userId', res.data.user.id);

    // Navigate based on role
    const role = res.data.user.role;
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'trainer') navigate('/trainer/dashboard');
    else navigate('/member/dashboard');

  } catch (err) {
    console.error("❌ Login error:", err.response?.data || err.message);
    setError(err.response?.data?.message || 'Login failed');
  }
};
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="email">Email:</label>
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" required />
          <br />
          <label htmlFor="password">Password:</label>
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border p-2 rounded" required />
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Sign In</button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
