import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Trophy,
  Users,
  Calendar,
  Plus,
  X,
  ChevronRight
} from 'lucide-react';
import { seasonsCollection } from '../../firebase/firestore';
import { teamsCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CreateSeason = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Groups, 3: Knockout config
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    name: '',
    year: currentYear,
    numberOfGroups: 4,
    teamsPerGroup: 4,
    matchesPerRound: 2, // Knockout matches per round
    qualifiersPerGroup: 2 // How many teams qualify from each group
  });

  const [groups, setGroups] = useState([]);

  const isAdmin = user?.isAdmin;

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teams = await teamsCollection.getAll();
      setAllTeams(teams);
    } catch (error) {
      console.error('Error loading teams:', error);
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

  const initializeGroups = () => {
    const newGroups = [];
    for (let i = 0; i < formData.numberOfGroups; i++) {
      newGroups.push({
        id: `group-${i + 1}`,
        name: `Group ${i + 1}`,
        teams: []
      });
    }
    setGroups(newGroups);
    setStep(2);
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
          showToast(t('createSeason.groupFull').replace('{name}', g.name), 'error');
          return g;
        }
        if (g.teams.find(t => t.id === team.id)) {
          showToast(t('createSeason.teamAlreadyInGroup'), 'error');
          return g;
        }
        return { ...g, teams: [...g.teams, team] };
      }
      return g;
    }));
  };

  const removeTeamFromGroup = (groupId, teamId) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, teams: g.teams.filter(t => t.id !== teamId) } : g
    ));
  };

  const isTeamAssigned = (teamId) => {
    return groups.some(g => g.teams.find(t => t.id === teamId));
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.name.trim()) {
      showToast(t('createSeason.enterSeasonName'), 'error');
      return;
    }

    // Check if all groups have teams
    const emptyGroups = groups.filter(g => g.teams.length === 0);
    if (emptyGroups.length > 0) {
      showToast(t('createSeason.assignTeamsToAllGroups'), 'error');
      return;
    }

    try {
      setLoading(true);
      
      const seasonData = {
        name: formData.name.trim(),
        year: parseInt(formData.year, 10),
        numberOfGroups: parseInt(formData.numberOfGroups, 10),
        teamsPerGroup: parseInt(formData.teamsPerGroup, 10),
        ownerId: user?.uid || null,
        ownerName: user?.displayName || user?.name || user?.email || 'Unknown Admin',
        groups: groups.map(g => ({
          id: g.id,
          name: g.name,
          teams: g.teams,
          standings: g.teams.map(team => ({
            teamId: team.id,
            team: team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
          }))
        })),
        knockoutConfig: {
          matchesPerRound: parseInt(formData.matchesPerRound, 10),
          qualifiersPerGroup: parseInt(formData.qualifiersPerGroup, 10),
          rounds: []
        },
        isActive: false,
        status: 'upcoming'
      };

      const seasonId = await seasonsCollection.create(seasonData);
      showToast(t('createSeason.seasonCreated'), 'success');
      
      setTimeout(() => {
        navigate(`/admin/seasons/${seasonId}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating season:', error);
      showToast(t('createSeason.createFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">{t('createSeason.accessDenied')}</h2>
          <p className="text-gray-400 mb-6">{t('createSeason.adminRequired')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('createSeason.goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      {/* Toast */}
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
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="admin-header">{t('createSeason.title')}</h1>
            <p className="text-sm text-gray-400">
              {t('createSeason.step')} {step} {t('createSeason.of')} 3: {step === 1 ? t('createSeason.basicInfo') : step === 2 ? t('createSeason.configureGroups') : t('createSeason.reviewCreate')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-primary-500 text-white' : 'bg-dark-800 text-gray-500'
              }`}>
                {s}
              </div>
              <span className="text-xs text-gray-400 mt-2">
                {s === 1 ? t('createSeason.info') : s === 2 ? t('createSeason.groups') : t('createSeason.review')}
              </span>
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 mx-2 rounded ${
                step > s ? 'bg-primary-500' : 'bg-dark-800'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Trophy className="w-6 h-6 text-primary-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">{t('createSeason.seasonDetails')}</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createSeason.seasonName')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('createSeason.seasonNamePlaceholder').replace('{year}', currentYear)}
                  className="input-field w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('createSeason.defaultNameHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createSeason.year')}
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="2020"
                  max="2099"
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-accent-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">{t('createSeason.groupStageConfig')}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createSeason.numberOfGroups')}
                </label>
                <input
                  type="number"
                  name="numberOfGroups"
                  value={formData.numberOfGroups}
                  onChange={handleChange}
                  min="2"
                  max="8"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createSeason.teamsPerGroup')}
                </label>
                <input
                  type="number"
                  name="teamsPerGroup"
                  value={formData.teamsPerGroup}
                  onChange={handleChange}
                  min="3"
                  max="6"
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>{t('createSeason.totalTeamsNeeded')}:</strong> {formData.numberOfGroups * formData.teamsPerGroup} {t('createSeason.teams')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('createSeason.availableTeams')}: {allTeams.length}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">{t('createSeason.knockoutStageConfig')}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createSeason.matchesPerRound')}
                </label>
                <select
                  name="matchesPerRound"
                  value={formData.matchesPerRound}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="1">{t('createSeason.singleLeg')}</option>
                  <option value="2">{t('createSeason.homeAway')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('createSeason.qualifiersPerGroup')}
                </label>
                <input
                  type="number"
                  name="qualifiersPerGroup"
                  value={formData.qualifiersPerGroup}
                  onChange={handleChange}
                  min="1"
                  max={formData.teamsPerGroup}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                <strong>{t('createSeason.knockoutTeams')}:</strong> {formData.numberOfGroups * formData.qualifiersPerGroup} {t('createSeason.teamsWillQualify')}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={initializeGroups}
              className="btn-primary flex items-center space-x-2"
            >
              <span>{t('createSeason.nextConfigureGroups')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Groups */}
      {step === 2 && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('createSeason.assignTeamsToGroups')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group, index) => (
                <div key={group.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="mb-3">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateGroupName(group.id, e.target.value)}
                      className="input-field w-full font-semibold"
                      placeholder={t('createSeason.groupPlaceholder').replace('{index}', index + 1)}
                    />
                  </div>

                  <div className="space-y-2 mb-3">
                    {group.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-2 bg-dark-800 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          {team.logo && (
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <span className="text-sm text-white">{team.name}</span>
                        </div>
                        <button
                          onClick={() => removeTeamFromGroup(group.id, team.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-gray-400 mb-2">
                    {group.teams.length} / {formData.teamsPerGroup} {t('createSeason.teams')}
                  </div>

                  {group.teams.length < formData.teamsPerGroup && (
                    <select
                      onChange={(e) => {
                        const team = allTeams.find(t => t.id === e.target.value);
                        if (team) {
                          addTeamToGroup(group.id, team);
                          e.target.value = '';
                        }
                      }}
                      className="input-field w-full text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>{t('createSeason.addTeam')}</option>
                      {allTeams
                        .filter(team => !isTeamAssigned(team.id))
                        .map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              {t('createSeason.back')}
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-primary flex items-center space-x-2"
            >
              <span>{t('createSeason.nextReview')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('createSeason.reviewConfiguration')}</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">{t('createSeason.seasonName')}</span>
                <span className="text-white font-medium">
                  {formData.name || `5Star Premier League Season ${currentYear}`}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">{t('createSeason.year')}</span>
                <span className="text-white font-medium">{formData.year}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">{t('createSeason.numberOfGroups')}</span>
                <span className="text-white font-medium">{formData.numberOfGroups}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">{t('createSeason.teamsPerGroup')}</span>
                <span className="text-white font-medium">{formData.teamsPerGroup}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">{t('createSeason.totalTeams')}</span>
                <span className="text-white font-medium">
                  {groups.reduce((sum, g) => sum + g.teams.length, 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">{t('createSeason.knockoutFormat')}</span>
                <span className="text-white font-medium">
                  {formData.matchesPerRound === 1 ? t('createSeason.singleLeg') : t('createSeason.homeAway')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">{t('createSeason.qualifiersPerGroup')}</span>
                <span className="text-white font-medium">{formData.qualifiersPerGroup}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400 mb-2">
                <strong>{t('createSeason.groupsConfigured')}:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <span key={g.id} className="text-xs bg-dark-800 px-2 py-1 rounded text-gray-300">
                    {g.name} ({g.teams.length})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              {t('createSeason.back')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('createSeason.creating')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('createSeason.createSeason')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSeason;
