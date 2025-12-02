import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, MapPin, Trophy, UserPlus, UserMinus, Loader2, ChevronRight } from 'lucide-react';
import NewTeamAvatar from '../components/NewTeamAvatar';
import AuthPromptModal from '../components/AuthPromptModal';
import SurfaceCard from '../components/ui/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { useFootball } from '../context/FootballContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import useAuthGate from '../hooks/useAuthGate';
import { teamsCollection } from '../firebase/firestore';
import { addCalendarRemindersForTeam, removeCalendarRemindersForTeam } from '../services/calendarReminderService';
import { getCachedItem, setCachedItem } from '../utils/cache';

const TEAMS_CACHE_KEY = 'cache:teams-page';

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') {
      const nanos = typeof value.nanoseconds === 'number' ? value.nanoseconds / 1e6 : 0;
      return value.seconds * 1000 + nanos;
    }
  }
  return null;
};

const serializeTimestamp = (value) => {
  const millis = toMillis(value);
  return typeof millis === 'number' ? new Date(millis).toISOString() : null;
};

const sanitizeTeams = (teams = []) => teams.map((team) => {
  const sanitized = { ...team };
  delete sanitized._doc;
  if (sanitized.updatedAt) {
    sanitized.updatedAt = serializeTimestamp(sanitized.updatedAt) || sanitized.updatedAt;
  }
  if (sanitized.createdAt) {
    sanitized.createdAt = serializeTimestamp(sanitized.createdAt) || sanitized.createdAt;
  }
  return sanitized;
});

