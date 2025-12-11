import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trophy,
  Calendar,
  Users,
  Edit,
  Trash2,
  Play,
  Eye,
  Layers,
  RefreshCw
} from 'lucide-react';
import { seasonsCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useSoftDelete } from '../../hooks/useSoftDelete';
import ConfirmationModal from '../../components/ConfirmationModal';
import AdminPageLayout from '../../components/AdminPageLayout';

const AdminSeasons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { softDeleteSeason } = useSoftDelete();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, season: null });

  const isAdmin = user?.isAdmin;
  const isSuperAdmin = user?.isSuperAdmin;

  useEffect(() => {
    if (isAdmin) {
      loadSeasons();
    } else {
      setLoading(false);
    }
  }, [isAdmin, isSuperAdmin, user?.uid]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const data = await seasonsCollection.getAll();
      const filtered = isSuperAdmin ? data : data.filter(season => season.ownerId === user?.uid);
      setSeasons(filtered);
    } catch (error) {
      console.error('Error loading seasons:', error);
      showToast('Failed to load seasons', 'error');
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

  const handleSetActive = async (seasonId) => {
    try {
      await seasonsCollection.setActive(seasonId);
      showToast('Season activated successfully!', 'success');
      loadSeasons();
    } catch (error) {
      console.error('Error activating season:', error);
      showToast('Failed to activate season', 'error');
    }
  };

  const handleDelete = (season) => {
    setConfirmDelete({ isOpen: true, season });
  };

  const confirmDeleteSeason = async () => {
    if (!confirmDelete.season) return;

    try {
      await softDeleteSeason(confirmDelete.season);
      showToast(`"${confirmDelete.season.name}" moved to recycle bin`, 'success');
      loadSeasons();
    } catch (error) {
      console.error('Error deleting season:', error);
      showToast('Failed to delete season', 'error');
    } finally {
      setConfirmDelete({ isOpen: false, season: null });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ongoing: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[status] || badges.upcoming;
  };

  const totalSeasons = seasons.length;
  const activeSeasons = useMemo(() => seasons.filter(season => season.isActive).length, [seasons]);
  const upcomingSeasons = useMemo(() => seasons.filter(season => season.status === 'upcoming').length, [seasons]);
  const totalGroups = useMemo(() => seasons.reduce((sum, season) => sum + (season.numberOfGroups || season.groups?.length || 0), 0), [seasons]);

  const renderContent = () => {
    if (loading) {
      return <div className="card p-4 text-sm text-white/70">Loading seasons...</div>;
    }

    if (seasons.length === 0) {
      return (
        <div className="card text-center py-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white/60" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No seasons yet</h3>
          <p className="text-xs text-white/60 mb-3">Create your first tournament season to get started.</p>
          <button
            onClick={() => navigate('/admin/seasons/create')}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-[11px] font-semibold uppercase tracking-[0.25em]"
          >
            Create Season
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {seasons.map((season) => (
          <div
            key={season.id}
            className={`card relative overflow-hidden p-2.5 sm:p-3 ${season.isActive ? 'border border-primary-500/60' : ''}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-purple/5 via-transparent to-blue-500/10" />
            <div className="relative space-y-2.5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Season {season.year || '—'}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-[13px] font-semibold text-white">{season.name}</h3>
                    {season.isActive && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.25em] text-primary-200 bg-primary-500/20 border border-primary-500/30">
                        Active
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.25em] ${getStatusBadge(season.status)}`}>
                      {season.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1">Owner: {season.ownerName || 'Unknown'}</p>
                </div>
                <div className="flex items-center gap-1 self-start">
                  {!season.isActive && (
                    <button
                      onClick={() => handleSetActive(season.id)}
                      className="p-1.5 sm:p-1.5 rounded-md border border-green-400/40 text-green-100 hover:bg-green-500/15"
                      title="Set active"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/seasons/${season.id}`)}
                    className="p-1.5 rounded-md border border-blue-400/40 text-blue-100 hover:bg-blue-500/15"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/seasons/${season.id}/edit`)}
                    className="p-1.5 rounded-md border border-accent-400/40 text-accent-100 hover:bg-accent-500/15"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(season)}
                    className="p-1.5 rounded-md border border-red-400/40 text-red-100 hover:bg-red-500/15"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-white/60">
                <div className="px-1.5 py-1 rounded-lg border border-white/10 bg-white/5">
                  <p className="uppercase tracking-[0.25em]">Groups</p>
                  <p className="text-[13px] text-white">{season.numberOfGroups || season.groups?.length || 0}</p>
                </div>
                <div className="px-1.5 py-1 rounded-lg border border-white/10 bg-white/5">
                  <p className="uppercase tracking-[0.25em]">Teams/Grp</p>
                  <p className="text-[13px] text-white">{season.teamsPerGroup || 0}</p>
                </div>
                <div className="px-1.5 py-1 rounded-lg border border-white/10 bg-white/5">
                  <p className="uppercase tracking-[0.25em]">KO Legs</p>
                  <p className="text-[13px] text-white">{season.knockoutConfig?.matchesPerRound || 2}</p>
                </div>
              </div>

              {season.groups?.length > 0 && (
                <div className="border-t border-white/5 pt-1.5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-1">Groups configured</p>
                  <div className="flex flex-wrap gap-1">
                    {season.groups.map((group) => (
                      <span
                        key={group.id}
                        className="px-1.5 py-0.5 text-[10px] rounded border border-white/10 bg-white/5 text-white/70"
                      >
                        {group.name} ({group.teams?.length || 0})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const layoutProps = {
    title: 'Season Management',
    subtitle: 'COMPETITION OPS',
    description: 'Control tournament seasons, knockout formats, and group allocations.',
    onBack: () => navigate('/admin'),
    actions: isAdmin
      ? [
          {
            label: 'New Season',
            icon: Plus,
            onClick: () => navigate('/admin/seasons/create'),
            variant: 'primary',
          },
          {
            label: 'Refresh',
            icon: RefreshCw,
            onClick: loadSeasons,
            disabled: loading,
          },
        ]
      : [],
    stats: isAdmin
      ? [
          { label: 'Total', value: totalSeasons, icon: Layers },
          { label: 'Active', value: activeSeasons, icon: Trophy },
          { label: 'Upcoming', value: upcomingSeasons, icon: Calendar },
          { label: 'Groups', value: totalGroups, icon: Users },
        ]
      : [],
  };

  return (
    <AdminPageLayout {...layoutProps}>
      {toast.show && (
        <div
          className={`mb-3 px-3 py-1.5 rounded-lg border ${
            toast.type === 'success' ? 'border-green-500/40 text-green-200' : 'border-red-500/40 text-red-200'
          } bg-white/5 text-sm`}
        >
          {toast.message}
        </div>
      )}
      {isAdmin ? (
        renderContent()
      ) : (
        <div className="card text-center py-8">
          <h2 className="text-sm font-semibold text-white mb-1.5">Access denied</h2>
          <p className="text-xs text-white/60 mb-3">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[11px] uppercase tracking-[0.25em]"
          >
            Go Home
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, season: null })}
        onConfirm={confirmDeleteSeason}
        title="Delete Season"
        message={`Are you sure you want to delete "${confirmDelete.season?.name || 'this season'}"? It will be moved to the recycle bin.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </AdminPageLayout>
  );
};

export default AdminSeasons;
