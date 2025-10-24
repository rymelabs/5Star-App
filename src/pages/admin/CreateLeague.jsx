import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save,
  Trophy,
  TrendingUp,
  TrendingDown,
  Users
} from 'lucide-react';
import { leaguesCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

const CreateLeague = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    qualifiedPosition: 4,
    relegationPosition: 18,
    totalTeams: 20
  });

  const isAdmin = user?.isAdmin;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast(t('createLeague.enterName'), 'warning');
      return;
    }

    if (formData.qualifiedPosition >= formData.relegationPosition) {
      showToast(t('createLeague.qualifiedLessThanRelegation'), 'warning');
      return;
    }

    if (formData.relegationPosition > formData.totalTeams) {
      showToast(t('createLeague.relegationExceedsTotal'), 'warning');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        ownerId: user?.uid || null,
        ownerName: user?.displayName || user?.name || user?.email || 'Unknown Admin'
      };

      await leaguesCollection.add(payload);
      navigate('/admin/leagues');
    } catch (error) {
      console.error('Error creating league:', error);
  alert(t('createLeague.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">{t('createLeague.accessDenied')}</h2>
          <p className="text-gray-400 mb-6">{t('createLeague.accessDeniedMessage')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('createLeague.goToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/admin/leagues')}
          className="mr-4 p-2 hover:bg-dark-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="admin-header">{t('createLeague.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('createLeague.subtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* League Name */}
        <div className="card p-6">
          <div className="flex items-start mb-4">
            <Trophy className="w-6 h-6 text-primary-500 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{t('createLeague.leagueName')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('createLeague.leagueNameDescription')}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createLeague.name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('createLeague.namePlaceholder')}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Qualified Position */}
        <div className="card p-6">
          <div className="flex items-start mb-4">
            <TrendingUp className="w-6 h-6 text-primary-500 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{t('createLeague.qualificationZone')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('createLeague.qualificationDescription')}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createLeague.topPosition').replace('{max}', formData.totalTeams)}
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
                  {t('createLeague.topTeamsHighlight').replace('{position}', formData.qualifiedPosition)}
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
              <h3 className="text-lg font-semibold text-white mb-2">{t('createLeague.relegationZone')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('createLeague.relegationDescription')}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createLeague.startingPosition').replace('{max}', formData.totalTeams)}
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
                  {t('createLeague.bottomTeamsHighlight').replace('{count}', formData.totalTeams - formData.relegationPosition + 1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Teams */}
        <div className="card p-6">
          <div className="flex items-start mb-4">
            <Users className="w-6 h-6 text-accent-500 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{t('createLeague.totalTeams')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('createLeague.totalTeamsDescription')}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createLeague.numberOfTeams')}
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
          <h3 className="text-lg font-semibold text-white mb-4">{t('createLeague.preview')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('createLeague.qualified')}</span>
              </div>
              <span className="text-gray-400">{t('createLeague.positions')} 1 - {formData.qualifiedPosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('createLeague.safe')}</span>
              </div>
              <span className="text-gray-400">
                {t('createLeague.positions')} {formData.qualifiedPosition + 1} - {formData.relegationPosition - 1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('createLeague.relegated')}</span>
              </div>
              <span className="text-gray-400">
                {t('createLeague.positions')} {formData.relegationPosition} - {formData.totalTeams}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/leagues')}
            className="flex-1 btn-secondary py-3"
          >
            {t('createLeague.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-3 flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t('createLeague.creating')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {t('createLeague.createLeague')}
              </>
            )}
          </button>
        </div>
      </form>

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default CreateLeague;
