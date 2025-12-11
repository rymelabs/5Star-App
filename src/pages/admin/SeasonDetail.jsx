import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  Users,
  Calendar,
  Play,
  Edit,
  TrendingUp,
  Target,
  Eye,
  Clock
} from 'lucide-react';
import { seasonsCollection, fixturesCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useFootball } from '../../context/FootballContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import SeasonStandings from '../../components/SeasonStandings';

const SeasonDetail = () => {
  const navigate = useNavigate();
  const { seasonId } = useParams();
  const { user } = useAuth();
  const { teams } = useFootball();
  const [season, setSeason] = useState(null);
  const [seasonFixtures, setSeasonFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups'); // groups, knockout, fixtures
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const isAdmin = user?.isAdmin;

  useEffect(() => {
    if (seasonId) {
      loadSeason();
      loadSeasonFixtures();
      
      // Set up real-time listener for season (to update standings)
      const unsubscribeSeason = seasonsCollection.onSnapshotById(seasonId, (updatedSeason) => {
        if (updatedSeason) {
          setSeason(updatedSeason);
        }
      });
      
      // Set up real-time listener for fixtures
      const unsubscribeFixtures = fixturesCollection.onSnapshot((updatedFixtures) => {
        const seasonFixturesData = updatedFixtures.filter(f => f.seasonId === seasonId);
        
        // Populate with team data
        const populatedFixtures = seasonFixturesData.map(fixture => {
          const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
          const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
          
          return {
            ...fixture,
            homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'Unknown Team', logo: '' },
            awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'Unknown Team', logo: '' }
          };
        });
        
        setSeasonFixtures(populatedFixtures);
      });
      
      return () => {
        unsubscribeSeason();
        unsubscribeFixtures();
      };
    }
  }, [seasonId, teams]);

  const loadSeason = async () => {
    try {
      setLoading(true);
      const data = await seasonsCollection.getById(seasonId);
      setSeason(data);
    } catch (error) {
      showToast('Failed to load season', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonFixtures = async () => {
    try {
      const fixtures = await fixturesCollection.getBySeason(seasonId);
      
      // Populate with team data
      const populatedFixtures = fixtures.map(fixture => {
        const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
        const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
        
        return {
          ...fixture,
          homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'Unknown Team', logo: '' },
          awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'Unknown Team', logo: '' }
        };
      });
      
      setSeasonFixtures(populatedFixtures);
    } catch (error) {
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleGenerateFixtures = async () => {
    if (!confirm('Generate fixtures for all groups? This will create all group stage matches.')) {
      return;
    }

    try {
      const fixtures = await seasonsCollection.generateGroupFixtures(seasonId);
      
      // Save fixtures to Firestore
      for (const fixture of fixtures) {
        await fixturesCollection.add({
          ...fixture,
          createdAt: new Date(),
          status: 'upcoming'
        });
      }

      showToast(`Generated ${fixtures.length} fixtures successfully!`, 'success');
    } catch (error) {
      showToast('Failed to generate fixtures', 'error');
    }
  };

  const handleDeleteSeasonFixtures = async () => {
    if (!confirm('⚠️ DELETE all fixtures for this season? This action cannot be undone!')) {
      return;
    }

    try {
      const deletedCount = await fixturesCollection.deleteBySeason(seasonId);
      showToast(`Deleted ${deletedCount} fixtures successfully!`, 'success');
    } catch (error) {
      showToast('Failed to delete fixtures', 'error');
    }
  };

  const handleCleanupBrokenFixtures = async () => {
    if (!confirm('Clean up broken fixtures? This will delete all fixtures with missing team IDs.')) {
      return;
    }

    try {
      const deletedCount = await fixturesCollection.cleanupBrokenFixtures();
      showToast(`Cleaned up ${deletedCount} broken fixtures!`, 'success');
    } catch (error) {
      showToast('Failed to cleanup fixtures', 'error');
    }
  };

  const handleRegenerateFixtures = async () => {
    if (!confirm('⚠️ REGENERATE all fixtures? This will delete existing fixtures and create new ones with correct team IDs.')) {
      return;
    }

    try {
      // Step 1: Delete existing fixtures
      const deletedCount = await fixturesCollection.deleteBySeason(seasonId);
      
      // Step 2: Generate new fixtures
      const fixtures = await seasonsCollection.generateGroupFixtures(seasonId);
      
      // Step 3: Save new fixtures
      for (const fixture of fixtures) {
        await fixturesCollection.add({
          ...fixture,
          createdAt: new Date(),
          status: 'upcoming'
        });
      }

      showToast(`✅ Deleted ${deletedCount} old fixtures and generated ${fixtures.length} new fixtures!`, 'success');
    } catch (error) {
      showToast('Failed to regenerate fixtures', 'error');
    }
  };

  const handleSeedKnockout = async () => {
    if (!confirm('Seed knockout stage? This will automatically create knockout brackets from group qualifiers.')) {
      return;
    }

    try {
      const qualifiersPerGroup = season.knockoutConfig?.qualifiersPerGroup || 2;
      await seasonsCollection.seedKnockoutStage(seasonId, qualifiersPerGroup);
      showToast('Knockout stage seeded successfully!', 'success');
      loadSeason(); // Reload to show updated knockout rounds
    } catch (error) {
      showToast('Failed to seed knockout stage', 'error');
    }
  };

  const handleSetActive = async (isActive = true) => {
    try {
      await seasonsCollection.setActive(seasonId, isActive);
      showToast(isActive ? 'Season activated successfully!' : 'Season deactivated.', 'success');
      loadSeason();
    } catch (error) {
      showToast('Failed to update season active state', 'error');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">Season Not Found</h2>
          <p className="text-gray-400 mb-6">The season you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/admin/seasons')} className="btn-primary">
            Back to Seasons
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ongoing: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[status] || badges.upcoming;
  };

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
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start flex-1 min-w-0">
            <button
              onClick={() => navigate('/admin/seasons')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors mr-2 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="admin-header truncate">{season.name}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {season.isActive && (
                    <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded whitespace-nowrap">
                      Active
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium border rounded whitespace-nowrap ${getStatusBadge(season.status)}`}>
                    {season.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">Season {season.year}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSetActive(!season.isActive)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              season.isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
            }`}
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">{season.isActive ? 'Deactivate' : 'Activate'}</span>
          </button>
          <button
            onClick={() => navigate(`/admin/seasons/${seasonId}/edit`)}
            className="flex-1 sm:flex-none px-4 py-2 bg-accent-500/10 text-accent-400 border border-accent-500/30 rounded-lg hover:bg-accent-500/20 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">{season.numberOfGroups}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Groups</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-accent-500/10 rounded-lg">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-accent-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">{season.teamsPerGroup}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Teams/Group</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-primary-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">
                {season.groups?.reduce((sum, g) => sum + (g.teams?.length || 0), 0) || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Total Teams</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">
                {season.knockoutConfig?.qualifiersPerGroup || 2}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Per Group</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        <button
          onClick={handleGenerateFixtures}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-500/10 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-green-400 text-sm truncate">Generate Fixtures</h3>
              <p className="text-xs text-gray-400 truncate">Create all group stage matches</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleRegenerateFixtures}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left border border-orange-500/30"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-orange-500/10 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-orange-400 text-sm truncate">🔄 Regenerate Fixtures</h3>
              <p className="text-xs text-gray-400 truncate">Delete & recreate all fixtures</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleSeedKnockout}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary-500/10 rounded-lg flex-shrink-0">
              <Trophy className="w-4 h-4 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">Seed Knockout Stage</h3>
              <p className="text-xs text-gray-400 truncate">Generate knockout brackets</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleCleanupBrokenFixtures}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left border border-red-500/30"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg flex-shrink-0">
              <Target className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-400 text-sm truncate">🧹 Cleanup Broken Fixtures</h3>
              <p className="text-xs text-gray-400 truncate">Remove fixtures with missing teams</p>
            </div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-nav flex space-x-1 mb-6 bg-dark-800 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'groups', label: 'Groups', icon: Users },
          { id: 'knockout', label: 'Knockout', icon: Trophy },
          { id: 'fixtures', label: 'Fixtures', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[90px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3 h-3 flex-shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <SeasonStandings season={season} teams={teams} fixtures={seasonFixtures} />
        </div>
      )}

      {activeTab === 'knockout' && (
        <div className="card p-3 sm:p-4">
          {season.knockoutConfig?.rounds && season.knockoutConfig.rounds.length > 0 ? (
            <div className="space-y-4">
              {season.knockoutConfig.rounds.map((round) => (
                <div key={round.roundNumber}>
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-3">{round.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    {round.matches.map((match) => (
                      <div key={match.matchNumber} className="p-3 sm:p-4 bg-dark-800 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <img
                              src={match.homeTeam?.team?.logo}
                              alt={match.homeTeam?.team?.name}
                              className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className="text-white text-sm sm:text-base truncate">{match.homeTeam?.team?.name || 'TBD'}</span>
                          </div>
                          <span className="text-gray-400 text-xs sm:text-sm text-center flex-shrink-0">vs</span>
                          <div className="flex items-center space-x-2 flex-1 min-w-0 sm:justify-end">
                            <span className="text-white text-sm sm:text-base truncate sm:order-2">{match.awayTeam?.team?.name || 'TBD'}</span>
                            <img
                              src={match.awayTeam?.team?.logo}
                              alt={match.awayTeam?.team?.name}
                              className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0 sm:order-1"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Knockout Stage Not Set</h3>
              <p className="text-sm text-gray-400 mb-6 px-4">
                Seed the knockout stage once group stage results are available
              </p>
              <button
                onClick={handleSeedKnockout}
                className="btn-primary text-sm sm:text-base"
              >
                Seed Knockout Stage
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {seasonFixtures.length === 0 ? (
            <div className="card p-3 sm:p-4">
              <div className="text-center py-6 sm:py-8">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-600" />
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">No Fixtures Yet</h3>
                <p className="text-xs sm:text-sm text-gray-400 px-4">
                  Generate fixtures to see them here
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Group fixtures by group */}
              {(() => {
                // Group fixtures by groupId
                const groupedFixtures = seasonFixtures.reduce((acc, fixture) => {
                  const key = fixture.groupId || fixture.stage || 'other';
                  if (!acc[key]) {
                    acc[key] = {
                      name: fixture.groupName || (fixture.stage ? fixture.stage.charAt(0).toUpperCase() + fixture.stage.slice(1) : 'Other Fixtures'),
                      fixtures: []
                    };
                  }
                  acc[key].fixtures.push(fixture);
                  return acc;
                }, {});

                return Object.entries(groupedFixtures).map(([key, data]) => (
                  <div key={key} className="card p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
                      {data.name} ({data.fixtures.length} fixtures)
                    </h3>
                    
                    <div className="space-y-2">
                      {data.fixtures.map((fixture) => (
                        <div 
                          key={fixture.id}
                          className="p-2 sm:p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Teams */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Home Team */}
                              <div className="flex items-center gap-2 flex-1 justify-end min-w-0 max-w-[40%]">
                                <span className="text-sm font-medium text-white truncate" title={fixture.homeTeam?.name}>
                                  {fixture.homeTeam?.name}
                                </span>
                                {fixture.homeTeam?.logo && (
                                  <img
                                    src={fixture.homeTeam.logo}
                                    alt={fixture.homeTeam.name}
                                    className="w-6 h-6 object-contain flex-shrink-0"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                              </div>

                              {/* Score or VS */}
                              <div className="flex items-center gap-2 px-3 flex-shrink-0">
                                {fixture.status === 'completed' ? (
                                  <div className="text-center">
                                    <div className="text-base font-bold text-white">
                                      {fixture.homeScore} - {fixture.awayScore}
                                    </div>
                                    <div className="text-xs text-gray-500">FT</div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-primary-500">VS</div>
                                    {fixture.dateTime && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        {new Date(fixture.dateTime).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[40%]">
                                {fixture.awayTeam?.logo && (
                                  <img
                                    src={fixture.awayTeam.logo}
                                    alt={fixture.awayTeam.name}
                                    className="w-6 h-6 object-contain flex-shrink-0"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <span className="text-sm font-medium text-white truncate" title={fixture.awayTeam?.name}>
                                  {fixture.awayTeam?.name}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => navigate(`/fixtures/${fixture.id}`)}
                              className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors flex-shrink-0"
                              title="View fixture details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Fixture Info */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            {fixture.dateTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(fixture.dateTime).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded capitalize ${
                              fixture.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              fixture.status === 'live' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {fixture.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SeasonDetail;
