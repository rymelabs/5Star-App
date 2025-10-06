import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Camera, Edit, Save, X, User, Mail, Calendar, Shield } from 'lucide-react';
import { validateEmail } from '../utils/helpers';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    favoriteTeam: user?.favoriteTeam || '',
    joinedDate: user?.joinedDate || new Date().toISOString(),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      setErrors({ general: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      favoriteTeam: user?.favoriteTeam || '',
      joinedDate: user?.joinedDate || new Date().toISOString(),
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleAvatarChange = () => {
    // In a real app, this would open a file picker
    const newAvatar = `https://ui-avatars.com/api/?name=${formData.name}&background=22c55e&color=fff&size=200`;
    setFormData(prev => ({
      ...prev,
      avatar: newAvatar
    }));
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 mt-1 bg-black z-10 px-4 py-2.5 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <h1 className="ml-2 page-header">{t('pages.profile.title')}</h1>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-2.5 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-6">
        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-600/10 border border-red-600/20 rounded-md p-2.5 mb-4">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Avatar Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center mx-auto mb-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            {isEditing && (
              <button
                onClick={handleAvatarChange}
                className="absolute bottom-4 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          
          {user?.role === 'admin' && (
            <div className="inline-flex items-center px-3 py-1 bg-accent-600 text-white rounded-full text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
                  placeholder={t('pages.profile.enterFullName')}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
            ) : (
              <div className="card p-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-white">{user?.name || 'Not set'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            {isEditing ? (
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field w-full ${errors.email ? 'border-red-500' : ''}`}
                  placeholder={t('pages.profile.enterEmail')}
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
            ) : (
              <div className="card p-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-white">{user?.email || 'Not set'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            {isEditing ? (
              <div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className={`input-field w-full resize-none ${errors.bio ? 'border-red-500' : ''}`}
                  placeholder={t('pages.profile.tellAboutYourself')}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && <p className="text-red-400 text-sm">{errors.bio}</p>}
                  <p className="text-gray-500 text-sm ml-auto">
                    {formData.bio.length}/500
                  </p>
                </div>
              </div>
            ) : (
              <div className="card p-3">
                <p className="text-white">
                  {user?.bio || 'No bio added yet'}
                </p>
              </div>
            )}
          </div>

          {/* Favorite Team */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Favorite Team
            </label>
            {isEditing ? (
              <select
                name="favoriteTeam"
                value={formData.favoriteTeam}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="">Select a team</option>
                <option value="Arsenal">Arsenal</option>
                <option value="Chelsea">Chelsea</option>
                <option value="Liverpool">Liverpool</option>
                <option value="Manchester City">Manchester City</option>
                <option value="Manchester United">Manchester United</option>
                <option value="Tottenham">Tottenham</option>
              </select>
            ) : (
              <div className="card p-3">
                <span className="text-white">
                  {user?.favoriteTeam || 'No team selected'}
                </span>
              </div>
            )}
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Member Since
            </label>
            <div className="card p-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-white">
                  {new Date(user?.joinedDate || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.profile.activity')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-primary-500 mb-1">
                {Math.floor(Math.random() * 50) + 10}
              </div>
              <div className="text-sm text-gray-400">{t('pages.profile.comments')}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-accent-500 mb-1">
                {Math.floor(Math.random() * 20) + 5}
              </div>
              <div className="text-sm text-gray-400">{t('pages.profile.articlesRead')}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.profile.quickActions')}</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/settings')}
              className="w-full card p-4 text-left hover:bg-dark-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-white">{t('navigation.settings')}</span>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </div>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full card p-4 text-left hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-accent-500 mr-3" />
                    <span className="text-white">{t('navigation.adminDashboard')}</span>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;