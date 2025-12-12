import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Camera, Edit, Save, X, User, Mail, Calendar, Shield, Activity, MessageSquare, BookOpen, Trophy } from 'lucide-react';
import BackButton from '../components/ui/BackButton';
import { validateEmail } from '../utils/helpers';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userCommentsCount, setUserCommentsCount] = useState(0);
  const [articlesReadCount, setArticlesReadCount] = useState(0);
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
      newErrors.name = t('pages.profile.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('pages.profile.nameMinLength');
    }

    if (!formData.email) {
      newErrors.email = t('pages.profile.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('pages.profile.validEmail');
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = t('pages.profile.bioMaxLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      setErrors({ general: t('pages.profile.updateFailed') });
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
    const newAvatar = `https://ui-avatars.com/api/?name=${formData.name}&background=6D28D9&color=fff&size=200`;
    setFormData(prev => ({
      ...prev,
      avatar: newAvatar
    }));
  };

  useEffect(() => {
    let mounted = true;
    const loadUserStats = async () => {
      setStatsLoading(true);
      try {
        const { commentsCollection } = await import('../firebase/firestore');
        let commentsCount = 0;
        try {
          commentsCount = await commentsCollection.getCountForUser?.(user.uid) || 0;
        } catch (e) {
          try {
            const allComments = await commentsCollection.getAll?.() || [];
            commentsCount = allComments.filter(c => c.userId === user.uid).length;
          } catch (e2) {
            commentsCount = 0;
          }
        }

        const articlesRead = user?.articlesRead || 0;

        if (!mounted) return;
        setUserCommentsCount(commentsCount);
        setArticlesReadCount(articlesRead);
      } catch (err) {
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };

    if (user && !user.isAnonymous) loadUserStats();
    else setStatsLoading(false);

    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="pb-8 md:pb-4">
      {/* Hero Header */}
      <div className="relative h-48 w-full overflow-hidden">
        {/* Background Pattern Only - No Color */}
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5 z-0" />
        
        {/* Navbar Area */}
        <div className="relative z-10 px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/10 transition-all hover:scale-105"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('common.edit')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/70 text-sm font-medium rounded-full border border-white/10 transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-brand-purple hover:bg-brand-purple-dark text-white text-sm font-medium rounded-full shadow-lg shadow-brand-purple/20 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? t('pages.profile.saving') : t('common.save')}
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-12 left-0 right-0 px-6 flex flex-col items-center z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-brand-purple to-purple-900 shadow-2xl shadow-brand-purple/30">
              <div className="w-full h-full rounded-full overflow-hidden bg-elevated border-4 border-app relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-elevated">
                    <User className="w-10 h-10 text-white/20" />
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarChange}>
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>
            {user?.isAdmin && (
              <div className="absolute bottom-1 right-1 bg-brand-purple text-white p-1 rounded-full border-2 border-app shadow-lg" title={t('common.admin')}>
                <Shield className="w-3 h-3" />
              </div>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">{user?.name || t('pages.profile.guestUser')}</h1>
            <p className="text-white/40 text-xs font-medium mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-0 pt-16 pb-20 w-full space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 px-4">
          <div className="bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-center hover:bg-elevated/70 transition-colors">
            <div className="w-8 h-8 mx-auto bg-brand-purple/10 rounded-full flex items-center justify-center mb-1.5 text-brand-purple">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-white">{userCommentsCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Comments</div>
          </div>
          <div className="bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-center hover:bg-elevated/70 transition-colors">
            <div className="w-8 h-8 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-1.5 text-blue-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-white">{articlesReadCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Read</div>
          </div>
          <div className="bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-center hover:bg-elevated/70 transition-colors">
            <div className="w-8 h-8 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-1.5 text-green-500">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-white">
              {new Date(user?.joinedDate || Date.now()).getFullYear()}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Member</div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-4 px-4">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-1 h-5 bg-brand-purple rounded-full" />
            <h2 className="text-base font-semibold text-white">Personal Information</h2>
          </div>

          {/* Name Field */}
          <div className="group">
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
              {t('pages.profile.fullName')}
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-black/20 border ${errors.name ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all text-sm`}
                  placeholder={t('pages.profile.enterFullName')}
                />
                <User className="absolute right-4 top-3 w-4 h-4 text-white/20" />
                {errors.name && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.name}</p>}
              </div>
            ) : (
              <div className="w-full bg-transparent border-b border-white/10 py-2.5 text-white/90 flex items-center justify-between transition-colors text-sm px-2">
                <span>{user?.name || t('pages.profile.notSet')}</span>
                <User className="w-4 h-4 text-white/20" />
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="group">
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
              {t('pages.profile.emailAddress')}
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-black/20 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all text-sm`}
                  placeholder={t('pages.profile.enterEmail')}
                />
                <Mail className="absolute right-4 top-3 w-4 h-4 text-white/20" />
                {errors.email && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.email}</p>}
              </div>
            ) : (
              <div className="w-full bg-transparent border-b border-white/10 py-2.5 text-white/90 flex items-center justify-between transition-colors text-sm px-2">
                <span>{user?.email || t('pages.profile.notSet')}</span>
                <Mail className="w-4 h-4 text-white/20" />
              </div>
            )}
          </div>

          {/* Bio Field */}
          <div className="group">
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
              {t('pages.profile.bio')}
            </label>
            {isEditing ? (
              <div className="relative">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full bg-black/20 border ${errors.bio ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all resize-none text-sm`}
                  placeholder={t('pages.profile.tellAboutYourself')}
                />
                <div className="flex justify-between items-center mt-1 px-1">
                  {errors.bio && <p className="text-red-400 text-[10px]">{errors.bio}</p>}
                  <p className="text-white/20 text-[10px] ml-auto">
                    {formData.bio.length}/500
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full bg-transparent border-b border-white/10 py-2.5 text-white/90 min-h-[60px] transition-colors text-sm px-2">
                {user?.bio ? (
                  <p className="leading-relaxed">{user.bio}</p>
                ) : (
                  <p className="text-white/30 italic">{t('pages.profile.noBio')}</p>
                )}
              </div>
            )}
          </div>

          {/* Favorite Team */}
          <div className="group">
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
              {t('pages.profile.favoriteTeam')}
            </label>
            {isEditing ? (
              <div className="relative">
                <select
                  name="favoriteTeam"
                  value={formData.favoriteTeam}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all appearance-none text-sm"
                >
                  <option value="" className="bg-dark-800">{t('pages.profile.selectTeam')}</option>
                  <option value="Arsenal" className="bg-dark-800">Arsenal</option>
                  <option value="Chelsea" className="bg-dark-800">Chelsea</option>
                  <option value="Liverpool" className="bg-dark-800">Liverpool</option>
                  <option value="Manchester City" className="bg-dark-800">Manchester City</option>
                  <option value="Manchester United" className="bg-dark-800">Manchester United</option>
                  <option value="Tottenham" className="bg-dark-800">Tottenham</option>
                </select>
                <Trophy className="absolute right-4 top-3.5 w-5 h-5 text-white/20 pointer-events-none" />
              </div>
            ) : (
              <div className="w-full bg-transparent border-b border-white/10 py-2.5 text-white/90 flex items-center justify-between transition-colors text-sm px-2">
                <span>{user?.favoriteTeam || t('pages.profile.noTeamSelected')}</span>
                <Trophy className="w-4 h-4 text-white/20" />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 space-y-3 pt-4">
          <h3 className="text-sm font-semibold text-white mb-2 px-2">{t('pages.profile.quickActions')}</h3>
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-left hover:bg-elevated/70 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">{t('navigation.settings')}</span>
              <ArrowLeft className="w-4 h-4 text-white/40 rotate-180 group-hover:text-white transition-colors" />
            </div>
          </button>
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-left hover:bg-elevated/70 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-brand-purple mr-2" />
                  <span className="text-white text-sm font-medium">{t('navigation.adminDashboard')}</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-white/40 rotate-180 group-hover:text-white transition-colors" />
              </div>
            </button>
          )}
        </div>

        {/* Footer Branding */}
        <div className="text-center pt-8 pb-4">
          <p className="text-[10px] text-white/20 font-medium tracking-[0.2em] uppercase">Fivescores Profile</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
