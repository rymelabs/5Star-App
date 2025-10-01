import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Camera, Save } from 'lucide-react';

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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-900 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <img src="/5StarLogo.svg" alt="5Star Logo" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              {step === 1 ? 'Welcome!' : 'Almost Done'}
            </h1>
            <p className="text-gray-400">
              {step === 1 
                ? "Let's set up your profile" 
                : 'Tell us about your preferences'
              }
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center mb-8">
            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 to-orange-600 transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>
            <span className="ml-3 text-sm text-gray-400">{step}/2</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <button
                  type="button"
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center mx-auto"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Add Photo (Optional)
                </button>
              </div>

              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>

              <div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200 resize-none"
                  placeholder="Tell us about yourself (optional)"
                />
              </div>

              <button
                onClick={handleNext}
                className="btn-primary w-full"
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

              <div className="space-y-4">
                <p className="text-gray-300 text-sm">What interests you most?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Latest News', 'Match Fixtures', 'Team Stats', 'Player Updates'].map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      className="p-3 border border-gray-600 hover:border-primary-500 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-400 text-sm"
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