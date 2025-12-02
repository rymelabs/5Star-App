import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Filter, ChevronDown, ChevronUp, Trophy, Users, TrendingUp, Target, Shield, AlertCircle, X, Check } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useCompetitions } from '../context/CompetitionsContext';
import { useLanguage } from '../context/LanguageContext';
import NewTeamAvatar from '../components/NewTeamAvatar';

const Stats = () => {
  const { fixtures, teams, activeSeason, seasons, leagues } = useFootball();
  const { competitions } = useCompetitions();
  const { t } = useLanguage();
  const [statsFilter, setStatsFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('scorers');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedTeamStats, setExpandedTeamStats] = useState({
    topScoring: false,
    bestDefense: false,
    bestGD: false,
    mostConceded: false
  });

  // Helper function to get competition/group name for a fixture
  const getFixtureGroupName = (fixture) => {
    // Check for friendly first
    if (fixture.type === 'friendly' || fixture.competition?.toLowerCase().includes('friendly')) {
      return 'Friendly Matches';
    }
    
    // Check for season
    if (fixture.seasonId) {
      const season = seasons?.find(s => s.id === fixture.seasonId);
      return season?.name || fixture.competition || 'Season';
    }
    
    // Check for league
    if (fixture.leagueId) {
      const league = leagues?.find(l => l.id === fixture.leagueId);
      return league?.name || fixture.competition || 'League';
    }
    
    // Check for competition
    if (fixture.competitionId || fixture.competition) {
      const comp = competitions?.find(c => c.id === fixture.competitionId);
      return comp?.name || fixture.competition || 'Competition';
    }
    
    return 'Other Matches';
  };

  // Helper to get group type for styling
  const getGroupType = (fixture) => {
    if (fixture.type === 'friendly' || fixture.competition?.toLowerCase().includes('friendly')) return 'friendly';
    if (fixture.seasonId) return 'season';
    if (fixture.leagueId) return 'league';
    if (fixture.competitionId || fixture.competition) return 'competition';
    return 'other';
  };

  // Filter options for stats
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'season', label: 'Seasons' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'competition', label: 'Competitions' },
    { id: 'league', label: 'League' }
  ];

  // Filter fixtures based on selected filter (for player stats - requires events)
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(fixture => {
      const isCompleted = fixture.status === 'completed';
      if (!isCompleted || !fixture.events) return false;
      
      if (statsFilter === 'all') return true;
      // Seasons: fixtures that belong to a season (tournament format)
      if (statsFilter === 'season') return Boolean(fixture.seasonId);
      // Friendly: fixtures with no seasonId, no leagueId, and no competitionId (or type is 'friendly')
      if (statsFilter === 'friendly') {
        return fixture.type === 'friendly' || 
               fixture.competition?.toLowerCase().includes('friendly') ||
               (!fixture.seasonId && !fixture.leagueId && !fixture.competitionId);
      }
      // Competition: fixtures that have a competition name but are NOT season or league
      if (statsFilter === 'competition') {
        return Boolean(fixture.competitionId || (fixture.competition && !fixture.seasonId && !fixture.leagueId && fixture.type !== 'friendly'));
      }
      // League: fixtures that belong to a league
      if (statsFilter === 'league') return Boolean(fixture.leagueId);
      return true;
    });
  }, [fixtures, statsFilter]);

  // Filter fixtures for team stats (requires completed status and scores)
  const filteredFixturesForTeams = useMemo(() => {
    return fixtures.filter(fixture => {
      const isCompleted = fixture.status === 'completed';
      if (!isCompleted) return false;
      
      if (statsFilter === 'all') return true;
      // Seasons: fixtures that belong to a season (tournament format)
      if (statsFilter === 'season') return Boolean(fixture.seasonId);
      // Friendly: fixtures with no seasonId, no leagueId, and no competitionId (or type is 'friendly')
      if (statsFilter === 'friendly') {
        return fixture.type === 'friendly' || 
               fixture.competition?.toLowerCase().includes('friendly') ||
               (!fixture.seasonId && !fixture.leagueId && !fixture.competitionId);
      }
      // Competition: fixtures that have a competition name but are NOT season or league
      if (statsFilter === 'competition') {
        return Boolean(fixture.competitionId || (fixture.competition && !fixture.seasonId && !fixture.leagueId && fixture.type !== 'friendly'));
      }
      // League: fixtures that belong to a league
      if (statsFilter === 'league') return Boolean(fixture.leagueId);
      return true;
    });
  }, [fixtures, statsFilter]);

  // Calculate Top Scorers (Players) - Grouped by competition
  const topScorersGrouped = useMemo(() => {
    const groupedScorers = new Map();

    filteredFixtures.forEach(fixture => {
      if (!fixture.events) return;
      
      const groupName = getFixtureGroupName(fixture);
      const groupType = getGroupType(fixture);

      fixture.events.forEach(event => {
        if (event.type === 'goal') {
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          const player = team?.players?.find(p => p.id === event.playerId);

          if (player) {
            if (!groupedScorers.has(groupName)) {
              groupedScorers.set(groupName, { type: groupType, players: new Map() });
            }
            
            const key = `${player.id}_${team.id}`;
            const group = groupedScorers.get(groupName);
            
            if (!group.players.has(key)) {
              group.players.set(key, {
                playerId: player.id,
                playerName: player.name,
                teamName: team.name,
                teamLogo: team.logo,
                goals: 0,
                jerseyNumber: player.jerseyNumber
              });
            }
            group.players.get(key).goals++;
          }
        }
      });
    });

    // Convert to sorted array format
    const result = [];
    groupedScorers.forEach((data, groupName) => {
      const players = Array.from(data.players.values())
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10);
      if (players.length > 0) {
        result.push({ groupName, type: data.type, players });
      }
    });

    // Sort groups: seasons first, then leagues, then competitions, then friendly
    const typeOrder = { season: 0, league: 1, competition: 2, friendly: 3, other: 4 };
    return result.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }, [filteredFixtures, seasons, leagues, competitions]);

  // Calculate Top Assists - Grouped by competition
  const topAssistersGrouped = useMemo(() => {
    const groupedAssisters = new Map();

    filteredFixtures.forEach(fixture => {
      if (!fixture.events) return;
      
      const groupName = getFixtureGroupName(fixture);
      const groupType = getGroupType(fixture);

      fixture.events.forEach(event => {
        if (event.type === 'goal' && event.assistById) {
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          const player = team?.players?.find(p => p.id === event.assistById);

          if (player) {
            if (!groupedAssisters.has(groupName)) {
              groupedAssisters.set(groupName, { type: groupType, players: new Map() });
            }
            
            const key = `${player.id}_${team.id}`;
            const group = groupedAssisters.get(groupName);
            
            if (!group.players.has(key)) {
              group.players.set(key, {
                playerId: player.id,
                playerName: player.name,
                teamName: team.name,
                teamLogo: team.logo,
                assists: 0,
                jerseyNumber: player.jerseyNumber
              });
            }
            group.players.get(key).assists++;
          }
        }
      });
    });

    const result = [];
    groupedAssisters.forEach((data, groupName) => {
      const players = Array.from(data.players.values())
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 10);
      if (players.length > 0) {
        result.push({ groupName, type: data.type, players });
      }
    });

    const typeOrder = { season: 0, league: 1, competition: 2, friendly: 3, other: 4 };
    return result.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }, [filteredFixtures, seasons, leagues, competitions]);

  // Calculate Clean Sheets (Goalkeepers) - Grouped by competition
  const cleanSheetsGrouped = useMemo(() => {
    const groupedGKs = new Map();

    filteredFixtures.forEach(fixture => {
      const homeScore = parseInt(fixture.homeScore) || 0;
      const awayScore = parseInt(fixture.awayScore) || 0;
      
      const groupName = getFixtureGroupName(fixture);
      const groupType = getGroupType(fixture);
      
      if (!groupedGKs.has(groupName)) {
        groupedGKs.set(groupName, { type: groupType, players: new Map() });
      }
      const group = groupedGKs.get(groupName);
      
      // Check home team
      const homeLineup = fixture.homeLineup || [];
      const homeGK = fixture.homeTeam?.players?.find(p => 
        homeLineup.includes(p.id) && p.isGoalkeeper
      );
      
      if (homeGK) {
        const key = `${homeGK.id}_${fixture.homeTeam.id}`;
        if (!group.players.has(key)) {
          group.players.set(key, {
            playerId: homeGK.id,
            playerName: homeGK.name,
            teamName: fixture.homeTeam.name,
            teamLogo: fixture.homeTeam.logo,
            cleanSheets: 0,
            appearances: 0,
            jerseyNumber: homeGK.jerseyNumber
          });
        }
        group.players.get(key).appearances++;
        if (awayScore === 0) group.players.get(key).cleanSheets++;
      }

      // Check away team
      const awayLineup = fixture.awayLineup || [];
      const awayGK = fixture.awayTeam?.players?.find(p => 
        awayLineup.includes(p.id) && p.isGoalkeeper
      );
      
      if (awayGK) {
        const key = `${awayGK.id}_${fixture.awayTeam.id}`;
        if (!group.players.has(key)) {
          group.players.set(key, {
            playerId: awayGK.id,
            playerName: awayGK.name,
            teamName: fixture.awayTeam.name,
            teamLogo: fixture.awayTeam.logo,
            cleanSheets: 0,
            appearances: 0,
            jerseyNumber: awayGK.jerseyNumber
          });
        }
        group.players.get(key).appearances++;
        if (homeScore === 0) group.players.get(key).cleanSheets++;
      }
    });

    const result = [];
    groupedGKs.forEach((data, groupName) => {
      const players = Array.from(data.players.values())
        .filter(gk => gk.appearances > 0)
        .sort((a, b) => b.cleanSheets - a.cleanSheets || b.appearances - a.appearances)
        .slice(0, 10);
      if (players.length > 0) {
        result.push({ groupName, type: data.type, players });
      }
    });

    const typeOrder = { season: 0, league: 1, competition: 2, friendly: 3, other: 4 };
    return result.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }, [filteredFixtures, seasons, leagues, competitions]);

  // Calculate Disciplinary Records - Grouped by competition
  const disciplinaryGrouped = useMemo(() => {
    const groupedCards = new Map();

    filteredFixtures.forEach(fixture => {
      if (!fixture.events) return;
      
      const groupName = getFixtureGroupName(fixture);
      const groupType = getGroupType(fixture);

      fixture.events.forEach(event => {
        if (event.type === 'yellow_card' || event.type === 'red_card') {
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          const player = team?.players?.find(p => p.id === event.playerId);

          if (player) {
            if (!groupedCards.has(groupName)) {
              groupedCards.set(groupName, { type: groupType, players: new Map() });
            }
            
            const key = `${player.id}_${team.id}`;
            const group = groupedCards.get(groupName);
            
            if (!group.players.has(key)) {
              group.players.set(key, {
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
              group.players.get(key).yellowCards++;
            } else {
              group.players.get(key).redCards++;
            }
          }
        }
      });
    });

    const result = [];
    groupedCards.forEach((data, groupName) => {
      const players = Array.from(data.players.values())
        .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards))
        .slice(0, 10);
      if (players.length > 0) {
        result.push({ groupName, type: data.type, players });
      }
    });

    const typeOrder = { season: 0, league: 1, competition: 2, friendly: 3, other: 4 };
    return result.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }, [filteredFixtures, seasons, leagues, competitions]);

  // Get available competitions from filtered fixtures
  const availableCompetitions = useMemo(() => {
    const comps = new Set(fixtures.map(f => f.competition).filter(Boolean));
    return Array.from(comps);
  }, [fixtures]);

  // Calculate Team Statistics - Grouped by competition
  const teamStatsGrouped = useMemo(() => {
    const groupedStats = new Map();

    filteredFixturesForTeams.forEach(fixture => {
      const homeScore = parseInt(fixture.homeScore) || 0;
      const awayScore = parseInt(fixture.awayScore) || 0;
      
      const groupName = getFixtureGroupName(fixture);
      const groupType = getGroupType(fixture);
      
      if (!groupedStats.has(groupName)) {
        groupedStats.set(groupName, { type: groupType, teams: new Map() });
      }
      const group = groupedStats.get(groupName);

      // Home team stats
      if (fixture.homeTeam) {
        const homeKey = fixture.homeTeam.id;
        if (!group.teams.has(homeKey)) {
          group.teams.set(homeKey, {
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
        const homeStats = group.teams.get(homeKey);
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
        if (!group.teams.has(awayKey)) {
          group.teams.set(awayKey, {
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
        const awayStats = group.teams.get(awayKey);
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

    // Convert to sorted array format with calculated goal difference
    const result = [];
    groupedStats.forEach((data, groupName) => {
      const teams = Array.from(data.teams.values())
        .map(team => ({ ...team, goalDifference: team.goalsFor - team.goalsAgainst }))
        .filter(team => team.played > 0);
      if (teams.length > 0) {
        result.push({ groupName, type: data.type, teams });
      }
    });

    const typeOrder = { season: 0, league: 1, competition: 2, friendly: 3, other: 4 };
    return result.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }, [filteredFixturesForTeams, seasons, leagues, competitions]);

  // Get group type colors
  const getGroupTypeColor = (type) => {
    switch (type) {
      case 'season': return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: Trophy };
      case 'league': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: BarChart3 };
      case 'competition': return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: Target };
      case 'friendly': return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: Users };
      default: return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', icon: BarChart3 };
    }
  };

  const tabs = [
    { id: 'scorers', label: t('stats.topScorers'), icon: Target, color: 'text-green-400' },
    { id: 'assists', label: t('stats.topAssists'), icon: TrendingUp, color: 'text-blue-400' },
    { id: 'cleansheets', label: t('stats.cleanSheets'), icon: Shield, color: 'text-purple-400' },
    { id: 'discipline', label: t('stats.discipline'), icon: AlertCircle, color: 'text-yellow-400' },
    { id: 'teams', label: t('stats.teamStats'), icon: BarChart3, color: 'text-orange-400' }
  ];

  const renderPlayerCard = (player, index, statKey, isInGroup = false) => {
    const isTop3 = index < 3;
    const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500';
    
    return (
      <div key={`${player.playerId}_${player.teamName}_${index}`} className={`group relative hover:bg-white/[0.06] border-b border-white/5 p-3 sm:p-4 transition-all duration-500 cursor-pointer overflow-hidden flex items-center gap-3 ${isInGroup ? 'pl-4' : ''}`}>
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

  const renderDisciplineCard = (player, index, isInGroup = false) => {
    const isTop3 = index < 3;
    const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500';

    return (
      <div key={`${player.playerId}_${player.teamName}_${index}`} className={`group relative hover:bg-white/[0.06] border-b border-white/5 p-3 sm:p-4 transition-all duration-500 cursor-pointer overflow-hidden flex items-center gap-3 ${isInGroup ? 'pl-4' : ''}`}>
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

  // Render a collapsible group header
  const renderGroupHeader = (groupName, type, playerCount, tabKey) => {
    const colors = getGroupTypeColor(type);
    const Icon = colors.icon;
    const isExpanded = expandedGroups[`${tabKey}_${groupName}`] !== false; // Default to expanded
    
    return (
      <button
        onClick={() => setExpandedGroups(prev => ({
          ...prev,
          [`${tabKey}_${groupName}`]: !isExpanded
        }))}
        className={`w-full flex items-center justify-between p-4 ${colors.bg} border-b ${colors.border} hover:bg-white/5 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div className="text-left">
            <h3 className={`font-bold ${colors.text}`}>{groupName}</h3>
            <p className="text-xs text-gray-500">{playerCount} player{playerCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-5 h-5 ${colors.text}`} />
        </motion.div>
      </button>
    );
  };

  // Check if a group is expanded
  const isGroupExpanded = (tabKey, groupName) => {
    return expandedGroups[`${tabKey}_${groupName}`] !== false;
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
        <div className="px-4 pb-4 flex items-start justify-between">
          <div>
            <h1 className="page-header mb-2 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-brand-purple" />
              {t('stats.title')}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed">
              {t('stats.trackPerformance')}
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-brand-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 px-4 mb-6 overflow-hidden"
          >
            <div className="bg-black border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Show Stats From</h4>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setStatsFilter(option.id);
                      setShowFilters(false);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statsFilter === option.id
                        ? 'bg-brand-purple text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {topScorersGrouped.length > 0 ? (
                  topScorersGrouped.map(group => (
                    <div key={group.groupName}>
                      {renderGroupHeader(group.groupName, group.type, group.players.length, 'scorers')}
                      <AnimatePresence>
                        {isGroupExpanded('scorers', group.groupName) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {group.players.map((player, index) => renderPlayerCard(player, index, 'goals', true))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
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
                {topAssistersGrouped.length > 0 ? (
                  topAssistersGrouped.map(group => (
                    <div key={group.groupName}>
                      {renderGroupHeader(group.groupName, group.type, group.players.length, 'assists')}
                      <AnimatePresence>
                        {isGroupExpanded('assists', group.groupName) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {group.players.map((player, index) => renderPlayerCard(player, index, 'assists', true))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
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
                {cleanSheetsGrouped.length > 0 ? (
                  cleanSheetsGrouped.map(group => (
                    <div key={group.groupName}>
                      {renderGroupHeader(group.groupName, group.type, group.players.length, 'cleansheets')}
                      <AnimatePresence>
                        {isGroupExpanded('cleansheets', group.groupName) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {group.players.map((player, index) => renderPlayerCard(player, index, 'cleanSheets', true))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
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
                {disciplinaryGrouped.length > 0 ? (
                  disciplinaryGrouped.map(group => (
                    <div key={group.groupName}>
                      {renderGroupHeader(group.groupName, group.type, group.players.length, 'discipline')}
                      <AnimatePresence>
                        {isGroupExpanded('discipline', group.groupName) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {group.players.map((player, index) => renderDisciplineCard(player, index, true))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
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
              <div className="p-4 space-y-6">
                {teamStatsGrouped.length > 0 ? (
                  teamStatsGrouped.map(group => {
                    const colors = getGroupTypeColor(group.type);
                    const Icon = colors.icon;
                    const isExpanded = expandedGroups[`teams_${group.groupName}`] !== false;
                    
                    // Sort teams for different categories within this group
                    const topScoring = [...group.teams].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5);
                    const bestDefenseTeams = [...group.teams].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5);
                    const bestGD = [...group.teams].sort((a, b) => b.goalDifference - a.goalDifference).slice(0, 5);
                    
                    return (
                      <div key={group.groupName} className={`rounded-2xl border ${colors.border} overflow-hidden`}>
                        {/* Group Header */}
                        <button
                          onClick={() => setExpandedGroups(prev => ({
                            ...prev,
                            [`teams_${group.groupName}`]: !isExpanded
                          }))}
                          className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:bg-white/5 transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div className="text-left">
                              <h3 className={`font-bold text-lg ${colors.text}`}>{group.groupName}</h3>
                              <p className="text-xs text-gray-500">{group.teams.length} team{group.teams.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                          </motion.div>
                        </button>
                        
                        {/* Group Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-black/30 p-4 space-y-6"
                            >
                              {/* Top Scoring */}
                              <div>
                                <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                                  <Target className="w-4 h-4" /> Top Scoring
                                </h4>
                                <div className="space-y-2">
                                  {topScoring.map((team, index) => (
                                    <div key={team.teamId} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                      <span className={`text-sm font-bold w-5 ${index < 3 ? 'text-green-400' : 'text-gray-500'}`}>{index + 1}</span>
                                      <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={24} />
                                      <span className="flex-1 text-sm text-white truncate">{team.teamName}</span>
                                      <span className="text-green-400 font-bold">{team.goalsFor}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Best Defense */}
                              <div>
                                <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                                  <Shield className="w-4 h-4" /> Best Defense
                                </h4>
                                <div className="space-y-2">
                                  {bestDefenseTeams.map((team, index) => (
                                    <div key={team.teamId} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                      <span className={`text-sm font-bold w-5 ${index < 3 ? 'text-blue-400' : 'text-gray-500'}`}>{index + 1}</span>
                                      <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={24} />
                                      <span className="flex-1 text-sm text-white truncate">{team.teamName}</span>
                                      <span className="text-blue-400 font-bold">{team.goalsAgainst}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Best Goal Difference */}
                              <div>
                                <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                  <Trophy className="w-4 h-4" /> Best Goal Difference
                                </h4>
                                <div className="space-y-2">
                                  {bestGD.map((team, index) => (
                                    <div key={team.teamId} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                      <span className={`text-sm font-bold w-5 ${index < 3 ? 'text-purple-400' : 'text-gray-500'}`}>{index + 1}</span>
                                      <NewTeamAvatar team={{ id: team.teamId, name: team.teamName, logo: team.teamLogo }} size={24} />
                                      <span className="flex-1 text-sm text-white truncate">{team.teamName}</span>
                                      <span className={`font-bold ${team.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {team.goalDifference >= 0 ? '+' : ''}{team.goalDifference}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 px-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">{t('stats.noTeamData')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Stats;
