import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AdminLeagues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
      showToast('Failed to load leagues', 'error');
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

  const handleDelete = async (leagueId, leagueName) => {
    if (!confirm(`Are you sure you want to delete "${leagueName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await leaguesCollection.delete(leagueId);
      showToast('League deleted successfully!', 'success');
      loadLeagues();
    } catch (error) {
      console.error('Error deleting league:', error);
      showToast('Failed to delete league', 'error');
    }
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
            <h1 className="admin-header">Leagues Management</h1>
            <p className="text-sm text-gray-400 mt-1">
              Create and manage multiple leagues
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/leagues/create')}
          className="btn-primary w-full flex items-center justify-center text-sm py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create League
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
          <h2 className="text-xl font-semibold text-white mb-2">No Leagues Yet</h2>
          <p className="text-gray-400 mb-6">
            Create your first league to get started
          </p>
          <button
            onClick={() => navigate('/admin/leagues/create')}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create League
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
                    {league.totalTeams} Teams
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-primary-400 mr-2" />
                  <span className="text-gray-300">
                    Top {league.qualifiedPosition} Qualify
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingDown className="w-4 h-4 text-red-400 mr-2" />
                  <span className="text-gray-300">
                    Position {league.relegationPosition}+ Relegated
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-dark-600">
                <button
                  onClick={() => navigate(`/admin/leagues/edit/${league.id}`)}
                  className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  title="Edit League"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(league.id, league.name)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete League"
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
    </div>
  );
};

export default AdminLeagues;
