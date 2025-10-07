import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Save, Settings, Trophy, TrendingDown } from 'lucide-react';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';

const AdminLeagueSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { leagueSettings, updateLeagueSettings } = useFootball();
  const [formData, setFormData] = useState({
    qualifiedPosition: 4,
    relegationPosition: 18,
    totalTeams: 20
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (leagueSettings) {
      setFormData(leagueSettings);
    }
  }, [leagueSettings]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      showToast(t('adminLeagueSettings.adminOnly'), 'error');
      return;
    }

    // Convert to numbers and validate
    const qualifiedPos = parseInt(formData.qualifiedPosition, 10);
    const relegationPos = parseInt(formData.relegationPosition, 10);
    const totalTeams = parseInt(formData.totalTeams, 10);

    // Check for valid numbers
    if (isNaN(qualifiedPos) || isNaN(relegationPos) || isNaN(totalTeams)) {
      showToast(t('adminLeagueSettings.fillValidNumbers'), 'error');
      return;
    }

    // Validation
    if (qualifiedPos >= relegationPos) {
      showToast(t('adminLeagueSettings.qualifiedLessThanRelegation'), 'error');
      return;
    }

    if (qualifiedPos < 1 || relegationPos > totalTeams) {
      showToast(t('adminLeagueSettings.invalidPositions'), 'error');
      return;
    }

    if (totalTeams < 2) {
      showToast(t('adminLeagueSettings.minTeams'), 'error');
      return;
    }

    try {
      setSaving(true);
      // Ensure we're saving proper numbers
      await updateLeagueSettings({
        qualifiedPosition: qualifiedPos,
        relegationPosition: relegationPos,
        totalTeams: totalTeams
      });
      showToast(t('adminLeagueSettings.updateSuccess'), 'success');
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast(t('adminLeagueSettings.updateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseInt(value, 10);
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">{t('adminLeagueSettings.accessDenied')}</h2>
          <p className="text-gray-400 mb-6">{t('adminLeagueSettings.accessDeniedMessage')}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            {t('adminLeagueSettings.goToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="admin-header">{t('adminLeagueSettings.title')}</h1>
            <p className="text-sm text-gray-400">{t('adminLeagueSettings.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Qualified Position */}
        <div className="card p-6">
          <div className="flex items-start mb-4">
            <Trophy className="w-6 h-6 text-primary-500 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{t('adminLeagueSettings.qualifiedPosition')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('adminLeagueSettings.qualifiedDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminLeagueSettings.topPosition').replace('{max}', formData.totalTeams)}
                </label>
                <input
                  type="number"
                  name="qualifiedPosition"
                  value={formData.qualifiedPosition}
                  onChange={handleChange}
                  min="1"
                  max={formData.totalTeams}
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t('adminLeagueSettings.topTeamsHighlight').replace('{position}', formData.qualifiedPosition)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Relegation Position */}
        <div className="card p-6">
          <div className="flex items-start mb-4">
            <TrendingDown className="w-6 h-6 text-red-500 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{t('adminLeagueSettings.relegationPosition')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('adminLeagueSettings.relegationDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminLeagueSettings.startingPosition').replace('{max}', formData.totalTeams)}
                </label>
                <input
                  type="number"
                  name="relegationPosition"
                  value={formData.relegationPosition}
                  onChange={handleChange}
                  min="1"
                  max={formData.totalTeams}
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t('adminLeagueSettings.bottomTeamsHighlight').replace('{count}', formData.totalTeams - formData.relegationPosition + 1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Teams */}
        <div className="card p-6">
          <div className="flex items-start mb-4">
            <Settings className="w-6 h-6 text-accent-500 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{t('adminLeagueSettings.totalTeams')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('adminLeagueSettings.totalTeamsDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminLeagueSettings.numberOfTeams')}
                </label>
                <input
                  type="number"
                  name="totalTeams"
                  value={formData.totalTeams}
                  onChange={handleChange}
                  min="2"
                  max="30"
                  className="input-field w-full"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6 bg-dark-800/50">
          <h3 className="text-lg font-semibold text-white mb-4">{t('adminLeagueSettings.preview')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('adminLeagueSettings.qualified')}</span>
              </div>
              <span className="text-gray-400">{t('adminLeagueSettings.positions')} 1 - {formData.qualifiedPosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('adminLeagueSettings.safe')}</span>
              </div>
              <span className="text-gray-400">
                {t('adminLeagueSettings.positions')} {formData.qualifiedPosition + 1} - {formData.relegationPosition - 1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('adminLeagueSettings.eliminated')}</span>
              </div>
              <span className="text-gray-400">
                {t('adminLeagueSettings.positions')} {formData.relegationPosition} - {formData.totalTeams}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full btn-primary py-3 flex items-center justify-center"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {t('adminLeagueSettings.saving')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {t('adminLeagueSettings.saveSettings')}
            </>
          )}
        </button>
      </form>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-[slideInUp_0.3s_ease-out]">
          <div className={`rounded-lg px-6 py-3 shadow-lg ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeagueSettings;
