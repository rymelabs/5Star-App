import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import NewTeamAvatar from '../components/NewTeamAvatar';
import { teamsCollection } from '../firebase/firestore';
import { useFootball } from '../context/FootballContext';
import SurfaceCard from '../components/ui/SurfaceCard';
import BackButton from '../components/ui/BackButton';

const PlayerDetail = () => {
  const { teamId, id } = useParams();
  const navigate = useNavigate();
  const { teams, fixtures } = useFootball();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
    { id: 'bio', label: 'Bio & Info' }
  ];

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
            <div className="w-9" /> {/* Spacer for balance */}
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
                  className={`w-full h-full bg-white/5 rounded-full flex items-center justify-center ${
                    (player.photo || player.photoUrl) ? 'hidden' : ''
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
            <div className="flex items-center gap-1.5 text-white/60 mb-5 text-sm">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm">
                {player.position || 'Player'}
              </span>
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
            {/* Key Performance Indicators */}
            {stats && (
              <div className="grid grid-cols-2 gap-2 px-4 sm:px-0">
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                    <Target className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">{stats.goals}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Goals</div>
                </SurfaceCard>
                
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">{stats.assists}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Assists</div>
                </SurfaceCard>

                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mb-1">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-white mb-0.5">{stats.matchesPlayed}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Matches</div>
                </SurfaceCard>

                {player.position === 'GK' ? (
                  <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mb-1">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="text-lg font-bold text-white mb-0.5">{stats.cleanSheets}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Clean Sheets</div>
                  </SurfaceCard>
                ) : (
                  <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
                      <div className="w-3 h-4 bg-yellow-500 rounded-sm" />
                    </div>
                    <div className="text-lg font-bold text-white mb-0.5">{stats.yellowCards}</div>
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
        {activeTab === 'stats' && stats && (
          <div className="space-y-4 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  <span className="text-base font-semibold text-white">{stats.matchesPlayed}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Target className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/80">Goals Scored</span>
                  </div>
                  <span className="text-base font-semibold text-green-400">{stats.goals}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/80">Assists</span>
                  </div>
                  <span className="text-base font-semibold text-blue-400">{stats.assists}</span>
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
                  <div className="text-lg font-bold text-white mb-0.5">{stats.yellowCards}</div>
                  <div className="text-[10px] text-white/50 uppercase">Yellow Cards</div>
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center text-center">
                  <div className="w-5 h-7 bg-red-500 rounded mb-2 shadow-lg shadow-red-500/20" />
                  <div className="text-lg font-bold text-white mb-0.5">{stats.redCards}</div>
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
                      width: `${Math.max(0, Math.min(100, 100 - (stats.yellowCards * 5 + stats.redCards * 15)))}%`
                    }}
                  />
                </div>
                <div className="text-[10px] text-white/40 mt-1 text-right">
                  Based on disciplinary record
                </div>
              </div>
            </SurfaceCard>
          </div>
        )}

        {/* BIO TAB */}
        {activeTab === 'bio' && (
          <div className="space-y-4 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
