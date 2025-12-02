import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Camera, Save } from 'lucide-react';
import AuthBackground from '../components/AuthBackground';

const ProfileSetup = () => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    favoriteTeam: '',
    avatar: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: basic info, 2: preferences
  
  const { updateProfile, user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      
      await updateProfile({
        displayName: formData.name.trim(),
        bio: formData.bio.trim(),
        favoriteTeam: formData.favoriteTeam.trim()
      });
      
      // For non-anonymous users, this marks profile as completed
      // For anonymous users, they can set up profile each time
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-50 animate-[fadeInUp_0.6s_ease-out]">
        <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-primary-600/30 hover:shadow-primary-500/20 transition-shadow duration-300">
          <div className="text-center mb-8">
            <img src="/Fivescores logo.svg" alt="Fivescores" className="w-16 h-16 mx-auto mb-4 animate-[bounce_1s_ease-in-out]" />
            <h1 className="text-lg font-bold text-white tracking-tight mb-2 animate-[fadeInUp_0.7s_ease-out]">
              {step === 1 ? 'Welcome!' : 'Almost Done'}
            </h1>
            <p className="text-gray-400 animate-[fadeIn_0.9s_ease-out]">
              {step === 1 
                ? "Let's set up your profile" 
                : 'Tell us about your preferences'
              }
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center mb-8 animate-[fadeInUp_0.8s_ease-out]">
            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 to-orange-600 transition-all duration-500 ease-out"
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>
            <span className="ml-3 text-sm text-gray-400">{step}/2</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 animate-[slideInDown_0.3s_ease-out]">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="text-center animate-[fadeInUp_0.8s_ease-out]">
                <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-dark-600 transition-all duration-300 hover:scale-110 cursor-pointer group">
                  <User className="w-10 h-10 text-gray-400 group-hover:text-primary-400 transition-colors duration-300" />
                </div>
                <button
                  type="button"
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center mx-auto transition-all duration-300 hover:scale-105"
                >
                  <Camera className="w-4 h-4 mr-1 animate-pulse" />
                  Add Photo (Optional)
                </button>
              </div>

              <div className="animate-[fadeInUp_0.9s_ease-out]">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/5 focus:scale-[1.01]"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>

              <div className="animate-[fadeInUp_1s_ease-out]">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-primary-500 focus:shadow-lg focus:shadow-primary-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/5 focus:scale-[1.01] resize-none"
                  placeholder="Tell us about yourself (optional)"
                />
              </div>

              <button
                onClick={handleNext}
                className="btn-primary w-full hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-lg hover:shadow-xl animate-[fadeInUp_1.1s_ease-out]"
              >
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="favoriteTeam"
                  value={formData.favoriteTeam}
                  onChange={handleChange}
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
                  placeholder="Your favorite team (optional)"
                />
              </div>

              <div className="space-y-4 animate-[fadeInUp_0.9s_ease-out]">
                <p className="text-gray-300 text-sm">What interests you most?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Latest News', 'Match Fixtures', 'Team Stats', 'Player Updates'].map((interest, index) => (
                    <button
                      key={interest}
                      type="button"
                      className="p-3 border border-gray-600 hover:border-primary-500 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/5 active:scale-95 animate-[fadeInUp_0.8s_ease-out]"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 animate-[fadeInUp_1s_ease-out]">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-white/5"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-lg hover:shadow-xl disabled:hover:scale-100 group"
                >
                  <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  {loading ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <div className="mt-6 text-center animate-[fadeIn_1.2s_ease-out]">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-400 text-sm transition-all duration-300 hover:scale-105 inline-block"
              >
                Skip setup for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;