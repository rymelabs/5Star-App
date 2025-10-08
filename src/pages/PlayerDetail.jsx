import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Target, 
  TrendingUp, 
  Shield, 
  Heart,
  Activity,
  Award,
  AlertCircle,
  Clock
} from 'lucide-react';
import TeamAvatar from '../components/TeamAvatar';
import { teamsCollection, fixturesCollection } from '../firebase/firestore';
import { useFootball } from '../context/FootballContext';

const PlayerDetail = () => {
  const { teamId, id } = useParams();
  const navigate = useNavigate();
  const { teams, fixtures } = useFootball();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.error('Error loading player:', err);
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
      <div className="p-6 pb-24">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading player...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="p-6 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <div className="text-center py-20">
          <div className="text-red-400 mb-4">❌ {error || 'Player not found'}</div>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const age = calculateAge(player.dateOfBirth);

  return (
    <div className="p-6 pb-24">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {/* Player Profile Card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Player Photo */}
          <div className="w-32 h-32 flex-shrink-0">
            {player.photo || player.photoUrl ? (
              <img
                src={player.photo || player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover rounded-xl border-2 border-primary-500"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center ${
                (player.photo || player.photoUrl) ? 'hidden' : ''
              }`}
            >
              <User className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{player.name}</h1>
                <p className="text-gray-400">{player.position || 'Player'}</p>
              </div>
              {player.jerseyNumber && (
                <div className="w-16 h-16 bg-dark-800 border-2 border-primary-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-400">#{player.jerseyNumber}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {age && (
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Age</div>
                  <div className="text-lg font-semibold text-white">{age} years</div>
                </div>
              )}
              {player.nationality && (
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Nationality</div>
                  <div className="text-lg font-semibold text-white">{player.nationality}</div>
                </div>
              )}
              {player.height && (
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Height</div>
                  <div className="text-lg font-semibold text-white">{player.height} cm</div>
                </div>
              )}
              {player.preferredFoot && (
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Foot</div>
                  <div className="text-lg font-semibold text-white capitalize">{player.preferredFoot}</div>
                </div>
              )}
            </div>

            {/* Team Link */}
            {team && (
              <button
                onClick={() => navigate(`/teams/${team.id}`)}
                className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors w-full md:w-auto"
              >
                <TeamAvatar name={team.name} logo={team.logo} size={32} className="rounded-full" />
                <div className="text-left">
                  <div className="text-xs text-gray-400">Current Team</div>
                  <div className="font-medium text-white">{team.name}</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Performance Stats */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              Performance Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-gray-300">Matches Played</span>
                </div>
                <span className="text-xl font-bold text-white">{stats.matchesPlayed}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-300">Goals</span>
                </div>
                <span className="text-xl font-bold text-green-400">{stats.goals}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-gray-300">Assists</span>
                </div>
                <span className="text-xl font-bold text-purple-400">{stats.assists}</span>
              </div>

              {player.position === 'GK' && (
                <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-gray-300">Clean Sheets</span>
                  </div>
                  <span className="text-xl font-bold text-cyan-400">{stats.cleanSheets}</span>
                </div>
              )}
            </div>
          </div>

          {/* Disciplinary Records */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Disciplinary Record
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-8 bg-yellow-500 rounded"></div>
                  </div>
                  <span className="text-gray-300">Yellow Cards</span>
                </div>
                <span className="text-xl font-bold text-yellow-400">{stats.yellowCards}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-8 bg-red-500 rounded"></div>
                  </div>
                  <span className="text-gray-300">Red Cards</span>
                </div>
                <span className="text-xl font-bold text-red-400">{stats.redCards}</span>
              </div>

              {/* Fair Play Score */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Fair Play Score</span>
                  <Award className="w-4 h-4 text-blue-400" />
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, 100 - (stats.yellowCards * 5 + stats.redCards * 15)))}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {stats.yellowCards === 0 && stats.redCards === 0 ? 'Perfect discipline!' : 'Based on disciplinary record'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-400" />
          Additional Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Date of Birth</div>
              <div className="text-white">
                {player.dateOfBirth
                  ? new Date(player.dateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <User className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Place of Birth</div>
              <div className="text-white">
                {player.placeOfBirth || <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <User className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Nationality</div>
              <div className="text-white">
                {player.nationality || <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <Activity className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Height</div>
              <div className="text-white">
                {player.height ? `${player.height} cm` : <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <Activity className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Preferred Foot</div>
              <div className="text-white capitalize">
                {player.preferredFoot || <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <TrendingUp className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Market Value</div>
              <div className="text-white">
                {player.marketValue || <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
            <Clock className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <div className="text-xs text-gray-400">Contract Until</div>
              <div className="text-white">
                {player.contractExpiry
                  ? new Date(player.contractExpiry).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })
                  : <span className="text-gray-500">Not specified</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
