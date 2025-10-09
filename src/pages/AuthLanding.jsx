import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Chrome, User, AlignJustify } from 'lucide-react';
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
      description: '',
      onClick: () => navigate('/email-auth'),
      borderColor: 'border-blue-300',
      textColor: 'text-white',
      hoverBorderColor: 'hover:border-blue-400',
      hoverTextColor: 'hover:text-blue-400'
    },
    {
      id: 'google',
      icon: Chrome,
      title: 'Continue with Google',
      description: '',
      onClick: handleGoogleSignIn,
      borderColor: 'border-red-300',
      textColor: 'text-white',
      hoverBorderColor: 'hover:border-red-400',
      hoverTextColor: 'hover:text-red-400'
    },
    {
      id: 'anonymous',
      icon: User,
      title: 'Browse as Guest',
      description: 'Limited access',
      onClick: handleAnonymousSignIn,
      borderColor: 'border-gray-500',
      textColor: 'text-gray-500',
      hoverBorderColor: 'hover:border-gray-400',
      hoverTextColor: 'hover:text-gray-400'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-50 animate-[fadeInUp_0.6s_ease-out]">
        <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-8 border-primary-600 border-2 shadow-2xl hover:shadow-primary-500/20 transition-shadow duration-300">
          <div className="text-center mb-8">
            <img src="/5StarLogo.svg" alt="5Star Logo" className="w-30 h-30 mx-auto mb-6 animate-[fadeIn_0.8s_ease-out]" />
            <h1 className="text-lg font-bold text-left text-white tracking-tight mb-2"></h1>
            <p className="text-gray-400 text-center"></p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 animate-[slideInDown_0.3s_ease-out]">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {authOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  disabled={loading}
                  className={`w-full group bg-transparent border-2 ${option.borderColor} ${option.hoverBorderColor} rounded-[9px] p-3 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:bg-white/5 active:scale-[0.98]`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`flex-shrink-0 p-1.5 border ${option.borderColor} ${option.hoverBorderColor} rounded-md group-hover:rotate-12 transition-all duration-300`}>
                    <IconComponent className={`w-4 h-4 ${option.textColor} ${option.hoverTextColor} group-hover:scale-125 transition-transform duration-300`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-medium tracking-tight ${option.textColor} ${option.hoverTextColor}`}>{option.title}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              By continuing, you agree to our{' '}
              <button
                onClick={() => setShowLegal({ open: true, type: 'terms' })}
                className="text-primary-500 hover:text-primary-400 underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                onClick={() => setShowLegal({ open: true, type: 'privacy' })}
                className="text-primary-500 hover:text-primary-400 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>

          {/* Legal modal */}
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
      </div>
    </div>
  );
};

export default AuthLanding;