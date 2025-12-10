import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import AuthBackground from '../components/AuthBackground';
import { trackAuthEvent } from '../utils/analytics';

const EmailAuth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
        trackAuthEvent('signup_start');
        const userData = {
          email: formData.email,
          password: formData.password,
          name: '', // Will be set in profile setup
          role: 'user'
        };
        const result = await register(userData);
        trackAuthEvent('signup_success');
        // Only redirect to profile setup if profile is not completed
        if (!result.profileCompleted) {
          navigate('/profile-setup');
        } else {
          navigate('/', { replace: true });
        }
      } else {
        trackAuthEvent('login_start');
        const result = await login(formData.email, formData.password);
        trackAuthEvent('login_success');
        // Check if user has completed profile setup
        if (result && !result.profileCompleted && !result.isAnonymous) {
          navigate('/profile-setup');
        } else {
          navigate('/', { replace: true });
        }
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
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden px-4 py-8">
      {/* Enhanced Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-purple/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back Button & Logo */}
      <div className="flex items-center mb-8 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/auth')}
          className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
        </motion.button>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 flex justify-center"
        >
          <img src="/Fivescores logo.svg" alt="Fivescores" className="w-16 h-16" />
        </motion.div>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8 relative z-10"
      >
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-white/60 text-sm font-medium">
          {isSignUp ? 'Join thousands of sports fans' : 'Sign in to continue'}
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 relative z-10"
        >
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Email Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-semibold text-white/80 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-white/10 hover:border-white/20 focus:border-brand-purple rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(109,40,217,0.2)]"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-semibold text-white/80 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-white/10 hover:border-white/20 focus:border-brand-purple rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(109,40,217,0.2)]"
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Confirm Password Input */}
        {isSignUp && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-white/10 hover:border-white/20 focus:border-brand-purple rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(109,40,217,0.2)]"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-brand-purple to-blue-600 hover:from-brand-purple/90 hover:to-blue-600/90 text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(109,40,217,0.3)] hover:shadow-[0_0_40px_rgba(109,40,217,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
            </>
          ) : (
            <>
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <CheckCircle2 className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      {/* Toggle Sign In/Up */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 text-center relative z-10"
      >
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
          className="text-white/60 hover:text-white text-sm font-medium transition-colors"
        >
          {isSignUp ? (
            <>Already have an account? <span className="text-brand-purple font-bold">Sign in</span></>
          ) : (
            <>Don't have an account? <span className="text-brand-purple font-bold">Sign up</span></>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default EmailAuth;