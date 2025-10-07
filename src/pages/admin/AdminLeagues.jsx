import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft, 
  Plus, 
  Trophy, 
  TrendingUp,
  TrendingDown,
  Users,
  Edit,
  Trash2
} from 'lucide-react';
import { leaguesCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminLeagues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, leagueId: null, leagueName: '' });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadLeagues();
    }
  }, [isAdmin]);

  const loadLeagues = async () => {
    try {
      setLoading(true);
      const data = await leaguesCollection.getAll();
      setLeagues(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading leagues:', error);
      showToast(t('adminLeagues.failedLoad'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleDelete = (leagueId, leagueName) => {
    setConfirmDelete({ isOpen: true, leagueId, leagueName });
  };

  const confirmDeleteLeague = async () => {
    const { leagueId } = confirmDelete;
    setConfirmDelete({ isOpen: false, leagueId: null, leagueName: '' });

    try {
      await leaguesCollection.delete(leagueId);
      showToast(t('adminLeagues.deleteSuccess'), 'success');
      loadLeagues();
    } catch (error) {
      console.error('Error deleting league:', error);
      showToast(t('adminLeagues.deleteFailed'), 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">{t('adminLeagues.accessDenied')}</h2>
          <p className="text-gray-400 mb-6">{t('adminLeagues.accessDeniedMessage')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('adminLeagues.goToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/admin')}
            className="mr-4 p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="admin-header">{t('adminLeagues.title')}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {t('adminLeagues.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/leagues/create')}
          className="btn-primary w-full flex items-center justify-center text-sm py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('adminLeagues.createLeague')}
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leagues.length === 0 ? (
        /* Empty State */
        <div className="card p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">{t('adminLeagues.noLeagues')}</h2>
          <p className="text-gray-400 mb-6">
            {t('adminLeagues.noLeaguesMessage')}
          </p>
          <button
            onClick={() => navigate('/admin/leagues/create')}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('adminLeagues.createLeague')}
          </button>
        </div>
      ) : (
        /* Leagues Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <div key={league.id} className="card p-6 hover:shadow-xl transition-shadow">
              {/* League Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Trophy className="w-6 h-6 text-primary-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">
                    {league.name}
                  </h3>
                </div>
              </div>

              {/* League Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-300">
                    {league.totalTeams} {t('adminLeagues.teams')}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-primary-400 mr-2" />
                  <span className="text-gray-300">
                    {t('adminLeagues.topQualify').replace('{position}', league.qualifiedPosition)}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingDown className="w-4 h-4 text-red-400 mr-2" />
                  <span className="text-gray-300">
                    {t('adminLeagues.relegated').replace('{position}', league.relegationPosition)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-dark-600">
                <button
                  onClick={() => navigate(`/admin/leagues/edit/${league.id}`)}
                  className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  title={t('adminLeagues.editLeague')}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(league.id, league.name)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title={t('adminLeagues.deleteLeague')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, leagueId: null, leagueName: '' })}
        onConfirm={confirmDeleteLeague}
        title={t('adminLeagues.deleteLeague')}
        message={t('adminLeagues.confirmDelete').replace('{name}', confirmDelete.leagueName)}
        confirmText={t('adminLeagues.deleteLeague')}
        type="danger"
      />
    </div>
  );
};

export default AdminLeagues;
