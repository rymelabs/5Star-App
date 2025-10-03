import React, { useState, useMemo } from 'react';
import { useFootball } from '../context/FootballContext';
import { useCompetitions } from '../context/CompetitionsContext';
import { Trophy, Target, Users, Shield, AlertCircle, TrendingUp, Filter } from 'lucide-react';

const Stats = () => {
  const { fixtures, teams, activeSeason, seasons } = useFootball();
  const { competitions } = useCompetitions();
  const [selectedSeason, setSelectedSeason] = useState(activeSeason || 'all');
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [activeTab, setActiveTab] = useState('scorers');

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
      // Check home team
      const homeLineup = fixture.homeLineup || [];
      const homeGK = fixture.homeTeam?.players?.find(p => 
        homeLineup.includes(p.id) && p.isGoalkeeper
      );
      
      if (homeGK && fixture.awayScore === 0) {
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
      
      if (awayGK && fixture.homeScore === 0) {
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

  const tabs = [
    { id: 'scorers', label: 'Top Scorers', icon: Target, color: 'text-green-400' },
    { id: 'assists', label: 'Top Assists', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'cleansheets', label: 'Clean Sheets', icon: Shield, color: 'text-purple-400' },
    { id: 'discipline', label: 'Discipline', icon: AlertCircle, color: 'text-yellow-400' }
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
            <span className="text-2xl">{medals[index]}</span>
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
          <div className="text-2xl font-bold text-white">{statValue}</div>
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
    <div className="p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-purple-400" />
          Player Statistics
        </h1>
        <p className="text-gray-400">
          Track top performers across all competitions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-gray-300">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Season Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Seasons</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>

          {/* Competition Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Competition</label>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Competitions</option>
              {availableCompetitions.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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

      {/* Stats Content */}
      <div className="space-y-3">
        {/* Top Scorers */}
        {activeTab === 'scorers' && (
          <>
            {topScorers.length > 0 ? (
              topScorers.map((player, index) => renderPlayerCard(player, index, 'goals'))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No goal scorers found</p>
                <p className="text-sm mt-1">Goals will appear here once matches are completed</p>
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
                <p>No assists found</p>
                <p className="text-sm mt-1">Assists will appear here once matches are completed</p>
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
                <p>No clean sheets found</p>
                <p className="text-sm mt-1">Clean sheets will appear here once matches are completed</p>
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
                <p>No cards issued yet</p>
                <p className="text-sm mt-1">Yellow and red cards will appear here once issued</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;
