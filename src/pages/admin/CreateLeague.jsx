import React, { useState } from 'react';
import { useNa      navigate('/admin/leagues');
    } catch (error) {
      console.error('Error creating league:', error);
      showToast('Failed to create league. Please try again.', 'error');
    } finally {e } from 'react-router-dom';
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
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    qualifiedPosition: 4,
    relegationPosition: 18,
    totalTeams: 20
  });

  const isAdmin = user?.role === 'admin';

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
      showToast('Please enter a league name', 'warning');
      return;
    }

    if (formData.qualifiedPosition >= formData.relegationPosition) {
      showToast('Qualified position must be less than relegation position', 'warning');
      return;
    }

    if (formData.relegationPosition > formData.totalTeams) {
      showToast('Relegation position cannot exceed total teams', 'warning');
      return;
    }

    try {
      setSaving(true);
      await leaguesCollection.add(formData);
      navigate('/admin/leagues');
    } catch (error) {
      console.error('Error creating league:', error);
      alert('Failed to create league. Please try again.');
    } finally {
      setSaving(false);
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
          <h1 className="admin-header">Create New League</h1>
          <p className="text-sm text-gray-400 mt-1">
            Set up a new league with custom settings
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
              <h3 className="text-lg font-semibold text-white mb-2">League Name</h3>
              <p className="text-sm text-gray-400 mb-4">
                Enter the name of the league (e.g., Premier League, Championship)
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Premier League"
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
              <h3 className="text-lg font-semibold text-white mb-2">Qualification Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Teams finishing in this position or higher qualify for next competition
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Top Position (1-{formData.totalTeams})
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
                  Top {formData.qualifiedPosition} teams will be highlighted in blue
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
              <h3 className="text-lg font-semibold text-white mb-2">Relegation Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Teams finishing in or below this position are relegated
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Starting Position (1-{formData.totalTeams})
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
                  Bottom {formData.totalTeams - formData.relegationPosition + 1} teams will be highlighted in red
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
              <h3 className="text-lg font-semibold text-white mb-2">Total Teams</h3>
              <p className="text-sm text-gray-400 mb-4">
                How many teams will compete in this league
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Teams
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
          <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded mr-2"></div>
                <span className="text-gray-300">Qualified</span>
              </div>
              <span className="text-gray-400">Positions 1 - {formData.qualifiedPosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded mr-2"></div>
                <span className="text-gray-300">Safe</span>
              </div>
              <span className="text-gray-400">
                Positions {formData.qualifiedPosition + 1} - {formData.relegationPosition - 1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                <span className="text-gray-300">Relegated</span>
              </div>
              <span className="text-gray-400">
                Positions {formData.relegationPosition} - {formData.totalTeams}
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-3 flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Create League
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
