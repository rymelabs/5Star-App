import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MapPin, Trophy, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import TeamAvatar from '../components/TeamAvatar';
import AuthPromptModal from '../components/AuthPromptModal';
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
      <div className="p-6 pb-24">
        <div className="mb-6">
          <div className="h-4 w-40 bg-white/10 rounded-full animate-pulse mb-2" />
          <div className="h-3 w-64 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-dark-800 border border-dark-700 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-40 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
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
                  <TeamAvatar name={team.name} logo={team.logo} size={48} className="group-hover:bg-dark-600 transition-colors" />

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
      <AuthPromptModal
        {...authPromptProps}
        benefits={[
          'Get notified before your teams kick off',
          'Add upcoming matches to your calendar automatically',
          'Sync followed clubs anywhere you sign in'
        ]}
      />
    </>
  );
};

export default Teams;
