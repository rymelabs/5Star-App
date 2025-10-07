import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../context/FootballContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Users, MapPin, Trophy, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { teamsCollection } from '../firebase/firestore';
import { addCalendarRemindersForTeam, removeCalendarRemindersForTeam } from '../services/calendarReminderService';

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, followTeam, unfollowTeam, fixtures } = useFootball();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingLoading, setFollowingLoading] = useState({});
  
  // Pagination state
  const [paginatedTeams, setPaginatedTeams] = useState([]);
  const [teamsLastDoc, setTeamsLastDoc] = useState(null);
  const [hasMoreTeams, setHasMoreTeams] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  // Calculate how many items fit on screen (estimate based on viewport height)
  // Each team card is approximately 140px tall with gap
  const itemsPerPage = Math.max(12, Math.ceil(window.innerHeight / 140) * 2);
  
  // Intersection observer for infinite scroll
  const observerRef = useRef(null);
  const loadMoreRef = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreTeams && !searchQuery) {
        loadMoreTeams();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMoreTeams, searchQuery]);
  
  // Load initial teams
  useEffect(() => {
    if (!initialLoaded) {
      loadInitialTeams();
    }
  }, []);
  
  const loadInitialTeams = async () => {
    try {
      const { teams: newTeams, lastDoc, hasMore } = await teamsCollection.getPaginated(itemsPerPage);
      setPaginatedTeams(newTeams);
      setTeamsLastDoc(lastDoc);
      setHasMoreTeams(hasMore);
      setInitialLoaded(true);
    } catch (error) {
      console.error('Error loading initial teams:', error);
      setInitialLoaded(true);
    }
  };
  
  const loadMoreTeams = async () => {
    if (!hasMoreTeams || loadingMore || !teamsLastDoc) return;
    
    setLoadingMore(true);
    try {
      const { teams: newTeams, lastDoc, hasMore } = await teamsCollection.getPaginated(itemsPerPage, teamsLastDoc);
      setPaginatedTeams(prev => [...prev, ...newTeams]);
      setTeamsLastDoc(lastDoc);
      setHasMoreTeams(hasMore);
    } catch (error) {
      console.error('Error loading more teams:', error);
    } finally {
      setLoadingMore(false);
    }
  };

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
        
        // Remove calendar reminders for this team
        removeCalendarRemindersForTeam(team.id, fixtures);
        
        showSuccess('Unfollowed', `You unfollowed ${team.name}`);
      } else {
        await followTeam(team.id);
        
        // Get user notification settings
        const savedSettings = localStorage.getItem('userSettings');
        let notificationSettings = {
          upcomingMatches: true,
          teamFollowing: true
        };
        
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            notificationSettings = parsed.notifications || notificationSettings;
          } catch (error) {
            console.error('Error parsing settings:', error);
          }
        }
        
        // Add calendar reminders if notifications are enabled
        if (notificationSettings.upcomingMatches && notificationSettings.teamFollowing) {
          const addedCount = await addCalendarRemindersForTeam(team.id, fixtures, notificationSettings);
          
          if (addedCount > 0) {
            showSuccess(
              'Following with Reminders!', 
              `You're now following ${team.name}! ${addedCount} upcoming match${addedCount > 1 ? 'es' : ''} added to your calendar.`
            );
          } else {
            showSuccess('Following', `You're now following ${team.name}!`);
          }
        } else {
          showSuccess('Following', `You're now following ${team.name}!`);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showError('Error', error.message || 'Failed to update follow status');
    } finally {
      setFollowingLoading(prev => ({ ...prev, [team.id]: false }));
    }
  };

  // Filter teams based on search query - use context teams for search, paginated for normal view
  const filteredTeams = useMemo(() => {
    // If user is searching, use context teams (already loaded in memory)
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      return teams.filter(team => {
        const name = team.name?.toLowerCase() || '';
        const city = team.city?.toLowerCase() || '';
        const manager = team.manager?.toLowerCase() || '';
        
        return name.includes(lowerQuery) || 
               city.includes(lowerQuery) || 
               manager.includes(lowerQuery);
      });
    }
    
    // Otherwise, use paginated teams
    return paginatedTeams;
  }, [teams, paginatedTeams, searchQuery]);

  return (
    <div className="p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-header mb-2 flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-400" />
          {t('pages.teams.title')}
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
            placeholder={t('pages.teams.searchTeams')}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTeams.map((team, idx) => (
              <div
                key={team.id || team.teamId || `${team.name || 'team'}_${idx}`}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="bg-dark-800 border border-dark-700 rounded-lg p-3 hover:border-primary-600 hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  {/* Team Logo */}
                  {team.logo ? (
                    <div className="w-12 h-12 bg-dark-700 rounded-md p-1.5 flex items-center justify-center flex-shrink-0 group-hover:bg-dark-600 transition-colors">
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-dark-700 rounded-md flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-gray-600" />
                    </div>
                  )}

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-primary-400 transition-colors">
                      {team.name}
                    </h3>

                    <div className="space-y-0.5 text-xs text-gray-400">
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
          
          {/* Infinite Scroll Trigger - Only show when not searching */}
          {!searchQuery && hasMoreTeams && (
            <div ref={loadMoreRef} className="py-8 text-center">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2 text-primary-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{t('common.loadingMore')} {t('navigation.teams').toLowerCase()}...</span>
                </div>
              ) : (
                <button
                  onClick={loadMoreTeams}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Load More Teams
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">{t('pages.teams.noTeamsFound')}</h3>
          <p className="text-gray-400">
            {searchQuery ? `No teams match "${searchQuery}"` : 'No teams available yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Teams;
