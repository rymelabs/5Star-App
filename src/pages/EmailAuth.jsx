import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import AuthBackground from '../components/AuthBackground';

const EmailAuth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

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

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isSignUp && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      
      if (isSignUp) {
        const userData = {
          email: formData.email,
          password: formData.password,
          name: '', // Will be set in profile setup
          role: 'user'
        };
        await register(userData);
        navigate('/profile-setup');
      } else {
        await login(formData.email, formData.password);
        navigate('/', { replace: true });
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      
      if (error.message.includes('invalid-credential')) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (error.message.includes('email-already-in-use')) {
        setError('This email is already registered. Try signing in instead.');
      } else if (error.message.includes('user-not-found')) {
        setError('No account found with this email. Try signing up instead.');
      } else if (error.message.includes('weak-password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(error.message || `${isSignUp ? 'Registration' : 'Sign in'} failed. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-50">
        <div className="backdrop-blur-md rounded-2xl p-8 border-primary-600 border-2">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/auth')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1 text-center">
              <img src="/5StarLogo.svg" alt="5Star Logo" className="w-12 h-12 mx-auto" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[30px] font-bold text-primary-600 tracking-tight mb-1">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400 text-[15px]">
              {isSignUp ? 'Sign up with your email address' : 'Sign in to your account'}
            </p>
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
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={6}
              />
            </div>

            {isSignUp && (
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({
                  email: formData.email,
                  password: '',
                  confirmPassword: ''
                });
              }}
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAuth;