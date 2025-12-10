import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Save, Settings, Trophy, TrendingDown } from 'lucide-react';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import AdminPageLayout from '../../components/AdminPageLayout';

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
  const isAdmin = user?.isAdmin;

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
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('adminLeagueSettings.goToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title={t('adminLeagueSettings.title')}
      subtitle="CONFIGURATION"
      description={t('adminLeagueSettings.description')}
      onBack={() => navigate('/admin/leagues')}
      actions={[
        {
          label: saving ? t('common.saving') : t('common.save'),
          icon: Save,
          onClick: handleSubmit,
          primary: true,
          disabled: saving
        }
      ]}
    >
      {/* Toast */}
      {toast.show && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg border ${
            toast.type === 'success' ? 'border-green-500/40 text-green-200' : 'border-red-500/40 text-red-200'
          } bg-white/5 text-sm`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="card p-4 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-brand-purple/10 border border-brand-purple/20">
              <Settings className="w-4 h-4 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">League Configuration</h3>
              <p className="text-xs text-white/60">Configure global league rules and thresholds</p>
            </div>
          </div>

          <div className="grid gap-5">
            {/* Total Teams */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">
                {t('adminLeagueSettings.totalTeams')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="totalTeams"
                  value={formData.totalTeams}
                  onChange={handleChange}
                  min="2"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-colors"
                />
                <div className="absolute right-3 top-2 text-white/20 pointer-events-none">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-white/40">
                Total number of teams in the league table
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Qualified Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80">
                  {t('adminLeagueSettings.qualifiedPosition')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="qualifiedPosition"
                    value={formData.qualifiedPosition}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-colors"
                  />
                  <div className="absolute right-3 top-2 text-white/20 pointer-events-none">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-white/40">
                  Top positions that qualify for promotion/cups
                </p>
              </div>

              {/* Relegation Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80">
                  {t('adminLeagueSettings.relegationPosition')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="relegationPosition"
                    value={formData.relegationPosition}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-colors"
                  />
                  <div className="absolute right-3 top-2 text-white/20 pointer-events-none">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-white/40">
                  Position where relegation zone starts
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <h4 className="text-xs font-medium text-blue-200 mb-0.5">Note</h4>
              <p className="text-[10px] text-blue-200/60">
                Changes to these settings will affect how the league table is displayed and how team statuses are calculated across the platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminLeagueSettings;
