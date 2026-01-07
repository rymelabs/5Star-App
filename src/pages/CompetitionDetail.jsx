import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Radio, 
  ChevronRight, 
  Share2, 
  Info 
} from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatTime } from '../utils/dateUtils';
import { abbreviateTeamName, isFixtureLive, getLiveTeamIds } from '../utils/helpers';
import { calculateGroupStandings } from '../utils/standingsUtils';
import NewTeamAvatar from '../components/NewTeamAvatar';
import SurfaceCard from '../components/ui/SurfaceCard';
import PillChip from '../components/ui/PillChip';
import CompactFixtureRow from '../components/CompactFixtureRow';

const CompetitionDetail = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { t } = useLanguage();
  const { 
    seasons = [], 
    leagues = [], 
    fixtures = [], 
    teams = [],
    getSeasonFixtures 
  } = useFootball();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [competitionFixtures, setCompetitionFixtures] = useState([]);

  // Find the competition based on type and id
  const competition = useMemo(() => {
    if (type === 'season') {
      return seasons.find(s => s.id === id);
    } else if (type === 'league') {
      return leagues.find(l => l.id === id);
    }
    return null;
  }, [type, id, seasons, leagues]);

  // Load fixtures for this competition
  useEffect(() => {
    const loadFixtures = async () => {
      setLoading(true);
      try {
        let fixturesList = [];
        
        if (type === 'season' && id) {
          // Get fixtures for season
          fixturesList = fixtures.filter(f => f.seasonId === id);
        } else if (type === 'league' && id) {
          // Get fixtures for league
          fixturesList = fixtures.filter(f => f.leagueId === id);
        }
        
        // Populate with team data
        const populatedFixtures = fixturesList.map(fixture => {
          const homeTeam = teams.find(t => t.id === fixture.homeTeamId) || fixture.homeTeam;
          const awayTeam = teams.find(t => t.id === fixture.awayTeamId) || fixture.awayTeam;
          
          return {
            ...fixture,
            homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'TBD', logo: '' },
            awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'TBD', logo: '' }
          };
        });
        
        setCompetitionFixtures(populatedFixtures);
      } catch (error) {
        console.error('Error loading competition fixtures:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFixtures();
  }, [type, id, fixtures, teams]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = competitionFixtures.filter(f => f.status === 'completed');
    const upcoming = competitionFixtures.filter(f => f.status !== 'completed');
    const live = competitionFixtures.filter(f => isFixtureLive(f));
    
    // Get unique teams
    const uniqueTeamsMap = new Map();
    competitionFixtures.forEach(f => {
      if (f.homeTeamId && f.homeTeam) uniqueTeamsMap.set(f.homeTeamId, f.homeTeam);
      if (f.awayTeamId && f.awayTeam) uniqueTeamsMap.set(f.awayTeamId, f.awayTeam);
    });
    
    const participatingTeams = Array.from(uniqueTeamsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    // Calculate total goals
    let totalGoals = 0;
    completed.forEach(f => {
      totalGoals += (Number(f.homeScore) || 0) + (Number(f.awayScore) || 0);
    });
    
    // Top scorers (by team)
    const teamGoals = new Map();
    completed.forEach(f => {
      const homeTeam = f.homeTeam;
      const awayTeam = f.awayTeam;
      const homeGoals = Number(f.homeScore) || 0;
      const awayGoals = Number(f.awayScore) || 0;
      
      if (homeTeam?.id) {
        const current = teamGoals.get(homeTeam.id) || { ...homeTeam, goals: 0, matches: 0 };
        current.goals += homeGoals;
        current.matches += 1;
        teamGoals.set(homeTeam.id, current);
      }
      
      if (awayTeam?.id) {
        const current = teamGoals.get(awayTeam.id) || { ...awayTeam, goals: 0, matches: 0 };
        current.goals += awayGoals;
        current.matches += 1;
        teamGoals.set(awayTeam.id, current);
      }
    });
    
    const topScoringTeams = Array.from(teamGoals.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
    
    return {
      totalFixtures: competitionFixtures.length,
      completed: completed.length,
      upcoming: upcoming.length,
      live: live.length,
      teamsCount: participatingTeams.length,
      participatingTeams,
      totalGoals,
      avgGoalsPerMatch: completed.length > 0 ? (totalGoals / completed.length).toFixed(1) : 0,
      topScoringTeams
    };
  }, [competitionFixtures]);

  // Calculate group standings for seasons
  const groupStandings = useMemo(() => {
    if (type !== 'season' || !competition?.groups) return null;
    
    const standings = {};
    const completedFixtures = competitionFixtures.filter(f => f.status === 'completed');
    
    competition.groups.forEach(group => {
      standings[group.id] = calculateGroupStandings(group, completedFixtures, teams, id);
    });
    
    return standings;
  }, [type, competition, competitionFixtures, teams, id]);

  const liveTeamIds = useMemo(() => getLiveTeamIds(competitionFixtures), [competitionFixtures]);

  // Separate fixtures by status
  const { upcomingFixtures, recentResults } = useMemo(() => {
    const now = new Date();
    const upcoming = competitionFixtures
      .filter(f => f.status !== 'completed')
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    const results = competitionFixtures
      .filter(f => f.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    return { upcomingFixtures: upcoming, recentResults: results };
  }, [competitionFixtures]);

  const handleFixtureClick = (fixture) => {
    navigate(`/fixtures/${fixture.id}`);
  };

  const handleTeamClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const handleShare = async () => {
    const shareData = {
      title: competition?.name || 'Competition',
      text: `Check out ${competition?.name || 'this competition'} on 5Star!`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could add a toast notification here
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
        }
      }
    }
  };

  if (!competition && !loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Competition Not Found</h2>
          <p className="text-gray-400 mb-4">The competition you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-brand-purple hover:text-brand-purple/80"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'teams', label: 'Teams' },
    ...(type === 'season' && competition?.groups?.length > 0 ? [{ id: 'standings', label: 'Standings' }] : []),
    ...(type === 'season' && competition?.knockoutRounds?.length > 0 ? [{ id: 'knockout', label: 'Knockout' }] : []),
    { id: 'stats', label: 'Stats' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-20"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-elevated border-b border-white/[0.06] rounded-t-3xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/10 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-purple/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-0">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={handleShare}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all group"
              >
                <Share2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Competition Info */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-4 flex items-center justify-center shadow-2xl shadow-brand-purple/10">
                {competition?.logo ? (
                  <img 
                    src={competition.logo} 
                    alt={competition.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <Trophy className="w-12 h-12 text-brand-purple" />
                )}
              </div>
              {competition?.isActive && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <PillChip label="Active Season" size="sm" variant="solid" tone="primary" className="shadow-lg shadow-brand-purple/20" />
                </div>
              )}
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
            >
              {competition?.name || 'Loading...'}
            </motion.h1>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 text-sm text-gray-400"
            >
              <span className="capitalize">{type}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>{stats.teamsCount} Teams</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>{stats.totalFixtures} Matches</span>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center">
            <div className="flex justify-center gap-1 overflow-x-auto hide-scrollbar pb-0 w-full sm:w-auto border-b border-white/10 sm:border-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { label: 'Teams', value: stats.teamsCount, icon: Users, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
                      { label: 'Fixtures', value: stats.totalFixtures, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                      { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                      { label: 'Goals', value: stats.totalGoals, icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-elevated-soft border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                        <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Live Matches */}
                      {stats.live > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <div className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Now</h3>
                          </div>
                          <div className="space-y-2">
                            {competitionFixtures
                              .filter(f => isFixtureLive(f))
                              .map(fixture => (
                                <CompactFixtureRow 
                                  key={fixture.id} 
                                  fixture={fixture} 
                                  onClick={handleFixtureClick}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Upcoming Fixtures */}
                      {upcomingFixtures.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming</h3>
                            </div>
                            <button 
                              onClick={() => setActiveTab('fixtures')}
                              className="text-xs text-brand-purple hover:text-brand-purple/80 font-medium"
                            >
                              View All
                            </button>
                          </div>
                          <div className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                            {upcomingFixtures.slice(0, 5).map(fixture => (
                              <CompactFixtureRow 
                                key={fixture.id} 
                                fixture={fixture} 
                                onClick={handleFixtureClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* About Card */}
                      {competition?.description && (
                        <div className="bg-elevated-soft border border-white/5 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">About</h3>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed">{competition.description}</p>
                        </div>
                      )}

                      {/* Format Info */}
                      {type === 'season' && (
                        <div className="bg-elevated-soft border border-white/5 rounded-xl p-5">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Format</h3>
                          <div className="space-y-3">
                            {competition?.groups?.length > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Group Stage</span>
                                <span className="text-white font-medium">{competition.groups.length} Groups</span>
                              </div>
                            )}
                            {competition?.knockoutRounds?.length > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Knockout</span>
                                <span className="text-white font-medium">{competition.knockoutRounds.length} Rounds</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                              <span className="text-gray-400">Avg. Goals</span>
                              <span className="text-white font-medium">{stats.avgGoalsPerMatch} / match</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recent Results */}
                      {recentResults.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Results</h3>
                            </div>
                            <button 
                              onClick={() => setActiveTab('fixtures')}
                              className="text-xs text-brand-purple hover:text-brand-purple/80 font-medium"
                            >
                              View All
                            </button>
                          </div>
                          <div className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                            {recentResults.slice(0, 5).map(fixture => (
                              <CompactFixtureRow 
                                key={fixture.id} 
                                fixture={fixture} 
                                onClick={handleFixtureClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fixtures Tab */}
              {activeTab === 'fixtures' && (
                <div className="space-y-8">
                  {/* Upcoming */}
                  {upcomingFixtures.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h3 className="text-lg font-bold text-white">Upcoming Fixtures</h3>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400 font-medium border border-white/5">
                          {upcomingFixtures.length}
                        </span>
                      </div>
                      <div className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {upcomingFixtures.map(fixture => (
                          <CompactFixtureRow 
                            key={fixture.id} 
                            fixture={fixture} 
                            onClick={handleFixtureClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {recentResults.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                        <h3 className="text-lg font-bold text-white">Recent Results</h3>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400 font-medium border border-white/5">
                          {recentResults.length}
                        </span>
                      </div>
                      <div className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {recentResults.map(fixture => (
                          <CompactFixtureRow 
                            key={fixture.id} 
                            fixture={fixture} 
                            onClick={handleFixtureClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {upcomingFixtures.length === 0 && recentResults.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No Fixtures Found</h3>
                      <p className="text-gray-400">There are no fixtures scheduled for this competition yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Teams Tab */}
              {activeTab === 'teams' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-brand-purple rounded-full" />
                    <h3 className="text-lg font-bold text-white">Participating Teams</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400 font-medium border border-white/5">
                      {stats.teamsCount}
                    </span>
                  </div>
                  
                  {stats.participatingTeams.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.participatingTeams.map(team => (
                        <div 
                          key={team.id}
                          onClick={() => handleTeamClick(team.id)}
                          className="bg-elevated-soft border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-all group"
                        >
                          <NewTeamAvatar team={team} size={48} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-white truncate group-hover:text-brand-purple transition-colors">
                              {team.name}
                            </h4>
                            {team.shortName && (
                              <p className="text-xs text-gray-500">{team.shortName}</p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No Teams Found</h3>
                      <p className="text-gray-400">No teams have been assigned to this competition yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Standings Tab */}
              {activeTab === 'standings' && type === 'season' && (
                <div className="space-y-8">
                  {competition?.groups?.map(group => (
                    <div key={group.id} className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden">
                      <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-base font-bold text-white">{group.name}</h3>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Group Stage</div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-white/[0.02] text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                              <th className="px-4 py-3 text-left w-12">Pos</th>
                              <th className="px-4 py-3 text-left">Team</th>
                              <th className="px-2 py-3 text-center w-10">P</th>
                              <th className="px-2 py-3 text-center w-10">W</th>
                              <th className="px-2 py-3 text-center w-10">D</th>
                              <th className="px-2 py-3 text-center w-10">L</th>
                              <th className="px-2 py-3 text-center w-10 hidden sm:table-cell">GF</th>
                              <th className="px-2 py-3 text-center w-10 hidden sm:table-cell">GA</th>
                              <th className="px-2 py-3 text-center w-10">GD</th>
                              <th className="px-4 py-3 text-center w-16 font-bold text-white">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {groupStandings?.[group.id]?.map((standing, index) => {
                              const teamId = standing.teamId || standing.team?.id;
                              const isTeamLive = teamId ? liveTeamIds.has(teamId) : false;
                              const relegationPos = Number.isFinite(Number(competition?.relegationPosition)) ? Number(competition.relegationPosition) : null;
                              const rowPos = Number(standing.position) || (index + 1);
                              const isRelegated = Boolean(relegationPos && rowPos >= relegationPos);

                              return (
                              <tr
                                key={standing.teamId || standing.team?.id}
                                onClick={() => handleTeamClick(standing.teamId || standing.team?.id)}
                                className={`hover:bg-white/[0.02] cursor-pointer transition-colors group ${isRelegated ? 'bg-red-500/[0.03]' : ''}`}
                              >
                                <td className="px-4 py-3">
                                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    index < 2
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : isRelegated
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'text-gray-500'
                                  }`}>
                                    {rowPos}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <NewTeamAvatar team={standing.team} size={24} />
                                    <span
                                      className={`font-medium truncate max-w-[140px] sm:max-w-xs transition-colors ${
                                        isTeamLive ? 'text-red-400' : 'text-white group-hover:text-brand-purple'
                                      }`}
                                    >
                                      {standing.team?.name || 'Unknown Team'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center text-gray-400">{standing.played}</td>
                                <td className="px-2 py-3 text-center text-gray-400">{standing.won}</td>
                                <td className="px-2 py-3 text-center text-gray-400">{standing.drawn}</td>
                                <td className="px-2 py-3 text-center text-gray-400">{standing.lost}</td>
                                <td className="px-2 py-3 text-center text-gray-400 hidden sm:table-cell">{standing.goalsFor}</td>
                                <td className="px-2 py-3 text-center text-gray-400 hidden sm:table-cell">{standing.goalsAgainst}</td>
                                <td className="px-2 py-3 text-center font-medium">
                                  <span className={standing.goalDifference > 0 ? 'text-emerald-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-gray-400'}>
                                    {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-white bg-white/[0.02]">{standing.points}</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {(!competition?.groups || competition.groups.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No Groups</h3>
                      <p className="text-gray-400">This competition doesn't have any groups configured.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Knockout Tab */}
              {activeTab === 'knockout' && type === 'season' && (
                <div className="space-y-6">
                  {competition?.knockoutRounds?.map((round, roundIndex) => (
                    <div key={roundIndex} className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden">
                      <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5">
                        <h3 className="text-base font-bold text-white">{round.name}</h3>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {round.matches?.map((match, matchIndex) => {
                          const homeTeam = teams.find(t => t.id === match.homeTeamId) || { name: match.homePlaceholder || 'TBD' };
                          const awayTeam = teams.find(t => t.id === match.awayTeamId) || { name: match.awayPlaceholder || 'TBD' };
                          
                          return (
                            <div 
                              key={`${round.name}-match-${matchIndex}`}
                              className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto mb-2 sm:mb-0">
                                <NewTeamAvatar team={homeTeam} size={32} />
                                <span className="text-sm font-medium text-white truncate">{homeTeam.name}</span>
                              </div>
                              
                              <div className="px-6 py-1 bg-black/40 rounded-full border border-white/5 text-xs font-bold text-gray-400 mx-4">
                                VS
                              </div>
                              
                              <div className="flex items-center gap-3 flex-1 justify-end w-full sm:w-auto mt-2 sm:mt-0 flex-row-reverse sm:flex-row">
                                <span className="text-sm font-medium text-white truncate">{awayTeam.name}</span>
                                <NewTeamAvatar team={awayTeam} size={32} />
                              </div>
                            </div>
                          );
                        })}
                        
                        {(!round.matches || round.matches.length === 0) && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            Matches have not been scheduled yet
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!competition?.knockoutRounds || competition.knockoutRounds.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No Knockout Rounds</h3>
                      <p className="text-gray-400">This competition doesn't have any knockout rounds configured.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Scoring Teams */}
                  <div className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <h3 className="text-base font-bold text-white">Top Scoring Teams</h3>
                    </div>
                    
                    {stats.topScoringTeams.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {stats.topScoringTeams.map((team, index) => (
                          <div 
                            key={team.id}
                            onClick={() => handleTeamClick(team.id)}
                            className="flex items-center gap-4 p-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <span className={`text-xl font-bold w-8 text-center ${
                              index === 0 ? 'text-amber-400' : 
                              index === 1 ? 'text-gray-300' : 
                              index === 2 ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <NewTeamAvatar team={team} size={40} />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-white truncate">{team.name}</p>
                              <p className="text-xs text-gray-500">{team.matches} matches played</p>
                            </div>
                            <div className="text-right bg-white/5 px-3 py-1 rounded-lg">
                              <p className="text-lg font-bold text-white">{team.goals}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Goals</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        No goal data available yet
                      </div>
                    )}
                  </div>

                  {/* Match Statistics */}
                  <div className="bg-elevated-soft border border-white/5 rounded-xl overflow-hidden h-fit">
                    <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <h3 className="text-base font-bold text-white">Match Statistics</h3>
                    </div>
                    
                    <div className="p-5 grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white mb-1">{stats.totalGoals}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Goals</p>
                      </div>
                      <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white mb-1">{stats.avgGoalsPerMatch}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Goals/Match</p>
                      </div>
                      <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white mb-1">{stats.completed}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Matches Played</p>
                      </div>
                      <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white mb-1">{stats.upcoming}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CompetitionDetail;