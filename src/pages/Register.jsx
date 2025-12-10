import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false, // Add admin checkbox for development
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Include role in registration data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.isAdmin ? 'admin' : 'user'
      };

      await register(userData);
      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-900 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <img src="/Fivescores logo.svg" alt="Fivescores" className="w-16 h-16 mx-auto mb-4" />
            <p className="text-gray-400 mt-2">Create your account</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-black placeholder-gray-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-black placeholder-gray-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-black placeholder-gray-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>

            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-black placeholder-gray-500 focus:outline-none transition-colors duration-200"
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>

            {/* Admin checkbox for development */}
            {import.meta.env.DEV && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-300">
                  Create as Admin (Development only)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
