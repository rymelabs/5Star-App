import React, { useState, useMemo } from 'react';
import { useFootball } from '../context/FootballContext';
import { useCompetitions } from '../context/CompetitionsContext';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, Target, Users, Shield, AlertCircle, TrendingUp, Filter, BarChart3 } from 'lucide-react';

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

  // Filter fixtures based on selected filters
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(fixture => {
      const isCompleted = fixture.status === 'completed';
      const matchesSeason = selectedSeason === 'all' || fixture.season === selectedSeason;
      const matchesCompetition = selectedCompetition === 'all' || fixture.competition === selectedCompetition;
      return isCompleted && matchesSeason && matchesCompetition && fixture.events;
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
  }, [filteredFixtures]);

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

  const renderPlayerCard = (player, index, stat) => {
    const statValue = player[stat];
    const isTopThree = index < 3;
    const medals = ['🥇', '🥈', '🥉'];

    return (
      <div
        key={`${player.playerId}_${player.teamName}`}
        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
          isTopThree ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/20 border-2 border-purple-500/30' : 'bg-dark-800'
        }`}
      >
        {/* Rank */}
        <div className="w-8 text-center flex-shrink-0">
          {isTopThree ? (
            <span className="text-lg">{medals[index]}</span>
          ) : (
            <span className="text-gray-400 font-semibold">{index + 1}</span>
          )}
        </div>

        {/* Jersey Number */}
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {player.jerseyNumber || '?'}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{player.playerName}</div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {player.teamLogo && player.teamLogo.trim() && (
              <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="truncate">{player.teamName}</span>
          </div>
        </div>

        {/* Stat Value */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-white">{statValue}</div>
          {stat === 'cleanSheets' && player.appearances && (
            <div className="text-xs text-gray-400">{player.appearances} apps</div>
          )}
        </div>
      </div>
    );
  };

  const renderDisciplineCard = (player, index) => {
    const totalPoints = player.redCards * 2 + player.yellowCards;
    const isTopThree = index < 3;

    return (
      <div
        key={`${player.playerId}_${player.teamName}`}
        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
          isTopThree ? 'bg-gradient-to-r from-red-900/20 to-yellow-900/20 border-2 border-red-500/30' : 'bg-dark-800'
        }`}
      >
        {/* Rank */}
        <div className="w-8 text-center flex-shrink-0">
          <span className={`${isTopThree ? 'text-red-400' : 'text-gray-400'} font-semibold`}>
            {index + 1}
          </span>
        </div>

        {/* Jersey Number */}
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {player.jerseyNumber || '?'}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{player.playerName}</div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {player.teamLogo && player.teamLogo.trim() && (
              <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="truncate">{player.teamName}</span>
          </div>
        </div>

        {/* Cards */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {player.yellowCards > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
              <span className="text-white font-semibold">{player.yellowCards}</span>
            </div>
          )}
          {player.redCards > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
              <span className="text-white font-semibold">{player.redCards}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 pb-24 lg:px-6">
      <div className="stats-bento-grid">
        <section className="bento-section stats-header">
          <div>
            <h1 className="page-header mb-2 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-purple-400" />
              {t('stats.title')}
            </h1>
            <p className="text-gray-400">
              {t('stats.trackPerformance')}
            </p>
          </div>
        </section>

        <section className="bento-section stats-filters">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 h-full">
            <div className="flex items-center gap-2 mb-3 text-gray-300">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">{t('stats.filters')}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Season Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('stats.season')}</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t('stats.allSeasons')}</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>{season.name}</option>
                  ))}
                </select>
              </div>

              {/* Competition Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('stats.competition')}</label>
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t('stats.allCompetitions')}</option>
                  {availableCompetitions.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="bento-section stats-tabs">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bento-section stats-content">
          <div className="space-y-3">
        {/* Top Scorers */}
        {activeTab === 'scorers' && (
          <>
            {topScorers.length > 0 ? (
              topScorers.map((player, index) => renderPlayerCard(player, index, 'goals'))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('stats.noGoalScorers')}</p>
                <p className="text-sm mt-1">{t('stats.goalsMessage')}</p>
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
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('stats.noAssists')}</p>
                <p className="text-sm mt-1">{t('stats.assistsMessage')}</p>
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
              <div className="text-center py-12 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('stats.noCleanSheets')}</p>
                <p className="text-sm mt-1">{t('stats.cleanSheetsMessage')}</p>
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
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('stats.noCards')}</p>
                <p className="text-sm mt-1">{t('stats.cardsMessage')}</p>
              </div>
            )}
          </>
        )}

        {/* Team Stats */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* Top Scoring Teams */}
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                {t('stats.topScoringTeams')}
              </h3>
              {topScoringTeams.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {topScoringTeams.slice(0, expandedTeamStats.topScoring ? 10 : 3).map((team, index) => (
                      <div
                        key={team.teamId}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border-2 border-green-500/30' : 'bg-dark-800'
                        }`}
                      >
                        <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                        {team.teamLogo && team.teamLogo.trim() && (
                          <img src={team.teamLogo} alt={team.teamName} className="w-8 h-8 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{team.teamName}</p>
                          <p className="text-xs text-gray-400">{team.played} {t('stats.matches')}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{team.goalsFor}</div>
                          <div className="text-xs text-gray-400">{t('pages.latest.goals')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {topScoringTeams.length > 3 && (
                    <button
                      onClick={() => setExpandedTeamStats(prev => ({ ...prev, topScoring: !prev.topScoring }))}
                      className="w-full mt-3 py-2 text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
                    >
                      {expandedTeamStats.topScoring ? t('stats.showLess') : `${t('stats.seeMore')} (${topScoringTeams.length - 3} ${t('stats.more')})`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">{t('stats.noTeamData')}</p>
                </div>
              )}
            </div>

            {/* Best Defense */}
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                {t('stats.bestDefense')}
              </h3>
              {bestDefense.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {bestDefense.slice(0, expandedTeamStats.bestDefense ? 10 : 3).map((team, index) => (
                      <div
                        key={team.teamId}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/20 border-2 border-blue-500/30' : 'bg-dark-800'
                        }`}
                      >
                        <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                        {team.teamLogo && team.teamLogo.trim() && (
                          <img src={team.teamLogo} alt={team.teamName} className="w-8 h-8 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{team.teamName}</p>
                          <p className="text-xs text-gray-400">{team.cleanSheets} {t('stats.cleanSheets').toLowerCase()}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">{team.goalsAgainst}</div>
                          <div className="text-xs text-gray-400">{t('stats.conceded')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {bestDefense.length > 3 && (
                    <button
                      onClick={() => setExpandedTeamStats(prev => ({ ...prev, bestDefense: !prev.bestDefense }))}
                      className="w-full mt-3 py-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      {expandedTeamStats.bestDefense ? t('stats.showLess') : `${t('stats.seeMore')} (${bestDefense.length - 3} ${t('stats.more')})`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">{t('stats.noTeamData')}</p>
                </div>
              )}
            </div>

            {/* Best Goal Difference */}
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                {t('stats.bestGoalDiff')}
              </h3>
              {bestGoalDifference.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {bestGoalDifference.slice(0, expandedTeamStats.bestGD ? 10 : 3).map((team, index) => (
                      <div
                        key={team.teamId}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/20 border-2 border-purple-500/30' : 'bg-dark-800'
                        }`}
                      >
                        <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                        {team.teamLogo && team.teamLogo.trim() && (
                          <img src={team.teamLogo} alt={team.teamName} className="w-8 h-8 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{team.teamName}</p>
                          <p className="text-xs text-gray-400">{team.goalsFor} {t('stats.scored')}, {team.goalsAgainst} {t('stats.conceded')}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${team.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {team.goalDifference >= 0 ? '+' : ''}{team.goalDifference}
                          </div>
                          <div className="text-xs text-gray-400">GD</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {bestGoalDifference.length > 3 && (
                    <button
                      onClick={() => setExpandedTeamStats(prev => ({ ...prev, bestGD: !prev.bestGD }))}
                      className="w-full mt-3 py-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      {expandedTeamStats.bestGD ? t('stats.showLess') : `${t('stats.seeMore')} (${bestGoalDifference.length - 3} ${t('stats.more')})`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">{t('stats.noTeamData')}</p>
                </div>
              )}
            </div>

            {/* Worst Defense */}
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                {t('stats.mostConceded')}
              </h3>
              {mostGoalsConceded.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {mostGoalsConceded.slice(0, expandedTeamStats.mostConceded ? 10 : 3).map((team, index) => (
                      <div
                        key={team.teamId}
                        className="flex items-center gap-4 p-4 rounded-lg bg-dark-800"
                      >
                        <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                        {team.teamLogo && team.teamLogo.trim() && (
                          <img src={team.teamLogo} alt={team.teamName} className="w-8 h-8 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{team.teamName}</p>
                          <p className="text-xs text-gray-400">{team.played} {t('stats.matches')}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-400">{team.goalsAgainst}</div>
                          <div className="text-xs text-gray-400">{t('stats.conceded')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {mostGoalsConceded.length > 3 && (
                    <button
                      onClick={() => setExpandedTeamStats(prev => ({ ...prev, mostConceded: !prev.mostConceded }))}
                      className="w-full mt-3 py-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      {expandedTeamStats.mostConceded ? t('stats.showLess') : `${t('stats.seeMore')} (${mostGoalsConceded.length - 3} ${t('stats.more')})`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">{t('stats.noTeamData')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  </div>
  );
};

export default Stats;
