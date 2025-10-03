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
  Target
} from 'lucide-react';
import { seasonsCollection, fixturesCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const SeasonDetail = () => {
  const navigate = useNavigate();
  const { seasonId } = useParams();
  const { user } = useAuth();
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups'); // groups, knockout, fixtures
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (seasonId) {
      loadSeason();
    }
  }, [seasonId]);

  const loadSeason = async () => {
    try {
      setLoading(true);
      const data = await seasonsCollection.getById(seasonId);
      setSeason(data);
    } catch (error) {
      console.error('Error loading season:', error);
      showToast('Failed to load season', 'error');
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
      console.error('Error generating fixtures:', error);
      showToast('Failed to generate fixtures', 'error');
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
      console.error('Error seeding knockout:', error);
      showToast('Failed to seed knockout stage', 'error');
    }
  };

  const handleSetActive = async () => {
    try {
      await seasonsCollection.setActive(seasonId);
      showToast('Season activated successfully!', 'success');
      loadSeason();
    } catch (error) {
      console.error('Error activating season:', error);
      showToast('Failed to activate season', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Access Denied</h2>
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
          <h2 className="text-xl font-semibold text-white mb-4">Season Not Found</h2>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/seasons')}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-white">{season.name}</h1>
              {season.isActive && (
                <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded">
                  Active
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-medium border rounded ${getStatusBadge(season.status)}`}>
                {season.status}
              </span>
            </div>
            <p className="text-sm text-gray-400">Season {season.year}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!season.isActive && (
            <button
              onClick={handleSetActive}
              className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Activate</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/seasons/${seasonId}/edit`)}
            className="px-4 py-2 bg-accent-500/10 text-accent-400 border border-accent-500/30 rounded-lg hover:bg-accent-500/20 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Groups</p>
              <p className="text-xl font-semibold text-white">{season.numberOfGroups}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-500/10 rounded-lg">
              <Trophy className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Teams/Group</p>
              <p className="text-xl font-semibold text-white">{season.teamsPerGroup}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Target className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Teams</p>
              <p className="text-xl font-semibold text-white">
                {season.groups?.reduce((sum, g) => sum + (g.teams?.length || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Qualifiers</p>
              <p className="text-xl font-semibold text-white">
                {season.knockoutConfig?.qualifiersPerGroup || 2} per group
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleGenerateFixtures}
          className="card p-4 hover:bg-dark-800/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-accent-400" />
            <div>
              <h3 className="font-semibold text-white">Generate Group Fixtures</h3>
              <p className="text-sm text-gray-400">Create all group stage matches</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleSeedKnockout}
          className="card p-4 hover:bg-dark-800/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-primary-400" />
            <div>
              <h3 className="font-semibold text-white">Seed Knockout Stage</h3>
              <p className="text-sm text-gray-400">Generate knockout brackets</p>
            </div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-dark-800 p-1 rounded-lg">
        {[
          { id: 'groups', label: 'Groups', icon: Users },
          { id: 'knockout', label: 'Knockout', icon: Trophy },
          { id: 'fixtures', label: 'Fixtures', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {season.groups?.map((group) => (
            <div key={group.id} className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{group.name}</h3>
              
              {/* Group Standings */}
              {group.standings && group.standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                      <tr>
                        <th className="text-left py-2">Pos</th>
                        <th className="text-left py-2">Team</th>
                        <th className="text-center py-2">P</th>
                        <th className="text-center py-2">W</th>
                        <th className="text-center py-2">D</th>
                        <th className="text-center py-2">L</th>
                        <th className="text-center py-2">GD</th>
                        <th className="text-center py-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {group.standings
                        .sort((a, b) => b.points - a.points || (b.goalDifference - a.goalDifference))
                        .map((standing, index) => (
                          <tr key={standing.teamId} className="border-b border-gray-700/50">
                            <td className="py-3 text-white">{index + 1}</td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={standing.team?.logo}
                                  alt={standing.team?.name}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                                <span className="text-white">{standing.team?.name}</span>
                              </div>
                            </td>
                            <td className="text-center text-gray-300">{standing.played}</td>
                            <td className="text-center text-gray-300">{standing.won}</td>
                            <td className="text-center text-gray-300">{standing.drawn}</td>
                            <td className="text-center text-gray-300">{standing.lost}</td>
                            <td className="text-center text-gray-300">
                              {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                            </td>
                            <td className="text-center font-semibold text-white">{standing.points}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No standings available yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Standings will be calculated from match results
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'knockout' && (
        <div className="card p-6">
          {season.knockoutConfig?.rounds && season.knockoutConfig.rounds.length > 0 ? (
            <div className="space-y-6">
              {season.knockoutConfig.rounds.map((round) => (
                <div key={round.roundNumber}>
                  <h3 className="text-lg font-semibold text-white mb-4">{round.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {round.matches.map((match) => (
                      <div key={match.matchNumber} className="p-4 bg-dark-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={match.homeTeam?.team?.logo}
                              alt={match.homeTeam?.team?.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className="text-white">{match.homeTeam?.team?.name || 'TBD'}</span>
                          </div>
                          <span className="text-gray-400 text-sm">vs</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{match.awayTeam?.team?.name || 'TBD'}</span>
                            <img
                              src={match.awayTeam?.team?.logo}
                              alt={match.awayTeam?.team?.name}
                              className="w-6 h-6 object-contain"
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
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">Knockout Stage Not Set</h3>
              <p className="text-gray-400 mb-6">
                Seed the knockout stage once group stage results are available
              </p>
              <button
                onClick={handleSeedKnockout}
                className="btn-primary"
              >
                Seed Knockout Stage
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fixtures' && (
        <div className="card p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold text-white mb-2">Season Fixtures</h3>
            <p className="text-gray-400">
              View and manage all fixtures for this season
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonDetail;
