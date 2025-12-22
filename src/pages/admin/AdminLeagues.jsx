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
  Trash2,
  Settings
} from 'lucide-react';
import { leaguesCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useSoftDelete } from '../../hooks/useSoftDelete';
import ConfirmationModal from '../../components/ConfirmationModal';
import AdminPageLayout from '../../components/AdminPageLayout';

const AdminLeagues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { softDeleteLeague } = useSoftDelete();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, league: null });

  const isAdmin = user?.isAdmin;
  const isSuperAdmin = user?.isSuperAdmin;

  useEffect(() => {
    if (isAdmin) {
      loadLeagues();
    }
  }, [isAdmin, isSuperAdmin, user?.uid]);

  const loadLeagues = async () => {
    try {
      setLoading(true);
      const data = await leaguesCollection.getAll();
      const filtered = isSuperAdmin
        ? data
        : data.filter(league => league.ownerId === user?.uid);
      setLeagues(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
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

  const handleDelete = (league) => {
    setConfirmDelete({ isOpen: true, league });
  };

  const confirmDeleteLeague = async () => {
    const { league } = confirmDelete;
    setConfirmDelete({ isOpen: false, league: null });

    try {
      await softDeleteLeague(league);
      showToast(`"${league.name}" moved to recycle bin`, 'success');
      loadLeagues();
    } catch (error) {
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
    <AdminPageLayout
      title={t('adminLeagues.title')}
      subtitle="MANAGEMENT"
      description={t('adminLeagues.description')}
      onBack={() => navigate('/admin')}
      actions={[
        {
          label: t('adminLeagues.createLeague'),
          icon: Plus,
          onClick: () => navigate('/admin/leagues/create'),
          primary: true
        }
      ]}
      stats={[
        { label: 'Total Leagues', value: leagues.length, icon: Trophy },
        { label: 'Active', value: leagues.filter(l => l.isActive).length, icon: TrendingUp },
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leagues.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white/60" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">{t('adminLeagues.noLeagues')}</h3>
          <p className="text-sm text-white/60 mb-6">{t('adminLeagues.createFirst')}</p>
          <button
            onClick={() => navigate('/admin/leagues/create')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-xs font-semibold uppercase tracking-[0.3em]"
          >
            {t('adminLeagues.createLeague')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="card relative overflow-hidden p-3 group hover:border-brand-purple/30 transition-colors"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-purple/5 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {league.logo ? (
                      <img src={league.logo} alt={league.name} className="w-9 h-9 rounded-lg object-cover bg-white/5" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        <Trophy className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-[13px] font-semibold text-white">{league.name}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{league.season || 'Current Season'}</p>
                    </div>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border ${
                    league.isActive 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {league.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Teams</p>
                    <p className="text-xs font-medium text-white">{league.teamsCount || 0}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Matches</p>
                    <p className="text-xs font-medium text-white">{league.matchesCount || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(`/admin/leagues/${league.id}`)}
                    className="flex-1 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-medium text-white transition-colors"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => navigate(`/admin/leagues/${league.id}/edit`)}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/leagues/${league.id}/settings`)}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(league)}
                    className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, league: null })}
        onConfirm={confirmDeleteLeague}
        title={t('adminLeagues.deleteTitle')}
        message={t('adminLeagues.deleteMessage', { name: confirmDelete.league?.name })}
        confirmText={t('adminLeagues.deleteConfirm')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </AdminPageLayout>
  );
};

export default AdminLeagues;
