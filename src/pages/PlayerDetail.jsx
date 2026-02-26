import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Target,
  TrendingUp,
  Shield,
  Activity,
  Award,
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  Radio,
  Star,
  Trophy,
  Filter,
  ChevronDown,
  Share2,
  Zap,
  Heart,
  AlertTriangle
} from 'lucide-react';
import NewTeamAvatar from '../components/NewTeamAvatar';
import { teamsCollection } from '../firebase/firestore';
import { useFootball } from '../context/FootballContext';
import SurfaceCard from '../components/ui/SurfaceCard';
import BackButton from '../components/ui/BackButton';

const PlayerDetail = () => {
  const { teamId, id } = useParams();
  const navigate = useNavigate();
  const { teams, fixtures, seasons } = useFootball();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  useEffect(() => {
    loadPlayerData();
  }, [id, teamId, teams]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find the team
      let team = teams.find(t => t.id === teamId);

      // If team not found in context, try fetching it
      if (!team) {
        team = await teamsCollection.getById(teamId);
      }

      if (!team || !team.players) {
        setError('Team or player not found');
        setLoading(false);
        return;
      }

      // Find player in team's players array
      const playerData = team.players.find(p => p.id === id);

      if (!playerData) {
        setError('Player not found');
        setLoading(false);
        return;
      }

      setPlayer({ ...playerData, teamId: team.id });

      // Calculate player stats from fixtures
      const playerStats = calculatePlayerStats(id, fixtures);
      setStats(playerStats);

    } catch (err) {
      setError('Failed to load player data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate player statistics from fixtures
  const calculatePlayerStats = (playerId, fixtures) => {
    const stats = {
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0,
      cleanSheets: 0
    };

    fixtures.forEach(fixture => {
      if (!fixture.events || fixture.status !== 'completed') return;

      // Check events for this player
      fixture.events.forEach(event => {
        if (event.playerId === playerId) {
          if (event.type === 'goal') stats.goals++;
          if (event.type === 'yellow_card' || event.type === 'yellowCard') stats.yellowCards++;
          if (event.type === 'red_card' || event.type === 'redCard') stats.redCards++;
        }

        // Check for assists (stored as assistById in goal events)
        if (event.type === 'goal' && event.assistById === playerId) {
          stats.assists++;
        }
      });

      // Check if player was in lineup (lineups are arrays of player IDs)
      const homeLineup = fixture.homeLineup || [];
      const awayLineup = fixture.awayLineup || [];
      const inHomeLineup = homeLineup.includes(playerId);
      const inAwayLineup = awayLineup.includes(playerId);

      if (inHomeLineup || inAwayLineup) {
        stats.matchesPlayed++;

        // Check for clean sheet (goalkeeper only)
        if (player?.isGoalkeeper) {
          const homeScore = parseInt(fixture.homeScore) || 0;
          const awayScore = parseInt(fixture.awayScore) || 0;

          if (inHomeLineup && awayScore === 0) {
            stats.cleanSheets++;
          } else if (inAwayLineup && homeScore === 0) {
            stats.cleanSheets++;
          }
        }
      }
    });

    return stats;
  };

  // Filter fixtures by selected season
  const filteredFixtures = useMemo(() => {
    if (selectedSeason === 'all') return fixtures;
    return fixtures.filter(f => f.seasonId === selectedSeason);
  }, [fixtures, selectedSeason]);

  // Season-aware stats
  const filteredStats = useMemo(() => {
    if (!player) return null;
    return calculatePlayerStats(id, filteredFixtures);
  }, [id, filteredFixtures, player]);

  // Get available seasons for this player
  const playerSeasons = useMemo(() => {
    const seasonIds = new Set();
    fixtures.forEach(fixture => {
      if (!fixture.events || fixture.status !== 'completed') return;
      const inLineup = (fixture.homeLineup || []).includes(id) || (fixture.awayLineup || []).includes(id);
      const hadEvents = (fixture.events || []).some(e => e.playerId === id || e.assistById === id);
      if ((inLineup || hadEvents) && fixture.seasonId) {
        seasonIds.add(fixture.seasonId);
      }
    });
    return (seasons || []).filter(s => seasonIds.has(s.id));
  }, [fixtures, seasons, id]);

  // Get matches where player was in lineup or had events
  const playerMatches = useMemo(() => {
    return fixtures.filter(fixture => {
      const inLineup = (fixture.homeLineup || []).includes(id) || (fixture.awayLineup || []).includes(id);
      const hadEvents = (fixture.events || []).some(event => event.playerId === id || event.assistById === id);
      return (inLineup || hadEvents) && fixture.status === 'completed';
    }).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  }, [fixtures, id]);

  // MOTM count
  const motmCount = useMemo(() => {
    return fixtures.filter(f => f.status === 'completed' && f.manOfTheMatch === id).length;
  }, [fixtures, id]);

  // Form tracker: last 5 matches performance
  const formData = useMemo(() => {
    if (!player) return [];
    const recent = playerMatches.slice(0, 5).reverse();
    return recent.map(fixture => {
      const events = (fixture.events || []).filter(e => e.playerId === id || e.assistById === id);
      const goals = events.filter(e => e.type === 'goal' && e.playerId === id).length;
      const assists = events.filter(e => e.type === 'goal' && e.assistById === id).length;
      const yellows = events.filter(e => (e.type === 'yellow_card' || e.type === 'yellowCard') && e.playerId === id).length;
      const reds = events.filter(e => (e.type === 'red_card' || e.type === 'redCard') && e.playerId === id).length;
      // Score: goals*3 + assists*2 - yellows - reds*3, clamped 0-10
      const score = Math.max(0, Math.min(10, 5 + goals * 3 + assists * 2 - yellows - reds * 3));
      return { fixtureId: fixture.id, goals, assists, yellows, reds, score };
    });
  }, [playerMatches, id, player]);

  // Player avg rating
  const avgRating = useMemo(() => {
    const rated = fixtures.filter(f => {
      const ratings = f.playerRatings || {};
      return ratings[id] !== undefined;
    });
    if (rated.length === 0) return null;
    const total = rated.reduce((sum, f) => sum + (f.playerRatings[id] || 0), 0);
    return (total / rated.length).toFixed(1);
  }, [fixtures, id]);

  // Milestone Badges
  const milestones = useMemo(() => {
    const badges = [];
    if (!stats) return badges;
    if (stats.goals >= 100) badges.push({ label: '100+ Goals', icon: '💯', color: 'text-green-400 bg-green-500/15 border-green-500/20' });
    else if (stats.goals >= 50) badges.push({ label: '50+ Goals', icon: '🔥', color: 'text-green-400 bg-green-500/15 border-green-500/20' });
    if (stats.assists >= 50) badges.push({ label: '50+ Assists', icon: '🎯', color: 'text-blue-400 bg-blue-500/15 border-blue-500/20' });
    if (stats.matchesPlayed >= 100) badges.push({ label: '100+ Apps', icon: '⭐', color: 'text-purple-400 bg-purple-500/15 border-purple-500/20' });
    else if (stats.matchesPlayed >= 50) badges.push({ label: '50+ Apps', icon: '🏅', color: 'text-purple-400 bg-purple-500/15 border-purple-500/20' });
    if (stats.cleanSheets >= 25) badges.push({ label: '25+ Clean Sheets', icon: '🧤', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/20' });
    // Check for hat-tricks
    const hatTricks = fixtures.filter(f => {
      if (f.status !== 'completed' || !f.events) return false;
      const goals = f.events.filter(e => e.type === 'goal' && e.playerId === id).length;
      return goals >= 3;
    }).length;
    if (hatTricks > 0) badges.push({ label: `${hatTricks} Hat-trick${hatTricks > 1 ? 's' : ''}`, icon: '🎩', color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' });
    if (motmCount >= 5) badges.push({ label: `${motmCount}x MOTM`, icon: '🏆', color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' });
    return badges;
  }, [stats, fixtures, id, motmCount]);

  // Status config
  const statusConfig = {
    available: { label: 'Available', color: 'bg-green-500/15 text-green-400 border-green-500/20' },
    injured: { label: 'Injured', color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: AlertTriangle },
    suspended: { label: 'Suspended', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20', icon: AlertTriangle },
    on_loan: { label: 'On Loan', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: Share2 },
  };
  const playerStatus = statusConfig[player?.status] || statusConfig.available;

  // Share player stats
  const handleShare = async () => {
    const shareData = {
      title: `${player.name} - Player Stats`,
      text: `${player.name} | ${stats?.goals || 0} Goals, ${stats?.assists || 0} Assists in ${stats?.matchesPlayed || 0} matches | Fivescores`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        // Could show a toast here
      }
    } catch (e) { /* user cancelled */ }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get team info
  const team = player?.teamId ? teams.find(t => t.id === player.teamId) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background p-6">
        <BackButton className="mb-6" />
        <div className="text-center py-20">
          <div className="text-red-400 mb-4">❌ {error || 'Player not found'}</div>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-brand-purple text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const age = calculateAge(player.dateOfBirth);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Statistics' },
    { id: 'matches', label: 'Matches' },
    { id: 'bio', label: 'Bio & Info' }
  ];

  // Use filtered stats for display, fallback to overall
  const displayStats = filteredStats || stats;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-b from-brand-purple/20 to-background pt-safe-top pb-8 rounded-[2.5rem] overflow-hidden border-b border-white/5">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-purple via-transparent to-transparent" />

        <div className="relative px-4 sm:px-6 w-full mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8 pt-4">
            <BackButton />
            <div className="text-sm font-medium text-white/60 tracking-wider uppercase">Player Profile</div>
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Share2 className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Player Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <div className="absolute -inset-1 bg-gradient-to-br from-brand-purple to-blue-500 rounded-full opacity-50 blur-lg group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10">
                {player.photo || player.photoUrl ? (
                  <img
                    src={player.photo || player.photoUrl}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-white/5 rounded-full flex items-center justify-center ${(player.photo || player.photoUrl) ? 'hidden' : ''
                    }`}
                >
                  <User className="w-12 h-12 text-white/40" />
                </div>

                {/* Jersey Number Badge */}
                {player.jerseyNumber && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-purple rounded-full flex items-center justify-center border-4 border-background shadow-lg">
                    <span className="text-sm font-bold text-white">{player.jerseyNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{player.name}</h1>
            <div className="flex items-center gap-1.5 text-white/60 mb-3 text-sm flex-wrap justify-center">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm">
                {player.position || 'Player'}
              </span>
              {player.status && player.status !== 'available' && (
                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1 ${playerStatus.color}`}>
                  {playerStatus.icon && <playerStatus.icon className="w-3 h-3" />}
                  {playerStatus.label}
                </span>
              )}
              {team && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1">
                    <NewTeamAvatar team={team} size={14} />
                    <span className="text-xs sm:text-sm">{team.name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-md mx-auto">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider">Age</div>
                <div className="text-sm font-semibold text-white">{age || '-'}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider">Height</div>
                <div className="text-sm font-semibold text-white">{player.height ? `${player.height}cm` : '-'}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider">Foot</div>
                <div className="text-sm font-semibold text-white capitalize">{player.preferredFoot || '-'}</div>
              </div>
            </div>

            {/* MOTM & Rating Badges */}
            {(motmCount > 0 || avgRating) && (
              <div className="flex items-center justify-center gap-3 mt-3">
                {motmCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/20">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{motmCount} MOTM</span>
                  </div>
                )}
                {avgRating && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/20">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">{avgRating} Avg</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 mb-6">
        <div className="tab-nav flex overflow-x-auto hide-scrollbar max-w-7xl mx-auto px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'}
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full mx-auto px-0 sm:px-6 space-y-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Form Tracker */}
            {formData.length > 0 && (
              <div className="px-4 sm:px-0">
                <SurfaceCard className="p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-purple" />
                    Recent Form
                  </h3>
                  <div className="flex items-end justify-center gap-2 h-20">
                    {formData.map((match, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-[9px] text-white/40 font-medium">
                          {match.goals > 0 && <span className="text-green-400">{match.goals}G </span>}
                          {match.assists > 0 && <span className="text-blue-400">{match.assists}A</span>}
                          {match.goals === 0 && match.assists === 0 && '-'}
                        </div>
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${match.score >= 7 ? 'bg-green-500' :
                            match.score >= 5 ? 'bg-yellow-500' :
                              match.score >= 3 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                          style={{ height: `${Math.max(8, match.score * 6)}px` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-white/30">Oldest</span>
                    <span className="text-[9px] text-white/30">Latest</span>
                  </div>
                </SurfaceCard>
              </div>
            )}

            {/* Key Performance Indicators */}
            {displayStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-4 sm:px-0">
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                    <Target className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">{displayStats.goals}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Goals</div>
                </SurfaceCard>

                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">{displayStats.assists}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Assists</div>
                </SurfaceCard>

                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mb-1">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">{displayStats.matchesPlayed}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Matches</div>
                </SurfaceCard>

                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">
                    {displayStats.goals > 0 ? Math.round((displayStats.matchesPlayed * 90) / displayStats.goals) : '-'}
                  </div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Mins / Goal</div>
                </SurfaceCard>

                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mb-1">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">
                    {displayStats.assists > 0 ? Math.round((displayStats.matchesPlayed * 90) / displayStats.assists) : '-'}
                  </div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Mins / Assist</div>
                </SurfaceCard>

                {player.isGoalkeeper ? (
                  <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center mb-1">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold text-white mb-0.5">{displayStats.cleanSheets}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Clean Sheets</div>
                  </SurfaceCard>
                ) : (
                  <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
                      <div className="w-3 h-4 bg-yellow-500 rounded-sm" />
                    </div>
                    <div className="text-lg font-bold text-white mb-0.5">{displayStats.yellowCards}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Cards</div>
                  </SurfaceCard>
                )}
              </div>
            )}

            {/* Current Team Card */}
            {team && (
              <div className="px-4 sm:px-0">
                <SurfaceCard
                  className="p-0 overflow-hidden group cursor-pointer rounded-2xl"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <NewTeamAvatar team={team} size={40} className="rounded-xl" />
                      <div>
                        <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Current Team</div>
                        <div className="text-sm font-semibold text-white group-hover:text-brand-purple transition-colors">
                          {team.name}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </SurfaceCard>
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && displayStats && (
          <div className="space-y-4 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Season Selector */}
            {playerSeasons.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand-purple" />
                    <span className="text-sm text-white font-medium">
                      {selectedSeason === 'all' ? 'All Seasons' : playerSeasons.find(s => s.id === selectedSeason)?.name || 'All Seasons'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showSeasonDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showSeasonDropdown && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl bg-elevated border border-white/10 shadow-2xl overflow-hidden">
                    <button
                      onClick={() => { setSelectedSeason('all'); setShowSeasonDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedSeason === 'all' ? 'bg-brand-purple/20 text-white' : 'text-white/70 hover:bg-white/5'
                        }`}
                    >
                      All Seasons
                    </button>
                    {playerSeasons.map(season => (
                      <button
                        key={season.id}
                        onClick={() => { setSelectedSeason(season.id); setShowSeasonDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedSeason === season.id ? 'bg-brand-purple/20 text-white' : 'text-white/70 hover:bg-white/5'
                          }`}
                      >
                        {season.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <SurfaceCard className="p-4 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-purple" />
                Detailed Statistics
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-lg bg-white/10 flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-white/60" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/80">Matches Played</span>
                  </div>
                  <span className="text-base font-semibold text-white">{displayStats.matchesPlayed}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Target className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/80">Goals Scored</span>
                  </div>
                  <span className="text-base font-semibold text-green-400">{displayStats.goals}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/80">Assists</span>
                  </div>
                  <span className="text-base font-semibold text-blue-400">{displayStats.assists}</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Discipline
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center text-center">
                  <div className="w-5 h-7 bg-yellow-500 rounded mb-2 shadow-lg shadow-yellow-500/20" />
                  <div className="text-lg font-bold text-white mb-0.5">{displayStats.yellowCards}</div>
                  <div className="text-[10px] text-white/50 uppercase">Yellow Cards</div>
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center text-center">
                  <div className="w-5 h-7 bg-red-500 rounded mb-2 shadow-lg shadow-red-500/20" />
                  <div className="text-lg font-bold text-white mb-0.5">{displayStats.redCards}</div>
                  <div className="text-[10px] text-white/50 uppercase">Red Cards</div>
                </div>
              </div>

              {/* Fair Play Meter */}
              <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-white/80 text-xs sm:text-sm">Fair Play Score</span>
                  <Award className="w-4 h-4 text-brand-purple" />
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-purple to-blue-500 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.max(0, Math.min(100, 100 - (displayStats.yellowCards * 5 + displayStats.redCards * 15)))}%`
                    }}
                  />
                </div>
                <div className="text-[10px] text-white/40 mt-1 text-right">
                  Based on disciplinary record
                </div>
              </div>
            </SurfaceCard>

            {/* Goals Timeline - when in a match do goals happen */}
            {displayStats.goals > 0 && (() => {
              const timeBuckets = { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 };
              fixtures.forEach(f => {
                if (f.status !== 'completed' || !f.events) return;
                f.events.forEach(e => {
                  if (e.type === 'goal' && e.playerId === id && e.minute) {
                    const m = parseInt(e.minute);
                    if (m <= 15) timeBuckets['0-15']++;
                    else if (m <= 30) timeBuckets['16-30']++;
                    else if (m <= 45) timeBuckets['31-45']++;
                    else if (m <= 60) timeBuckets['46-60']++;
                    else if (m <= 75) timeBuckets['61-75']++;
                    else timeBuckets['76-90']++;
                  }
                });
              });
              const maxBucket = Math.max(...Object.values(timeBuckets), 1);
              return (
                <SurfaceCard className="p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-purple" />
                    Goal Timing
                  </h3>
                  <div className="flex items-end gap-1.5 h-24">
                    {Object.entries(timeBuckets).map(([bucket, count]) => (
                      <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[9px] text-white/60 font-medium">{count}</div>
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-brand-purple to-blue-500 transition-all duration-700"
                          style={{ height: `${Math.max(4, (count / maxBucket) * 80)}px` }}
                        />
                        <div className="text-[8px] text-white/30">{bucket}'</div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              );
            })()}

            {/* Head-to-Head Opponents */}
            {(() => {
              const opponentStats = {};
              playerMatches.forEach(fixture => {
                const isHome = (fixture.homeLineup || []).includes(id) || fixture.homeTeamId === teamId;
                const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
                const oppName = opponent?.name || 'Unknown';
                if (!opponentStats[oppName]) opponentStats[oppName] = { goals: 0, assists: 0, matches: 0, team: opponent };
                opponentStats[oppName].matches++;
                const events = (fixture.events || []).filter(e => e.playerId === id || e.assistById === id);
                opponentStats[oppName].goals += events.filter(e => e.type === 'goal' && e.playerId === id).length;
                opponentStats[oppName].assists += events.filter(e => e.type === 'goal' && e.assistById === id).length;
              });
              const sorted = Object.entries(opponentStats).sort((a, b) => (b[1].goals + b[1].assists) - (a[1].goals + a[1].assists)).slice(0, 5);
              if (sorted.length === 0) return null;
              return (
                <SurfaceCard className="p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-purple" />
                    vs Opponents
                  </h3>
                  <div className="space-y-2">
                    {sorted.map(([name, data]) => (
                      <div key={name} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          {data.team && <NewTeamAvatar team={data.team} size={20} />}
                          <span className="text-xs text-white/80">{name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-green-400 font-bold">{data.goals}G</span>
                          <span className="text-blue-400 font-bold">{data.assists}A</span>
                          <span className="text-white/30">{data.matches} gm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              );
            })()}

            {/* Advanced Metrics */}
            <SurfaceCard className="p-4 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-purple" />
                Advanced Metrics
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                  <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Goals / 90</div>
                  <div className="text-sm font-bold text-white">
                    {displayStats.matchesPlayed > 0 ? (displayStats.goals / displayStats.matchesPlayed).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                  <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Assists / 90</div>
                  <div className="text-sm font-bold text-white">
                    {displayStats.matchesPlayed > 0 ? (displayStats.assists / displayStats.matchesPlayed).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                  <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">G+A Total</div>
                  <div className="text-sm font-bold text-white">{displayStats.goals + displayStats.assists}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                  <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">G+A / 90</div>
                  <div className="text-sm font-bold text-white">
                    {displayStats.matchesPlayed > 0 ? ((displayStats.goals + displayStats.assists) / displayStats.matchesPlayed).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </SurfaceCard>

            {/* Compare Button */}
            <button
              onClick={() => navigate('/compare')}
              className="w-full p-3 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-sm font-medium hover:bg-brand-purple/20 transition-colors flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Compare with other players
            </button>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {playerMatches.length > 0 ? (
              playerMatches.map((fixture) => {
                const isHome = (fixture.homeLineup || []).includes(id) || fixture.homeTeamId === teamId;
                const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
                const playerTeam = isHome ? fixture.homeTeam : fixture.awayTeam;

                const playerEvents = (fixture.events || []).filter(e => e.playerId === id || e.assistById === id);
                const goals = playerEvents.filter(e => e.type === 'goal' && e.playerId === id).length;
                const assists = playerEvents.filter(e => e.type === 'goal' && e.assistById === id).length;
                const yellows = playerEvents.filter(e => (e.type === 'yellow_card' || e.type === 'yellowCard') && e.playerId === id).length;
                const reds = playerEvents.filter(e => (e.type === 'red_card' || e.type === 'redCard') && e.playerId === id).length;

                return (
                  <SurfaceCard
                    key={fixture.id}
                    className="p-4 rounded-2xl cursor-pointer hover:border-white/10 transition-colors"
                    onClick={() => navigate(`/fixtures/${fixture.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">
                        {new Date(fixture.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex gap-1.5">
                        {goals > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                            {goals} G
                          </div>
                        )}
                        {assists > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                            {assists} A
                          </div>
                        )}
                        {yellows > 0 && <div className="w-2.5 h-3.5 bg-yellow-500 rounded-sm" />}
                        {reds > 0 && <div className="w-2.5 h-3.5 bg-red-500 rounded-sm" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <NewTeamAvatar team={playerTeam} size={32} />
                        <div className="flex flex-col">
                          <span className="text-white font-semibold text-sm">{fixture.homeScore} - {fixture.awayScore}</span>
                          <span className="text-[10px] text-white/40">vs {opponent?.name}</span>
                        </div>
                        <NewTeamAvatar team={opponent} size={32} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </SurfaceCard>
                );
              })
            ) : (
              <div className="text-center py-12 text-white/40">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No match data available for this player</p>
              </div>
            )}
          </div>
        )}

        {/* BIO TAB */}
        {activeTab === 'bio' && (
          <div className="space-y-4 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Bio Narrative */}
            {player.bio && (
              <SurfaceCard className="p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-brand-purple" />
                  About
                </h3>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{player.bio}</p>
              </SurfaceCard>
            )}

            {/* Milestone Badges */}
            {milestones.length > 0 && (
              <SurfaceCard className="p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-purple" />
                  Milestones
                </h3>
                <div className="flex flex-wrap gap-2">
                  {milestones.map((badge, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            )}

            <SurfaceCard className="p-4 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-purple" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Date of Birth"
                  value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  }) : null}
                />

                <InfoItem
                  icon={<MapPin className="w-4 h-4" />}
                  label="Place of Birth"
                  value={player.placeOfBirth}
                />

                <InfoItem
                  icon={<User className="w-4 h-4" />}
                  label="Nationality"
                  value={player.nationality}
                />

                <InfoItem
                  icon={<Activity className="w-4 h-4" />}
                  label="Height"
                  value={player.height ? `${player.height} cm` : null}
                />

                <InfoItem
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Preferred Foot"
                  value={player.preferredFoot ? (player.preferredFoot.charAt(0).toUpperCase() + player.preferredFoot.slice(1)) : null}
                />

                <InfoItem
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Market Value"
                  value={player.marketValue}
                />

                <InfoItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Contract Until"
                  value={player.contractExpiry ? new Date(player.contractExpiry).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long'
                  }) : null}
                />
              </div>
            </SurfaceCard>

            {/* Position Map */}
            <SurfaceCard className="p-4 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-purple" />
                Position Map
              </h3>
              <div className="relative w-full aspect-[3/4] max-w-xs mx-auto">
                {/* Pitch SVG */}
                <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Pitch background */}
                  <rect x="0" y="0" width="200" height="280" rx="8" fill="rgba(22,163,74,0.15)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  {/* Center line */}
                  <line x1="0" y1="140" x2="200" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  {/* Center circle */}
                  <circle cx="100" cy="140" r="25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <circle cx="100" cy="140" r="2" fill="rgba(255,255,255,0.1)" />
                  {/* Goal areas */}
                  <rect x="55" y="0" width="90" height="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <rect x="70" y="0" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <rect x="55" y="240" width="90" height="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <rect x="70" y="262" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                </svg>
                {/* Position marker */}
                {(() => {
                  const pos = (player.position || '').toUpperCase();
                  let x = 50, y = 50;
                  if (pos.includes('GK') || pos === 'GOALKEEPER') { x = 50; y = 90; }
                  else if (pos.includes('CB') || pos === 'CENTRE-BACK' || pos === 'CENTER BACK') { x = 50; y = 78; }
                  else if (pos.includes('LB') || pos === 'LEFT-BACK' || pos === 'LEFT BACK') { x = 15; y = 72; }
                  else if (pos.includes('RB') || pos === 'RIGHT-BACK' || pos === 'RIGHT BACK') { x = 85; y = 72; }
                  else if (pos.includes('DEF') || pos === 'DEFENDER') { x = 50; y = 75; }
                  else if (pos.includes('CDM') || pos.includes('DM') || pos === 'DEFENSIVE MIDFIELDER') { x = 50; y = 62; }
                  else if (pos.includes('CM') || pos === 'MIDFIELDER' || pos === 'MIDFIELD') { x = 50; y = 50; }
                  else if (pos.includes('LM') || pos === 'LEFT MIDFIELDER') { x = 15; y = 50; }
                  else if (pos.includes('RM') || pos === 'RIGHT MIDFIELDER') { x = 85; y = 50; }
                  else if (pos.includes('CAM') || pos.includes('AM') || pos === 'ATTACKING MIDFIELDER') { x = 50; y = 38; }
                  else if (pos.includes('LW') || pos === 'LEFT WING' || pos === 'LEFT WINGER') { x = 15; y = 30; }
                  else if (pos.includes('RW') || pos === 'RIGHT WING' || pos === 'RIGHT WINGER') { x = 85; y = 30; }
                  else if (pos.includes('ST') || pos.includes('CF') || pos === 'STRIKER' || pos === 'FORWARD' || pos === 'CENTER FORWARD') { x = 50; y = 20; }
                  return (
                    <div
                      className="absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div className="absolute inset-0 bg-brand-purple/30 rounded-full animate-ping" />
                      <div className="relative w-8 h-8 bg-brand-purple rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg shadow-brand-purple/30">
                        <span className="text-[9px] font-bold text-white">{player.jerseyNumber || '?'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="text-center mt-2 text-[10px] text-white/40">{player.position || 'Unknown'}</div>
            </SurfaceCard>

            {/* Related Players - Teammates */}
            {team && team.players && team.players.length > 1 && (
              <SurfaceCard className="p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-purple" />
                  Teammates
                </h3>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {team.players
                    .filter(p => p.id !== id)
                    .slice(0, 8)
                    .map(teammate => (
                      <div
                        key={teammate.id}
                        className="flex-shrink-0 w-20 text-center cursor-pointer group"
                        onClick={() => navigate(`/teams/${team.id}/players/${teammate.id}`)}
                      >
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 mx-auto mb-1.5 flex items-center justify-center overflow-hidden group-hover:border-brand-purple/40 transition-colors">
                          {teammate.photo ? (
                            <img src={teammate.photo} alt={teammate.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-white/40">{teammate.jerseyNumber}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/70 font-medium truncate">{teammate.name}</div>
                        <div className="text-[9px] text-white/30 truncate">{teammate.position}</div>
                      </div>
                    ))}
                </div>
              </SurfaceCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5">
    <div className="mt-0.5 text-white/40">{icon}</div>
    <div>
      <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-white text-sm font-medium">{value || <span className="text-white/20">Not specified</span>}</div>
    </div>
  </div>
);

export default PlayerDetail;
