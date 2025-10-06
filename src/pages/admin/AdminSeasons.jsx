import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trophy, 
  Calendar,
  Users,
  Settings,
  Edit,
  Trash2,
  Play,
  Eye
} from 'lucide-react';
import { seasonsCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const AdminSeasons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadSeasons();
    }
  }, [isAdmin]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const data = await seasonsCollection.getAll();
      setSeasons(data);
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

  const handleDelete = async (seasonId) => {
    if (!confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
      return;
    }

    try {
      await seasonsCollection.delete(seasonId);
      showToast('Season deleted successfully!', 'success');
      loadSeasons();
    } catch (error) {
      console.error('Error deleting season:', error);
      showToast('Failed to delete season', 'error');
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

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">You need admin privileges to access this page.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="page-header">Season Management</h1>
            <p className="text-sm text-gray-400">Manage tournament seasons and competitions</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/seasons/create')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Season</span>
        </button>
      </div>

      {/* Seasons List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : seasons.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No Seasons Yet</h3>
          <p className="text-gray-400 mb-6">Create your first tournament season to get started</p>
          <button
            onClick={() => navigate('/admin/seasons/create')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Season</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => (
            <div
              key={season.id}
              className={`card p-4 sm:p-6 ${season.isActive ? 'border-2 border-primary-500' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{season.name}</h3>
                    {season.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded whitespace-nowrap">
                        Active
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium border rounded whitespace-nowrap ${getStatusBadge(season.status)}`}>
                      {season.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Season {season.year}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!season.isActive && (
                    <button
                      onClick={() => handleSetActive(season.id)}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Set as active season"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/seasons/${season.id}`)}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/seasons/${season.id}/edit`)}
                    className="p-2 text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors"
                    title="Edit season"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(season.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete season"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Season Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">Groups</p>
                    <p className="text-sm font-semibold text-white">{season.numberOfGroups || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="p-2 bg-accent-500/10 rounded-lg flex-shrink-0">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-accent-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">Teams/Grp</p>
                    <p className="text-sm font-semibold text-white">{season.teamsPerGroup || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="p-2 bg-primary-500/10 rounded-lg flex-shrink-0">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">KO Legs</p>
                    <p className="text-sm font-semibold text-white">
                      {season.knockoutConfig?.matchesPerRound || 2}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              {season.groups && season.groups.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Groups configured:</p>
                  <div className="flex flex-wrap gap-2">
                    {season.groups.map((group) => (
                      <span
                        key={group.id}
                        className="px-2 py-1 text-xs bg-dark-800 text-gray-300 rounded border border-gray-700"
                      >
                        {group.name} ({group.teams?.length || 0} teams)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSeasons;
