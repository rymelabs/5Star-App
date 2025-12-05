import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Chrome, User, Sparkles, Trophy, Zap, Shield } from 'lucide-react';
import AuthBackground from '../components/AuthBackground';
import LegalModal from '../components/LegalModal';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

const AuthLanding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLegal, setShowLegal] = useState({ open: false, type: null });
  const { signInWithGoogle, signInAnonymously } = useAuth();
  const navigate = useNavigate();

  const isFestiveSeason = new Date().getMonth() === 11; // December
  // Use existing assets in /public
  const logoSrc = isFestiveSeason
    ? '/Fivescores logo Christmas.svg'
    : '/Fivescores logo.png';
  const logoAlt = isFestiveSeason ? 'Fivescores Christmas' : 'Fivescores';

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = await signInWithGoogle();
      
      // Only redirect to profile setup if profile is not completed
      if (!userData.profileCompleted) {
        navigate('/profile-setup');
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInAnonymously();
      // Anonymous users always go to profile setup
      navigate('/profile-setup');
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      setError('Failed to sign in anonymously. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const authOptions = [
    {
      id: 'email',
      icon: Mail,
      title: 'Continue with Email',
      description: 'Sign in with your email address',
      onClick: () => navigate('/email-auth'),
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderGlow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
    },
    {
      id: 'google',
      icon: Chrome,
      title: 'Continue with Google',
      description: 'Fast and secure authentication',
      onClick: handleGoogleSignIn,
      gradient: 'from-red-500 to-pink-500',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      borderGlow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]'
    },
    {
      id: 'anonymous',
      icon: User,
      title: 'Browse as Guest',
      description: 'Limited features, no account needed',
      onClick: handleAnonymousSignIn,
      gradient: 'from-gray-500 to-gray-600',
      iconBg: 'bg-gray-500/10',
      iconColor: 'text-gray-400',
      borderGlow: 'hover:shadow-[0_0_30px_rgba(107,114,128,0.2)]'
    }
  ];

  const features = [
    { icon: Trophy, text: 'Live Match Updates' },
    { icon: Zap, text: 'Real-time Scores' },
    { icon: Shield, text: 'Secure & Private' }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-app px-4 py-8">
      {/* Enhanced Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-purple/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Heading (stacked welcome above seasonal logo) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-10 relative z-10"
      >
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight flex flex-col items-center justify-center gap-2">
          <span className="leading-tight">Welcome to</span>
          <img
            src={logoSrc}
            alt={logoAlt}
            className="h-10 md:h-12 w-auto drop-shadow-[0_10px_40px_rgba(109,40,217,0.45)]"
          />
        </h1>
        <p className="text-white/60 text-sm md:text-base font-medium">
          Your premium sports experience starts here
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

      {/* Auth Options */}
      <div className="flex flex-col gap-3 mb-8 relative z-10 max-w-md mx-auto w-full">
        {authOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              onClick={option.onClick}
              disabled={loading}
              className={`w-full group relative border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${option.borderGlow}`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-12 h-12 ${option.iconBg} rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`w-5 h-5 ${option.iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-white text-base mb-0.5 tracking-tight">
                    {option.title}
                  </h3>
                  <p className="text-xs text-white/50 font-medium">
                    {option.description}
                  </p>
                </div>
                {loading && (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex items-center justify-center gap-6 mb-8 pb-8 border-b border-white/5 relative z-10"
      >
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <feature.icon className="w-4 h-4 text-brand-purple" />
            <span className="text-xs font-medium text-white/60">{feature.text}</span>
          </div>
        ))}
      </motion.div>

      {/* Legal Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-center mb-6 relative z-10"
      >
        <p className="text-xs text-white/40 leading-relaxed">
          By continuing, you agree to our{' '}
          <button
            onClick={() => setShowLegal({ open: true, type: 'terms' })}
            className="text-brand-purple hover:text-brand-purple/80 font-semibold transition-colors underline underline-offset-2"
          >
            Terms
          </button>{' '}
          and{' '}
          <button
            onClick={() => setShowLegal({ open: true, type: 'privacy' })}
            className="text-brand-purple hover:text-brand-purple/80 font-semibold transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </button>
        </p>
      </motion.div>

      {/* Floating Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10">
          <Sparkles className="w-3 h-3 text-brand-purple" />
          <span className="text-xs font-semibold text-white/70">Trusted by thousands of sports fans</span>
        </div>
      </motion.div>

      {/* Legal Modal */}
      <LegalModal
        open={showLegal.open}
        onClose={() => setShowLegal({ open: false, type: null })}
        title={showLegal.type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
      >
        {showLegal.type === 'terms' ? (
          <TermsOfService />
        ) : (
          <PrivacyPolicy />
        )}
      </LegalModal>
    </div>
  );
};

export default AuthLanding;