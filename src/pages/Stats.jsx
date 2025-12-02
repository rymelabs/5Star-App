import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFootball } from '../context/FootballContext';
import { useCompetitions } from '../context/CompetitionsContext';
import { useLanguage } from '../context/LanguageContext';
import NewTeamAvatar from '../components/NewTeamAvatar';
import { Trophy, Target, Users, Shield, AlertCircle, TrendingUp, Filter, BarChart3, ChevronRight } from 'lucide-react';

const Stats = () => {
  const { fixtures, teams, activeSeason, seasons } = useFootball();
  const { competitions } = useCompetitions();
  const { t } = useLanguage();
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [activeTab, setActiveTab] = useState('scorers');
  const [expandedTeamStats, setExpandedTeamStats] = useState({
    topScoring: false,
    bestDefense: false,
    bestGD: false,
    mostConceded: false
  });

  // Filter fixtures based on selected filters (for player stats - requires events)
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(fixture => {
      const isCompleted = fixture.status === 'completed';
      const matchesSeason = selectedSeason === 'all' || fixture.season === selectedSeason;
      const matchesCompetition = selectedCompetition === 'all' || fixture.competition === selectedCompetition;
      return isCompleted && matchesSeason && matchesCompetition && fixture.events;
    });
  }, [fixtures, selectedSeason, selectedCompetition]);

  // Filter fixtures for team stats (requires completed status and scores)
  const filteredFixturesForTeams = useMemo(() => {
    return fixtures.filter(fixture => {
      const isCompleted = fixture.status === 'completed';
      const matchesSeason = selectedSeason === 'all' || fixture.season === selectedSeason;
      const matchesCompetition = selectedCompetition === 'all' || fixture.competition === selectedCompetition;
      return isCompleted && matchesSeason && matchesCompetition;
    });
  }, [fixtures, selectedSeason, selectedCompetition]);

  // Calculate Top Scorers (Players)
  const topScorers = useMemo(() => {
    const scorerMap = new Map();

    filteredFixtures.forEach(fixture => {
      if (!fixture.events) return;

      fixture.events.forEach(event => {
        if (event.type === 'goal') {
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          const player = team?.players?.find(p => p.id === event.playerId);

          if (player) {
            const key = `${player.id}_${team.id}`;
            if (!scorerMap.has(key)) {
              scorerMap.set(key, {
                playerId: player.id,
                playerName: player.name,
                teamName: team.name,
                teamLogo: team.logo,
                goals: 0,
                jerseyNumber: player.jerseyNumber
              });
            }
            scorerMap.get(key).goals++;
          }
        }
      });
    });

    return Array.from(scorerMap.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
  }, [filteredFixtures]);

  // Calculate Top Assists
  const topAssisters = useMemo(() => {
    const assistMap = new Map();

    filteredFixtures.forEach(fixture => {
      if (!fixture.events) return;

      fixture.events.forEach(event => {
        if (event.type === 'goal' && event.assistById) {
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          const player = team?.players?.find(p => p.id === event.assistById);

          if (player) {
            const key = `${player.id}_${team.id}`;
            if (!assistMap.has(key)) {
              assistMap.set(key, {
                playerId: player.id,
                playerName: player.name,
                teamName: team.name,
                teamLogo: team.logo,
                assists: 0,
                jerseyNumber: player.jerseyNumber
              });
            }
            assistMap.get(key).assists++;
          }
        }
      });
    });

    return Array.from(assistMap.values())
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 20);
  }, [filteredFixtures]);

  // Calculate Clean Sheets (Goalkeepers)
  const cleanSheets = useMemo(() => {
    const gkMap = new Map();

    filteredFixtures.forEach(fixture => {
      // Ensure scores are numbers
      const homeScore = parseInt(fixture.homeScore) || 0;
      const awayScore = parseInt(fixture.awayScore) || 0;
      
      // Check home team
      const homeLineup = fixture.homeLineup || [];
      const homeGK = fixture.homeTeam?.players?.find(p => 
        homeLineup.includes(p.id) && p.isGoalkeeper
      );
      
      // Home team clean sheet (away score is 0)
      if (homeGK && awayScore === 0) {
        const key = `${homeGK.id}_${fixture.homeTeam.id}`;
        if (!gkMap.has(key)) {
          gkMap.set(key, {
            playerId: homeGK.id,
            playerName: homeGK.name,
            teamName: fixture.homeTeam.name,
            teamLogo: fixture.homeTeam.logo,
            cleanSheets: 0,
            appearances: 0,
            jerseyNumber: homeGK.jerseyNumber
          });
        }
        gkMap.get(key).cleanSheets++;
        gkMap.get(key).appearances++;
      } else if (homeGK) {
        const key = `${homeGK.id}_${fixture.homeTeam.id}`;
        if (!gkMap.has(key)) {
          gkMap.set(key, {
            playerId: homeGK.id,
            playerName: homeGK.name,
            teamName: fixture.homeTeam.name,
            teamLogo: fixture.homeTeam.logo,
            cleanSheets: 0,
            appearances: 0,
            jerseyNumber: homeGK.jerseyNumber
          });
        }
        gkMap.get(key).appearances++;
      }

      // Check away team
      const awayLineup = fixture.awayLineup || [];
      const awayGK = fixture.awayTeam?.players?.find(p => 
        awayLineup.includes(p.id) && p.isGoalkeeper
      );
      
      // Away team clean sheet (home score is 0)
      if (awayGK && homeScore === 0) {
        const key = `${awayGK.id}_${fixture.awayTeam.id}`;
        if (!gkMap.has(key)) {
          gkMap.set(key, {
            playerId: awayGK.id,
            playerName: awayGK.name,
            teamName: fixture.awayTeam.name,
            teamLogo: fixture.awayTeam.logo,
            cleanSheets: 0,
            appearances: 0,
            jerseyNumber: awayGK.jerseyNumber
          });
        }
        gkMap.get(key).cleanSheets++;
        gkMap.get(key).appearances++;
      } else if (awayGK) {
        const key = `${awayGK.id}_${fixture.awayTeam.id}`;
        if (!gkMap.has(key)) {
          gkMap.set(key, {
            playerId: awayGK.id,
            playerName: awayGK.name,
            teamName: fixture.awayTeam.name,
            teamLogo: fixture.awayTeam.logo,
            cleanSheets: 0,
            appearances: 0,
            jerseyNumber: awayGK.jerseyNumber
          });
        }
        gkMap.get(key).appearances++;
      }
    });

    return Array.from(gkMap.values())
      .filter(gk => gk.appearances > 0)
      .sort((a, b) => b.cleanSheets - a.cleanSheets || b.appearances - a.appearances)
      .slice(0, 20);
  }, [filteredFixtures]);

  // Calculate Disciplinary Records
  const disciplinaryRecords = useMemo(() => {
    const cardMap = new Map();

    filteredFixtures.forEach(fixture => {
      if (!fixture.events) return;

      fixture.events.forEach(event => {
        if (event.type === 'yellow_card' || event.type === 'red_card') {
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          const player = team?.players?.find(p => p.id === event.playerId);

          if (player) {
            const key = `${player.id}_${team.id}`;
            if (!cardMap.has(key)) {
              cardMap.set(key, {
                playerId: player.id,
                playerName: player.name,
                teamName: team.name,
                teamLogo: team.logo,
                yellowCards: 0,
                redCards: 0,
                jerseyNumber: player.jerseyNumber
              });
            }
            if (event.type === 'yellow_card') {
              cardMap.get(key).yellowCards++;
            } else {
              cardMap.get(key).redCards++;
            }
          }
        }
      });
    });

    return Array.from(cardMap.values())
      .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards))
      .slice(0, 20);
  }, [filteredFixtures]);

  // Get available competitions from filtered fixtures
  const availableCompetitions = useMemo(() => {
    const comps = new Set(fixtures.map(f => f.competition).filter(Boolean));
    return Array.from(comps);
  }, [fixtures]);

  // Calculate Team Statistics
  const teamStats = useMemo(() => {
    const statsMap = new Map();

    filteredFixtures.forEach(fixture => {
      const homeScore = parseInt(fixture.homeScore) || 0;
      const awayScore = parseInt(fixture.awayScore) || 0;

      // Home team stats
      if (fixture.homeTeam) {
        const homeKey = fixture.homeTeam.id;
        if (!statsMap.has(homeKey)) {
          statsMap.set(homeKey, {
            teamId: fixture.homeTeam.id,
            teamName: fixture.homeTeam.name,
            teamLogo: fixture.homeTeam.logo,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            cleanSheets: 0,
            points: 0
          });
        }
        const homeStats = statsMap.get(homeKey);
        homeStats.played++;
        homeStats.goalsFor += homeScore;
        homeStats.goalsAgainst += awayScore;
        if (awayScore === 0) homeStats.cleanSheets++;
        
        if (homeScore > awayScore) {
          homeStats.won++;
          homeStats.points += 3;
        } else if (homeScore === awayScore) {
          homeStats.drawn++;
          homeStats.points += 1;
        } else {
          homeStats.lost++;
        }
      }

      // Away team stats
      if (fixture.awayTeam) {
        const awayKey = fixture.awayTeam.id;
        if (!statsMap.has(awayKey)) {
          statsMap.set(awayKey, {
            teamId: fixture.awayTeam.id,
            teamName: fixture.awayTeam.name,
            teamLogo: fixture.awayTeam.logo,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            cleanSheets: 0,
            points: 0
          });
        }
        const awayStats = statsMap.get(awayKey);
        awayStats.played++;
        awayStats.goalsFor += awayScore;
        awayStats.goalsAgainst += homeScore;
        if (homeScore === 0) awayStats.cleanSheets++;
        
        if (awayScore > homeScore) {
          awayStats.won++;
          awayStats.points += 3;
        } else if (awayScore === homeScore) {
          awayStats.drawn++;
          awayStats.points += 1;
        } else {
          awayStats.lost++;
        }
      }
    });

    // Calculate goal difference
    return Array.from(statsMap.values()).map(team => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst
    }));
  }, [filteredFixturesForTeams]);

  // Top scoring teams
  const topScoringTeams = useMemo(() => {
    return [...teamStats]
      .filter(team => team.played > 0)
      .sort((a, b) => b.goalsFor - a.goalsFor || b.goalDifference - a.goalDifference)
      .slice(0, 10);
  }, [teamStats]);

  // Most goals conceded
  const mostGoalsConceded = useMemo(() => {
    return [...teamStats]
      .filter(team => team.played > 0)
      .sort((a, b) => b.goalsAgainst - a.goalsAgainst)
      .slice(0, 10);
  }, [teamStats]);

  // Best defense (least goals conceded)
  const bestDefense = useMemo(() => {
    return [...teamStats]
      .filter(team => team.played > 0)
      .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.cleanSheets - a.cleanSheets)
      .slice(0, 10);
  }, [teamStats]);

  // Best goal difference
  const bestGoalDifference = useMemo(() => {
    return [...teamStats]
      .filter(team => team.played > 0)
      .sort((a, b) => b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
      .slice(0, 10);
  }, [teamStats]);

  const tabs = [
    { id: 'scorers', label: t('stats.topScorers'), icon: Target, color: 'text-green-400' },
    { id: 'assists', label: t('stats.topAssists'), icon: TrendingUp, color: 'text-blue-400' },
    { id: 'cleansheets', label: t('stats.cleanSheets'), icon: Shield, color: 'text-purple-400' },
    { id: 'discipline', label: t('stats.discipline'), icon: AlertCircle, color: 'text-yellow-400' },
    { id: 'teams', label: t('stats.teamStats'), icon: BarChart3, color: 'text-orange-400' }
  ];

  const renderPlayerCard = (player, index, statKey) => {
    const isTop3 = index < 3;
    const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500';
    
    return (
      <div key={`${player.playerId}_${player.teamName}`} className="group relative hover:bg-white/[0.06] border-b border-white/5 p-3 sm:p-4 transition-all duration-500 cursor-pointer overflow-hidden flex items-center gap-3">
        {/* Rank */}
        <div className={`text-xl sm:text-2xl font-black ${rankColor} w-7 text-center flex-shrink-0`}>
          {index + 1}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {player.teamLogo && (
              <img 
                src={player.teamLogo} 
                alt={player.teamName}
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#121212] bg-white object-contain p-0.5"
              />
            )}
          </div>
          
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate text-sm sm:text-base group-hover:text-brand-purple transition-colors">
              {player.playerName}
            </h3>
            <p className="text-gray-400 text-[11px] truncate">{player.teamName}</p>
          </div>
        </div>

        {/* Stat Value */}
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-black text-white group-hover:scale-110 transition-transform duration-300">
            {player[statKey]}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">
            {statKey === 'goals' ? 'Goals' : statKey === 'assists' ? 'Assists' : 'Clean Sheets'}
          </div>
        </div>
      </div>
    );
  };

  const renderDisciplineCard = (player, index) => {
    const isTop3 = index < 3;
    const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500';

    return (
      <div key={`${player.playerId}_${player.teamName}`} className="group relative hover:bg-white/[0.06] border-b border-white/5 p-3 sm:p-4 transition-all duration-500 cursor-pointer overflow-hidden flex items-center gap-3">
        {/* Rank */}
        <div className={`text-xl sm:text-2xl font-black ${rankColor} w-7 text-center flex-shrink-0`}>
          {index + 1}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {player.teamLogo && (
              <img 
                src={player.teamLogo} 
                alt={player.teamName}
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#121212] bg-white object-contain p-0.5"
              />
            )}
          </div>
          
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate text-sm sm:text-base group-hover:text-brand-purple transition-colors">
              {player.playerName}
            </h3>
            <p className="text-gray-400 text-[11px] truncate">{player.teamName}</p>
          </div>
        </div>

        {/* Cards */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {player.yellowCards > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-3 h-4 bg-yellow-400 rounded-sm shadow-lg shadow-yellow-400/20 mb-1"></div>
              <span className="text-white font-bold text-xs">{player.yellowCards}</span>
            </div>
          )}
          {player.redCards > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-3 h-4 bg-red-500 rounded-sm shadow-lg shadow-red-500/20 mb-1"></div>
              <span className="text-white font-bold text-xs">{player.redCards}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-24 relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative w-full z-10">
        <div className="px-4 pb-4">
          <h1 className="page-header mb-2 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-brand-purple" />
            {t('stats.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            {t('stats.trackPerformance')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="relative w-full z-10 mb-8">
        <div className="px-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 text-white/80">
              <Filter className="w-4 h-4 text-brand-purple" />
              <span className="text-sm font-bold uppercase tracking-wider">{t('stats.filters')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Season Filter */}
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple/50 transition-colors"
                >
                  <option value="all" className="bg-dark-900">{t('stats.allSeasons')}</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id} className="bg-dark-900">{season.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>

              {/* Competition Filter */}
              <div className="relative">
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple/50 transition-colors"
                >
                  <option value="all" className="bg-dark-900">{t('stats.allCompetitions')}</option>
                  {availableCompetitions.map(comp => (
                    <option key={comp} value={comp} className="bg-dark-900">{comp}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-0 sm:px-6 relative z-10">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar px-6 sm:px-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all duration-300 border
                  ${isActive
                    ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="border-y sm:border border-white/5 sm:rounded-3xl overflow-hidden min-h-[400px]">
          <div className="flex flex-col">
            {/* Top Scorers */}
            {activeTab === 'scorers' && (
              <>
                {topScorers.length > 0 ? (
                  topScorers.map((player, index) => renderPlayerCard(player, index, 'goals'))
                ) : (
                  <div className="text-center py-20 px-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">{t('stats.noGoalScorers')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('stats.goalsMessage')}</p>
                  </div>
                )}
              </>
            )}

            {/* Top Assists */}
            {activeTab === 'assists' && (
              <>
                {topAssisters.length > 0 ? (
                  topAssisters.map((player, index) => renderPlayerCard(player, index, 'assists'))
                ) : (
                  <div className="text-center py-20 px-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">{t('stats.noAssists')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('stats.assistsMessage')}</p>
                  </div>
                )}
              </>
            )}

            {/* Clean Sheets */}
            {activeTab === 'cleansheets' && (
              <>
                {cleanSheets.length > 0 ? (
                  cleanSheets.map((player, index) => renderPlayerCard(player, index, 'cleanSheets'))
                ) : (
                  <div className="text-center py-20 px-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">{t('stats.noCleanSheets')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('stats.cleanSheetsMessage')}</p>
                  </div>
                )}
              </>
            )}

            {/* Discipline */}
            {activeTab === 'discipline' && (
              <>
                {disciplinaryRecords.length > 0 ? (
                  disciplinaryRecords.map((player, index) => renderDisciplineCard(player, index))
                ) : (
                  <div className="text-center py-20 px-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">{t('stats.noCards')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('stats.cardsMessage')}</p>
                  </div>
                )}
              </>
            )}

            {/* Team Stats */}
            {activeTab === 'teams' && (
              <div className="p-4 space-y-8">
                {/* Top Scoring Teams */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    {t('stats.topScoringTeams')}
                  </h3>
                  {topScoringTeams.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {topScoringTeams.slice(0, expandedTeamStats.topScoring ? 10 : 3).map((team, index) => (
                          <div
                            key={team.teamId}
                            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                              index < 3 
                                ? 'bg-green-500/10 border-green-500/20' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className={`text-base sm:text-lg font-black w-7 ${index < 3 ? 'text-green-400' : 'text-gray-500'}`}>{index + 1}</span>
                            <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={32} />
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm sm:text-base">{team.teamName}</p>
                              <p className="text-[11px] text-gray-400">{team.played} {t('stats.matches')}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-black text-green-400">{team.goalsFor}</div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t('pages.latest.goals')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {topScoringTeams.length > 3 && (
                        <button
                          onClick={() => setExpandedTeamStats(prev => ({ ...prev, topScoring: !prev.topScoring }))}
                          className="w-full mt-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-green-400 font-semibold transition-all text-sm flex items-center justify-center gap-2"
                        >
                          {expandedTeamStats.topScoring ? t('stats.showLess') : (
                            <>
                              {t('stats.seeMore')} <span className="bg-green-500/20 px-2 py-0.5 rounded text-xs">+{topScoringTeams.length - 3}</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl border border-white/5 border-dashed">
                      <p className="text-sm">{t('stats.noTeamData')}</p>
                    </div>
                  )}
                </div>

                {/* Worst Defense */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    {t('stats.mostConceded')}
                  </h3>
                  {mostGoalsConceded.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {mostGoalsConceded.slice(0, expandedTeamStats.mostConceded ? 10 : 3).map((team, index) => (
                          <div
                            key={team.teamId}
                            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                              index < 3 
                                ? 'bg-red-500/10 border-red-500/20' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className={`text-base sm:text-lg font-black w-7 ${index < 3 ? 'text-red-400' : 'text-gray-500'}`}>{index + 1}</span>
                            <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={32} />
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm sm:text-base">{team.teamName}</p>
                              <p className="text-[11px] text-gray-400">{team.played} {t('stats.matches')}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-black text-red-400">{team.goalsAgainst}</div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t('stats.conceded')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {mostGoalsConceded.length > 3 && (
                        <button
                          onClick={() => setExpandedTeamStats(prev => ({ ...prev, mostConceded: !prev.mostConceded }))}
                          className="w-full mt-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-red-400 font-semibold transition-all text-sm flex items-center justify-center gap-2"
                        >
                          {expandedTeamStats.mostConceded ? t('stats.showLess') : (
                            <>
                              {t('stats.seeMore')} <span className="bg-red-500/20 px-2 py-0.5 rounded text-xs">+{mostGoalsConceded.length - 3}</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl border border-white/5 border-dashed">
                      <p className="text-sm">{t('stats.noTeamData')}</p>
                    </div>
                  )}
                </div>

                {/* Best Defense */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    {t('stats.bestDefense')}
                  </h3>
                  {bestDefense.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {bestDefense.slice(0, expandedTeamStats.bestDefense ? 10 : 3).map((team, index) => (
                          <div
                            key={team.teamId}
                            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                              index < 3 
                                ? 'bg-blue-500/10 border-blue-500/20' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className={`text-base sm:text-lg font-black w-7 ${index < 3 ? 'text-blue-400' : 'text-gray-500'}`}>{index + 1}</span>
                            <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={32} />
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm sm:text-base">{team.teamName}</p>
                              <p className="text-[11px] text-gray-400">{team.cleanSheets} {t('stats.cleanSheets').toLowerCase()}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-black text-blue-400">{team.goalsAgainst}</div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t('stats.conceded')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {bestDefense.length > 3 && (
                        <button
                          onClick={() => setExpandedTeamStats(prev => ({ ...prev, bestDefense: !prev.bestDefense }))}
                          className="w-full mt-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 font-semibold transition-all text-sm flex items-center justify-center gap-2"
                        >
                          {expandedTeamStats.bestDefense ? t('stats.showLess') : (
                            <>
                              {t('stats.seeMore')} <span className="bg-blue-500/20 px-2 py-0.5 rounded text-xs">+{bestDefense.length - 3}</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl border border-white/5 border-dashed">
                      <p className="text-sm">{t('stats.noTeamData')}</p>
                    </div>
                  )}
                </div>

                {/* Best Goal Difference */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-400" />
                    {t('stats.bestGoalDiff')}
                  </h3>
                  {bestGoalDifference.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {bestGoalDifference.slice(0, expandedTeamStats.bestGD ? 10 : 3).map((team, index) => (
                          <div
                            key={team.teamId}
                            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                              index < 3 
                                ? 'bg-purple-500/10 border-purple-500/20' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className={`text-base sm:text-lg font-black w-7 ${index < 3 ? 'text-purple-400' : 'text-gray-500'}`}>{index + 1}</span>
                            <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={32} />
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm sm:text-base">{team.teamName}</p>
                              <p className="text-[11px] text-gray-400">{team.goalsFor} {t('stats.scored')}, {team.goalsAgainst} {t('stats.conceded')}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg sm:text-xl font-black ${team.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {team.goalDifference >= 0 ? '+' : ''}{team.goalDifference}
                              </div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">GD</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {bestGoalDifference.length > 3 && (
                        <button
                          onClick={() => setExpandedTeamStats(prev => ({ ...prev, bestGD: !prev.bestGD }))}
                          className="w-full mt-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400 font-semibold transition-all text-sm flex items-center justify-center gap-2"
                        >
                          {expandedTeamStats.bestGD ? t('stats.showLess') : (
                            <>
                              {t('stats.seeMore')} <span className="bg-purple-500/20 px-2 py-0.5 rounded text-xs">+{bestGoalDifference.length - 3}</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl border border-white/5 border-dashed">
                      <p className="text-sm">{t('stats.noTeamData')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Stats;
