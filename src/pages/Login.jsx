import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('👤 User already logged in, redirecting...');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Attempting login...');
      
      const userData = await login(formData.email, formData.password);
      console.log('✅ Login successful, user data:', userData);
      
      // Small delay to ensure auth state updates
      setTimeout(() => {
        console.log('🔄 Navigating to home page...');
        navigate('/', { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // More specific error messages
      if (error.message.includes('invalid-credential')) {
        setError('No account found with these credentials. Please register first or check your email/password.');
      } else if (error.message.includes('user-not-found')) {
        setError('No account found with this email address. Please register first.');
      } else if (error.message.includes('wrong-password')) {
        setError('Incorrect password. Please try again.');
      } else if (error.message.includes('too-many-requests')) {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading if user is being checked
  if (user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary-500">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-900 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <img src="/5StarLogo.svg" alt="5Star Logo" className="w-16 h-16 mx-auto mb-4" />
            <p className="text-gray-400 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link to="/register" className="block text-primary-400 hover:text-primary-300 text-sm">
              Don't have an account? Create one
            </Link>
            
            {/* Development helper */}
            {import.meta.env.DEV && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs mb-2">🛠️ Development Mode</p>
                <p className="text-gray-400 text-xs">
                  No account yet? <Link to="/register" className="text-primary-400 underline">Register first</Link> to create your admin account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;