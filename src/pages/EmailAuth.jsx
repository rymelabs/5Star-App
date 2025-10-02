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
      <div className="w-full max-w-md relative z-50 animate-[fadeInUp_0.6s_ease-out]">
        <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-8 border-primary-600 border-2 shadow-2xl hover:shadow-primary-500/20 transition-shadow duration-300">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/auth')}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </button>
            <div className="flex-1 text-center">
              <img src="/5StarLogo.svg" alt="5Star Logo" className="w-36 h-36 mx-auto animate-[fadeIn_0.8s_ease-out]" />
            </div>
          </div>

          <div className="text-center mb-1 animate-[fadeInUp_0.7s_ease-out]">
            <h1 className="text-[30px] font-bold text-primary-600 tracking-tight mb-1 animate-[slideInRight_0.6s_ease-out]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400 text-[15px] animate-[fadeIn_0.9s_ease-out]">
              {isSignUp ? 'Sign up with your email address' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 animate-[slideInDown_0.3s_ease-out]">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="animate-[fadeInUp_0.8s_ease-out]" style={{ animationDelay: '0.1s' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/5 focus:scale-[1.01]"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <div className="animate-[fadeInUp_0.8s_ease-out]" style={{ animationDelay: '0.2s' }}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/5 focus:scale-[1.01]"
                placeholder="Enter your password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={6}
              />
            </div>

            {isSignUp && (
              <div className="animate-[fadeInUp_0.8s_ease-out]" style={{ animationDelay: '0.3s' }}>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/5 focus:scale-[1.01]"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-lg hover:shadow-xl disabled:hover:scale-100 group"
            >
              <span className="inline-flex items-center justify-center">
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center animate-[fadeIn_1s_ease-out]">
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
              className="text-primary-400 hover:text-primary-300 text-sm transition-all duration-300 hover:scale-105 inline-block"
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