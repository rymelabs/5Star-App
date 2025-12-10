import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
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

const EditLeague = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast, showToast, hideToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    qualifiedPosition: 4,
    relegationPosition: 18,
    totalTeams: 20
  });

  const isAdmin = user?.isAdmin;

  useEffect(() => {
    if (isAdmin && id) {
      loadLeague();
    }
  }, [isAdmin, id]);

  const loadLeague = async () => {
    try {
      setLoading(true);
      const league = await leaguesCollection.getById(id);
      if (league) {
        setFormData({
          name: league.name,
          qualifiedPosition: league.qualifiedPosition,
          relegationPosition: league.relegationPosition,
          totalTeams: league.totalTeams,
          ownerId: league.ownerId || null,
          ownerName: league.ownerName || 'Unknown Admin'
        });
      } else {
        showToast(t('editLeague.notFound'), 'error');
        navigate('/admin/leagues');
      }
    } catch (error) {
      showToast(t('editLeague.failedLoad'), 'error');
      navigate('/admin/leagues');
    } finally {
      setLoading(false);
    }
  };

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
      showToast(t('editLeague.enterName'), 'warning');
      return;
    }

    if (formData.qualifiedPosition >= formData.relegationPosition) {
      showToast(t('editLeague.qualifiedLessThanRelegation'), 'warning');
      return;
    }

    if (formData.relegationPosition > formData.totalTeams) {
      showToast(t('editLeague.relegationExceedsTotal'), 'warning');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        ownerId: formData.ownerId || user?.uid || null,
        ownerName: formData.ownerName || user?.displayName || user?.name || user?.email || 'Unknown Admin'
      };

      await leaguesCollection.update(id, payload);
      navigate('/admin/leagues');
    } catch (error) {
      showToast(t('editLeague.updateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">{t('editLeague.accessDenied')}</h2>
          <p className="text-gray-400 mb-6">{t('editLeague.accessDeniedMessage')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('editLeague.goToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
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
          <h1 className="admin-header">{t('editLeague.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('editLeague.subtitle')}
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
              <h3 className="text-lg font-semibold text-white mb-2">{t('editLeague.leagueName')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('editLeague.leagueNameDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('editLeague.name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('editLeague.namePlaceholder')}
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
              <h3 className="text-lg font-semibold text-white mb-2">{t('editLeague.qualificationZone')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('editLeague.qualificationDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('editLeague.topPosition').replace('{max}', formData.totalTeams)}
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
                  {t('editLeague.topTeamsHighlight').replace('{position}', formData.qualifiedPosition)}
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
              <h3 className="text-lg font-semibold text-white mb-2">{t('editLeague.relegationZone')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('editLeague.relegationDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('editLeague.startingPosition').replace('{max}', formData.totalTeams)}
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
                  {t('editLeague.bottomTeamsHighlight').replace('{count}', formData.totalTeams - formData.relegationPosition + 1)}
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
              <h3 className="text-lg font-semibold text-white mb-2">{t('editLeague.totalTeams')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('editLeague.totalTeamsDescription')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('editLeague.numberOfTeams')}
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
          <h3 className="text-lg font-semibold text-white mb-4">{t('editLeague.preview')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('editLeague.qualified')}</span>
              </div>
              <span className="text-gray-400">{t('editLeague.positions')} 1 - {formData.qualifiedPosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('editLeague.safe')}</span>
              </div>
              <span className="text-gray-400">
                {t('editLeague.positions')} {formData.qualifiedPosition + 1} - {formData.relegationPosition - 1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                <span className="text-gray-300">{t('editLeague.relegated')}</span>
              </div>
              <span className="text-gray-400">
                {t('editLeague.positions')} {formData.relegationPosition} - {formData.totalTeams}
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
            {t('editLeague.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-3 flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t('editLeague.saving')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {t('editLeague.saveChanges')}
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

export default EditLeague;
