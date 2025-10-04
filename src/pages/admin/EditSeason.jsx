import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Trophy,
  Users,
  Calendar,
  Plus,
  X,
  ChevronRight,
  Loader
} from 'lucide-react';
import { seasonsCollection, teamsCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const EditSeason = () => {
  const navigate = useNavigate();
  const { seasonId } = useParams();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    name: '',
    year: currentYear,
    numberOfGroups: 4,
    teamsPerGroup: 4,
    matchesPerRound: 2,
    qualifiersPerGroup: 2
  });

  const [groups, setGroups] = useState([]);
  const [originalSeason, setOriginalSeason] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadSeasonAndTeams();
  }, [seasonId]);

  const loadSeasonAndTeams = async () => {
    try {
      setLoading(true);
      const [season, teams] = await Promise.all([
        seasonsCollection.getById(seasonId),
        teamsCollection.getAll()
      ]);

      if (!season) {
        showToast('Season not found', 'error');
        navigate('/admin/seasons');
        return;
      }

      setOriginalSeason(season);
      setAllTeams(teams);
      
      // Populate form data
      setFormData({
        name: season.name || '',
        year: season.year || currentYear,
        numberOfGroups: season.numberOfGroups || 4,
        teamsPerGroup: season.teamsPerGroup || 4,
        matchesPerRound: season.knockoutConfig?.matchesPerRound || 2,
        qualifiersPerGroup: season.knockoutConfig?.qualifiersPerGroup || 2
      });

      // Populate groups
      if (season.groups && season.groups.length > 0) {
        setGroups(season.groups);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading season:', error);
      showToast('Failed to load season', 'error');
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = ['numberOfGroups', 'teamsPerGroup', 'year', 'matchesPerRound', 'qualifiersPerGroup'].includes(name)
      ? (value === '' ? '' : parseInt(value, 10))
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const updateGroupName = (groupId, name) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, name: name || `Group ${groups.indexOf(g) + 1}` } : g
    ));
  };

  const addTeamToGroup = (groupId, team) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        if (g.teams.length >= formData.teamsPerGroup) {
          showToast(`Group ${g.name} is full`, 'error');
          return g;
        }
        if (g.teams.find(t => t.id === team.id)) {
          showToast('Team already in this group', 'error');
          return g;
        }
        return { ...g, teams: [...g.teams, team] };
      }
      return g;
    }));
  };

  const removeTeamFromGroup = (groupId, teamId) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, teams: g.teams.filter(t => t.id !== teamId) }
        : g
    ));
  };

  const isTeamAssigned = (teamId) => {
    return groups.some(g => g.teams.find(t => t.id === teamId));
  };

  const getAvailableTeams = () => {
    return allTeams.filter(t => !isTeamAssigned(t.id));
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.name.trim()) {
      showToast('Please enter a season name', 'error');
      return;
    }

    // Check if all groups are properly configured
    const emptyGroups = groups.filter(g => g.teams.length === 0);
    if (emptyGroups.length > 0) {
      showToast('All groups must have at least one team', 'error');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        name: formData.name,
        year: formData.year,
        numberOfGroups: formData.numberOfGroups,
        teamsPerGroup: formData.teamsPerGroup,
        groups: groups,
        knockoutConfig: {
          matchesPerRound: formData.matchesPerRound,
          qualifiersPerGroup: formData.qualifiersPerGroup
        },
        updatedAt: new Date()
      };

      await seasonsCollection.update(seasonId, updateData);
      
      showToast('Season updated successfully!', 'success');
      setTimeout(() => {
        navigate(`/admin/seasons/${seasonId}`);
      }, 1000);
    } catch (error) {
      console.error('Error updating season:', error);
      showToast('Failed to update season. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center text-red-400">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-gray-400">Loading season...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg sm:text-lg font-bold text-white">Edit Season</h1>
            <p className="text-sm text-gray-400 mt-1">Update season configuration</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          <div className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary-500' : 'bg-dark-700'}`} />
          </div>
          <div className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary-500' : 'bg-dark-700'}`} />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400'
          }`}>
            3
          </div>
        </div>
        <div className="flex justify-between max-w-2xl mt-2 text-xs sm:text-sm">
          <span className={step >= 1 ? 'text-white' : 'text-gray-400'}>Basic Info</span>
          <span className={step >= 2 ? 'text-white' : 'text-gray-400'}>Configure Groups</span>
          <span className={step >= 3 ? 'text-white' : 'text-gray-400'}>Review</span>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-primary-500" />
              Season Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Season Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="e.g., Spring Championship 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Groups
                  </label>
                  <input
                    type="number"
                    name="numberOfGroups"
                    value={formData.numberOfGroups}
                    onChange={handleChange}
                    min="1"
                    max="8"
                    disabled={groups.length > 0}
                    className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {groups.length > 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      Cannot change after groups are configured
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teams Per Group
                  </label>
                  <input
                    type="number"
                    name="teamsPerGroup"
                    value={formData.teamsPerGroup}
                    onChange={handleChange}
                    min="2"
                    max="8"
                    className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-accent-500" />
              Knockout Configuration
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Qualifiers Per Group
                </label>
                <input
                  type="number"
                  name="qualifiersPerGroup"
                  value={formData.qualifiersPerGroup}
                  onChange={handleChange}
                  min="1"
                  max={formData.teamsPerGroup}
                  className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  How many teams from each group advance to knockout
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Matches Per Round
                </label>
                <input
                  type="number"
                  name="matchesPerRound"
                  value={formData.matchesPerRound}
                  onChange={handleChange}
                  min="1"
                  max="3"
                  className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  1 = Single match, 2 = Home & Away legs
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!formData.name.trim()) {
                  showToast('Please enter a season name', 'error');
                  return;
                }
                setStep(2);
              }}
              className="btn-primary flex items-center"
            >
              Next: Configure Groups
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Groups */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group, index) => (
              <div key={group.id} className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => updateGroupName(group.id, e.target.value)}
                    className="text-base sm:text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-primary-500 text-white outline-none px-2 py-1"
                  />
                  <span className="text-sm text-gray-400">
                    {group.teams.length}/{formData.teamsPerGroup} teams
                  </span>
                </div>

                {/* Teams in this group */}
                <div className="space-y-2 mb-4">
                  {group.teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between p-2 bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {team.logo && (
                          <img src={team.logo} alt={team.name} className="w-6 h-6 rounded flex-shrink-0" />
                        )}
                        <span className="text-sm text-white truncate">{team.name}</span>
                      </div>
                      <button
                        onClick={() => removeTeamFromGroup(group.id, team.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add team dropdown */}
                {group.teams.length < formData.teamsPerGroup && (
                  <select
                    onChange={(e) => {
                      const teamId = e.target.value;
                      if (teamId) {
                        const team = allTeams.find(t => t.id === teamId);
                        if (team) {
                          addTeamToGroup(group.id, team);
                        }
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Add team...</option>
                    {getAvailableTeams().map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={() => {
                const emptyGroups = groups.filter(g => g.teams.length === 0);
                if (emptyGroups.length > 0) {
                  showToast('All groups must have at least one team', 'error');
                  return;
                }
                setStep(3);
              }}
              className="btn-primary flex items-center justify-center"
            >
              Next: Review
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Review Season Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Season Name</p>
                  <p className="text-sm font-semibold text-white">{formData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Year</p>
                  <p className="text-sm font-semibold text-white">{formData.year}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Groups</p>
                  <p className="text-sm font-semibold text-white">{formData.numberOfGroups}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Teams/Group</p>
                  <p className="text-sm font-semibold text-white">{formData.teamsPerGroup}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">Group Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.map(group => (
                    <div key={group.id} className="p-3 bg-dark-700 rounded-lg">
                      <p className="text-sm font-semibold text-white mb-2">{group.name}</p>
                      <div className="space-y-1">
                        {group.teams.map(team => (
                          <div key={team.id} className="flex items-center space-x-2">
                            {team.logo && (
                              <img src={team.logo} alt={team.name} className="w-4 h-4 rounded" />
                            )}
                            <span className="text-xs text-gray-300">{team.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary flex items-center justify-center"
              disabled={saving}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Updating Season...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Season
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSeason;