const computeLatestTimestamp = (teams = []) => {
  return teams.reduce((acc, team) => {
    const timestamp = toMillis(team.updatedAt) || toMillis(team.createdAt);
    if (typeof timestamp === 'number' && timestamp > acc) {
      return timestamp;
    }
    return acc;
  }, 0);
};

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, followTeam, unfollowTeam, fixtures } = useFootball();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingLoading, setFollowingLoading] = useState({});
  const { requireAuth, authPromptProps } = useAuthGate({
    title: 'Sign in to follow teams',
    message: 'Follow clubs to unlock match alerts, personalized notifications, and synced favorites across every device.',
    confirmText: 'Sign in to follow',
    cancelText: 'Maybe later'
  });
  
  // Pagination state
  const [paginatedTeams, setPaginatedTeams] = useState([]);
  const [teamsLastDoc, setTeamsLastDoc] = useState(null);
  const [hasMoreTeams, setHasMoreTeams] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const cachedCursorIdRef = useRef(null);
  
  // Calculate how many items fit on screen (estimate based on viewport height)
  // Each team card is approximately 140px tall with gap
  const itemsPerPage = Math.max(12, Math.ceil(window.innerHeight / 140) * 2);

  const persistTeamsCache = useCallback((teamsList, hasMoreValue, lastDocValue) => {
    const latestUpdatedAt = computeLatestTimestamp(teamsList);
    setCachedItem(TEAMS_CACHE_KEY, {
      teams: teamsList,
      hasMore: hasMoreValue,
      lastDocId: lastDocValue || null,
      latestUpdatedAt
    });
  }, []);

  const hydrateTeamsFromCache = useCallback((cache) => {
    setPaginatedTeams(cache.teams || []);
    setHasMoreTeams(cache.hasMore ?? true);
    cachedCursorIdRef.current = cache.lastDocId || null;
    setInitialLoaded(true);
  }, []);

  const rehydrateCursorFromCache = useCallback(async (cache) => {
    if (!cache?.lastDocId || teamsLastDoc) return;
    const snapshot = await teamsCollection.getDocSnapshot(cache.lastDocId);
    if (snapshot) {
      setTeamsLastDoc(snapshot);
    }
  }, [teamsLastDoc]);

  const loadInitialTeams = useCallback(async () => {
    try {
      const { teams: newTeams, lastDoc, hasMore } = await teamsCollection.getPaginated(itemsPerPage);
      const sanitizedTeams = sanitizeTeams(newTeams);
      setPaginatedTeams(sanitizedTeams);
      setTeamsLastDoc(lastDoc);
      setHasMoreTeams(hasMore);
      setInitialLoaded(true);
      const lastDocId = lastDoc?.id || null;
      cachedCursorIdRef.current = lastDocId;
      persistTeamsCache(sanitizedTeams, hasMore, lastDocId);
    } catch (error) {
      console.error('Error loading initial teams:', error);
      setInitialLoaded(true);
    }
  }, [itemsPerPage, persistTeamsCache]);

  useEffect(() => {
    let isMounted = true;
    const cached = getCachedItem(TEAMS_CACHE_KEY);
    if (cached?.teams?.length) {
      hydrateTeamsFromCache(cached);
      rehydrateCursorFromCache(cached);
    }

    const checkFreshnessAndLoad = async () => {
      if (!cached?.teams?.length) {
        await loadInitialTeams();
        return;
      }

      try {
        const latestRemote = await teamsCollection.getLatestUpdatedAt();
        if (!isMounted) return;
        const cachedTimestamp = cached.latestUpdatedAt || 0;
        if (!latestRemote || latestRemote <= cachedTimestamp) {
          return;
        }
        await loadInitialTeams();
      } catch (error) {
        console.error('Error validating teams cache:', error);
      }
    };

    checkFreshnessAndLoad();

    return () => {
      isMounted = false;
    };
  }, [hydrateTeamsFromCache, loadInitialTeams, rehydrateCursorFromCache]);

  const loadMoreTeams = useCallback(async () => {
    if (!hasMoreTeams || loadingMore) return;

    setLoadingMore(true);
    try {
      let cursor = teamsLastDoc;
      if (!cursor && cachedCursorIdRef.current) {
        cursor = await teamsCollection.getDocSnapshot(cachedCursorIdRef.current);
        if (cursor) {
          setTeamsLastDoc(cursor);
        }
      }

      if (!cursor) {
        return;
      }

      const { teams: newTeams, lastDoc, hasMore } = await teamsCollection.getPaginated(itemsPerPage, cursor);
      const sanitizedTeams = sanitizeTeams(newTeams);
      const lastDocId = lastDoc?.id || cachedCursorIdRef.current;
      setPaginatedTeams(prev => {
        const merged = [...prev, ...sanitizedTeams];
        cachedCursorIdRef.current = lastDocId || null;
        persistTeamsCache(merged, hasMore, cachedCursorIdRef.current);
        return merged;
      });
      setTeamsLastDoc(lastDoc);
      setHasMoreTeams(hasMore);
    } catch (error) {
      console.error('Error loading more teams:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreTeams, loadingMore, teamsLastDoc, itemsPerPage, persistTeamsCache]);

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
  }, [loadingMore, hasMoreTeams, searchQuery, loadMoreTeams]);

  const handleFollowToggle = async (e, team) => {
    e.stopPropagation(); // Prevent navigation when clicking follow button
    
    if (!requireAuth()) {
      return;
    }

    if (!user) {
      showError('Please try again', 'Your account is still loading. Please retry in a moment.');
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

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
        {/* Header Skeleton */}
        <div className="relative px-4 sm:px-6 pt-12 pb-8 text-center z-10 flex flex-col items-center">
          <div className="h-12 w-64 bg-white/10 rounded-full animate-pulse mb-6" />
          <div className="h-4 w-96 max-w-full bg-white/5 rounded-full animate-pulse" />
        </div>

        {/* Search Skeleton */}
        <div className="px-4 sm:px-6 mb-12">
          <div className="max-w-2xl mx-auto h-16 bg-white/5 rounded-2xl animate-pulse" />
        </div>

        {/* List Skeleton */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="hidden sm:flex gap-8 mr-4">
                   <div className="h-8 w-16 bg-white/5 rounded animate-pulse" />
                   <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="w-24 h-10 bg-white/5 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="min-h-screen pb-24 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative px-4 pb-4 z-10">
          <h1 className="page-header mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-purple" />
            {t('pages.teams.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Discover and follow your favorite clubs. Get instant match alerts and personalized updates.
          </p>
        </div>

        {/* Search */}
        <div className="px-4 sticky top-[20px] z-30 mb-8">
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-purple/50 to-blue-600/50 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl min-h-[52px]">
              <Search className="ml-4 w-4 h-4 text-gray-400 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('pages.teams.searchTeams')}
                className="w-full px-3 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mr-3 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full mx-auto px-0 sm:px-6 space-y-0 sm:space-y-6 relative z-10">
          {/* Teams List */}
          {filteredTeams.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-3">
                {filteredTeams.map((team, idx) => (
                  <div
                    key={team.id || team.teamId || `${team.name || 'team'}_${idx}`}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="group relative hover:bg-white/[0.06] border-b border-white/5 p-3 transition-all duration-500 cursor-pointer overflow-hidden flex items-center gap-3 sm:gap-4"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Logo */}
                    <div className="relative flex-shrink-0 transform group-hover:scale-105 transition-transform duration-500">
                      <NewTeamAvatar team={team} size={48} className="relative z-10 drop-shadow-lg" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 relative z-10">
                      <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-brand-purple transition-colors truncate">
                        {team.name}
                      </h3>
                      
                      <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-400">
                        {team.city && (
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{team.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-shrink-0 md:hidden text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{team.followerCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats - Desktop */}
                    <div className="hidden md:flex items-center gap-6 relative z-10 text-sm">
                      <div className="text-center min-w-[70px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">Followers</div>
                        <div className="text-white font-semibold">{team.followerCount || 0}</div>
                      </div>
                      <div className="text-center min-w-[90px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">Stadium</div>
                        <div className="text-white font-bold truncate max-w-[120px]">{team.stadium || '-'}</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => handleFollowToggle(e, team)}
                      disabled={followingLoading[team.id]}
                      className={`
                        relative z-10 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 flex-shrink-0
                        ${(team.followers || []).includes(user?.uid)
                          ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                          : 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5'
                        } 
                      `}
                    >
                      {followingLoading[team.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (team.followers || []).includes(user?.uid) ? (
                        <>
                          <UserMinus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            
            {/* Infinite Scroll Trigger - Only show when not searching */}
            {!searchQuery && hasMoreTeams && (
              <div ref={loadMoreRef} className="py-12 text-center">
                {loadingMore ? (
                  <div className="flex items-center justify-center gap-3 text-white/50">
                    <div className="w-2 h-2 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                ) : (
                  <button
                    onClick={loadMoreTeams}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-semibold tracking-wide transition-all border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                  >
                    Load More Teams
                  </button>
                )}
              </div>
            )}
            </div>
        ) : (
          <div className="text-center py-32 px-4">
            <div className="relative w-24 h-24 mx-auto mb-6 group">
              <div className="absolute inset-0 bg-brand-purple/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-full h-full bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <Users className="w-10 h-10 text-gray-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('pages.teams.noTeamsFound')}</h3>
            <p className="text-gray-400 max-w-md mx-auto text-lg">
              {searchQuery ? `We couldn't find any teams matching "${searchQuery}".` : 'No teams available yet.'}
            </p>
          </div>
        )}
      </div>
      </div>
      <AuthPromptModal
        {...authPromptProps}
        benefits={[
          'Get notified before your teams kick off',
          'Add upcoming matches to your calendar automatically',
          'Sync followed clubs anywhere you sign in'
        ]}
      />
    </motion.div>
  );
};

export default Teams;
