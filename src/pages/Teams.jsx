import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../context/FootballContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Search, Users, MapPin, Trophy, UserPlus, UserMinus } from 'lucide-react';

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, followTeam, unfollowTeam } = useFootball();
  const { showSuccess, showError } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingLoading, setFollowingLoading] = useState({});

  const handleFollowToggle = async (e, team) => {
    e.stopPropagation(); // Prevent navigation when clicking follow button
    
    if (!user) {
      showError('Sign In Required', 'Please sign in to follow teams');
      navigate('/auth');
      return;
    }

    const isFollowing = (team.followers || []).includes(user.uid);
    
    try {
      setFollowingLoading(prev => ({ ...prev, [team.id]: true }));
      
      if (isFollowing) {
        await unfollowTeam(team.id);
        showSuccess('Unfollowed', `You unfollowed ${team.name}`);
      } else {
        await followTeam(team.id);
        showSuccess('Following', `You're now following ${team.name}!`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showError('Error', error.message || 'Failed to update follow status');
    } finally {
      setFollowingLoading(prev => ({ ...prev, [team.id]: false }));
    }
  };

  // Filter teams based on search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;

    const lowerQuery = searchQuery.toLowerCase();
    return teams.filter(team => {
      const name = team.name?.toLowerCase() || '';
      const city = team.city?.toLowerCase() || '';
      const manager = team.manager?.toLowerCase() || '';
      
      return name.includes(lowerQuery) || 
             city.includes(lowerQuery) || 
             manager.includes(lowerQuery);
    });
  }, [teams, searchQuery]);

  return (
    <div className="p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-400" />
          Teams
        </h1>
        <p className="text-gray-400">
          Browse all teams in the competition
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name, city, or manager..."
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map(team => (
            <div
              key={team.id}
              onClick={() => navigate(`/teams/${team.id}`)}
              className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-600 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Team Logo */}
                {team.logo ? (
                  <div className="w-16 h-16 bg-dark-700 rounded-lg p-2 flex items-center justify-center flex-shrink-0 group-hover:bg-dark-600 transition-colors">
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-8 h-8 text-gray-600" />
                  </div>
                )}

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {team.name}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-400">
                    {team.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{team.city}</span>
                      </div>
                    )}
                    {team.stadium && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>{team.stadium}</span>
                      </div>
                    )}
                    {team.manager && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Manager: {team.manager}</span>
                      </div>
                    )}
                  </div>

                  {/* Followers and Follow Button */}
                  <div className="mt-3 flex items-center gap-3">
                    {/* Follower count */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-dark-700 rounded text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{team.followerCount || 0} follower{(team.followerCount || 0) !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Follow button */}
                    <button
                      onClick={(e) => handleFollowToggle(e, team)}
                      disabled={followingLoading[team.id]}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                        (team.followers || []).includes(user?.uid)
                          ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {followingLoading[team.id] ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (team.followers || []).includes(user?.uid) ? (
                        <>
                          <UserMinus className="w-3 h-3" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No teams found</h3>
          <p className="text-gray-400">
            {searchQuery ? `No teams match "${searchQuery}"` : 'No teams available yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Teams;
