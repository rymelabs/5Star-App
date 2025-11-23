import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';
import { useInstagram } from '../context/InstagramContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight, Calendar, Trophy, Instagram, Target, TrendingUp, Award } from 'lucide-react';
import TeamAvatar from '../components/TeamAvatar';
import { formatDate, formatTime, getMatchDayLabel } from '../utils/dateUtils';
import { truncateText, formatScore, abbreviateTeamName, isFixtureLive } from '../utils/helpers';
import NotificationModal from '../components/NotificationModal';
import SurfaceCard from '../components/ui/SurfaceCard';
import PillChip from '../components/ui/PillChip';

const Latest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    // Show notification modal for authenticated users on home page
    console.log('Latest page: Checking notifications modal', { 
      hasUser: !!user, 
      userId: user?.uid 
    });
    
    if (user && user.uid) {
      // Check for new notifications by comparing with last seen timestamp
      const checkForNewNotifications = async () => {
        try {
          const { getFirebaseDb } = await import('../firebase/config');
          const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
          
          const db = getFirebaseDb();
          const lastSeenTimestamp = sessionStorage.getItem('lastNotificationCheck');
          const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
          
          // Get active notifications
          const notificationsRef = collection(db, 'adminNotifications');
          const q = query(
            notificationsRef,
            where('active', '==', true),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          
          const snapshot = await getDocs(q);
          const notifications = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(notif => !dismissedIds.includes(notif.id));
          
          console.log('Latest page: Found notifications', { 
            total: notifications.length,
            lastSeenTimestamp 
          });
          
          if (notifications.length > 0) {
            // Check if there are new notifications since last check
            const latestNotificationTime = notifications[0].createdAt?.toMillis?.() || 0;
            const shouldShow = !lastSeenTimestamp || latestNotificationTime > parseInt(lastSeenTimestamp);
            
            console.log('Latest page: Should show modal?', { 
              shouldShow,
              latestNotificationTime,
              lastSeenTimestamp 
            });
            
            if (shouldShow) {
              setTimeout(() => {
                console.log('Latest page: Showing notification modal now');
                setShowNotificationModal(true);
                // Update last check timestamp to latest notification time
                sessionStorage.setItem('lastNotificationCheck', latestNotificationTime.toString());
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error checking notifications:', error);
        }
      };
      
      checkForNewNotifications();
    }
  }, [user]);
  
  // Use hooks at the top level (hooks cannot be in try-catch)
  const newsContext = useNews();
  const footballContext = useFootball();
  const instagramContext = useInstagram();
  
  // Safely extract values with fallbacks
  const articles = newsContext?.articles || [];
  const fixtures = footballContext?.fixtures || [];
  const leagueTable = footballContext?.leagueTable || [];
  const activeSeason = footballContext?.activeSeason || null;
  const instagramPosts = instagramContext?.posts || [];
  const instagramSettings = instagramContext?.settings || null;

  // Get latest news for carousel (top 3)
  const latestNews = articles?.slice(0, 3) || [];

  // Get upcoming fixtures - prioritize season fixtures
  const upcomingFixtures = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];
    
    // Get current time
    const now = new Date();
    
    // Filter for upcoming fixtures only
    const upcoming = fixtures.filter(f => {
      try {
        const fixtureDate = new Date(f.dateTime);
        return fixtureDate > now;
      } catch {
        return false;
      }
    });
    
    // Separate season fixtures from regular fixtures
    const seasonFixtures = upcoming.filter(f => f.seasonId && f.seasonId === activeSeason?.id);
    const regularFixtures = upcoming.filter(f => !f.seasonId || f.seasonId !== activeSeason?.id);
    
    // Combine: season fixtures first, then regular fixtures
    const combined = [...seasonFixtures, ...regularFixtures];
    
    // Sort by date and take first 5
    return combined
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .slice(0, 5);
  }, [fixtures, activeSeason]);

  // Get top 6 teams from league table
  const topTeams = leagueTable?.slice(0, 6) || [];

  // Get season fixtures (first 4 from active season)
  const seasonFixtures = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0 || !activeSeason) return [];
    
    const now = new Date();
    // Filter fixtures for the active season AND upcoming
    const seasonOnly = fixtures.filter(f => 
      f.seasonId === activeSeason.id && new Date(f.dateTime) > now
    );
    
    // Sort by date (earliest first)
    const sorted = seasonOnly.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    // Take first 4
    return sorted.slice(0, 4);
  }, [fixtures, activeSeason]);

  // Get recent results (last 6 completed matches)
  const recentResults = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];
    
    const completed = fixtures.filter(f => f.status === 'completed');
    
    // Sort by date (most recent first)
    return completed
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 6);
  }, [fixtures]);

  // Calculate top scoring teams from league table data (fallback to fixtures if needed)
  const topScoringTeams = React.useMemo(() => {
    const normalizeNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    if (Array.isArray(leagueTable) && leagueTable.length > 0) {
      const normalized = leagueTable
        .map((entry, index) => {
          const teamInfo = entry.team || {
            id: entry.teamId || entry.id,
            name: entry.teamName || entry.name,
            logo: entry.teamLogo || entry.logo
          };

          const goals = normalizeNumber(
            entry.goalsFor ??
            teamInfo?.goalsFor ??
            entry.gf ??
            entry.goals ??
            entry.scored
          );

          const matches = normalizeNumber(
            entry.matches ??
            entry.played ??
            entry.playedMatches ??
            entry.gamesPlayed ??
            entry.playedGames ??
            entry.matchPlayed ??
            entry.matchesPlayed ??
            entry.mp ??
            teamInfo?.played
          );

          return {
            id: teamInfo?.id || `table-${index}`,
            name: teamInfo?.name || 'Unknown Team',
            logo: teamInfo?.logo || '',
            goals,
            matches
          };
        })
        .filter(team => team.id);

      return normalized
        .sort((a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals;
          return a.matches - b.matches;
        })
        .slice(0, 5);
    }

    if (!Array.isArray(fixtures) || fixtures.length === 0) return [];

    const scorerMap = new Map();
    const ensureTeamEntry = (team) => {
      if (!team?.id) return null;
      if (!scorerMap.has(team.id)) {
        scorerMap.set(team.id, {
          id: team.id,
          name: team.name,
          logo: team.logo,
          goals: 0,
          matches: 0
        });
      }
      return scorerMap.get(team.id);
    };

    fixtures
      .filter(f => f.status === 'completed')
      .forEach(fixture => {
        const homeEntry = ensureTeamEntry(fixture.homeTeam);
        const awayEntry = ensureTeamEntry(fixture.awayTeam);
        const homeGoals = normalizeNumber(fixture.homeScore);
        const awayGoals = normalizeNumber(fixture.awayScore);

        if (homeEntry) {
          homeEntry.matches += 1;
          homeEntry.goals += homeGoals;
        }

        if (awayEntry) {
          awayEntry.matches += 1;
          awayEntry.goals += awayGoals;
        }
      });

    return Array.from(scorerMap.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [leagueTable, fixtures]);

  // Calculate team form (last 5 matches)
  const teamForm = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0 || !leagueTable) return {};
    
    const form = {};
    const completed = fixtures.filter(f => f.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    leagueTable.forEach(entry => {
      const teamId = entry.team.id;
      const teamMatches = completed.filter(f => 
        f.homeTeam?.id === teamId || f.awayTeam?.id === teamId
      ).slice(0, 5);
      
      form[teamId] = teamMatches.map(match => {
        const isHome = match.homeTeam?.id === teamId;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;
        
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });
    });
    
    return form;
  }, [fixtures, leagueTable]);

  const handleNewsClick = (article) => {
    if (article?.slug) {
      navigate(`/news/${article.slug}`);
    } else if (article?.id) {
      navigate(`/news/${article.id}`);
    }
  };

  const handleFixtureClick = (fixture) => {
    navigate(`/fixtures/${fixture.id}`);
  };

  // Determine order of News vs Recent Results
  const shouldShowResultsFirst = React.useMemo(() => {
    if (!recentResults.length || !latestNews.length) return false;
    
    try {
      const latestResultDate = new Date(recentResults[0].dateTime);
      const latestNewsDate = new Date(latestNews[0].publishedAt);
      
      // Show results first if they're more recent than news
      return latestResultDate > latestNewsDate;
    } catch {
      return false;
    }
  }, [recentResults, latestNews]);

  // News Section Component
  const NewsSection = () => (
    latestNews.length > 0 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold text-white">{t('pages.latest.latestNews') || 'Latest News'}</h2>
          <button
            onClick={() => navigate('/news')}
            className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
          >
            {t('common.viewAll') || 'See all'}
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Featured Article */}
          {latestNews[0] && (
            <SurfaceCard 
              interactive 
              onClick={() => handleNewsClick(latestNews[0])}
              className="p-0 overflow-hidden group rounded-2xl"
            >
              <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <img
                  src={latestNews[0].image}
                  alt={latestNews[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                  <PillChip 
                    label="Featured" 
                    size="sm" 
                    variant="solid" 
                    tone="primary" 
                    className="mb-2"
                  />
                  <h3 className="font-semibold text-white text-base sm:text-lg leading-tight line-clamp-2">
                    {latestNews[0].title}
                  </h3>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-2">
                  {truncateText(latestNews[0].excerpt || latestNews[0].summary || latestNews[0].content, 120)}
                </p>
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500">
                  <span>{formatDate(latestNews[0].publishedAt)}</span>
                  <span className="text-brand-purple font-semibold">Read Article</span>
                </div>
              </div>
            </SurfaceCard>
          )}

          {/* Secondary Articles */}
          {latestNews.slice(1).map((article) => (
            <SurfaceCard 
              key={article.id} 
              interactive 
              onClick={() => handleNewsClick(article)}
              className="flex gap-3 p-2.5 rounded-2xl"
            >
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <h4 className="font-semibold text-white text-xs sm:text-sm line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-gray-500">{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>
    )
  );

  // Recent Results Section Component
  const RecentResultsSection = () => (
    recentResults.length > 0 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold text-white">Recent Results</h2>
        </div>

        <div className="flex overflow-x-auto gap-2.5 pb-4 -mx-4 px-4 hide-scrollbar">
          {recentResults.map((fixture) => (
            <div 
              key={fixture.id} 
              className="flex-shrink-0 w-56 rounded-2xl bg-gradient-to-br from-brand-purple via-indigo-500 to-blue-500 p-[1px]"
            >
              <SurfaceCard 
                interactive 
                onClick={() => handleFixtureClick(fixture)}
                padding="sm"
                className="flex flex-col gap-2 rounded-2xl h-full bg-app"
              >
                <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-white/5 pb-1.5">
                  <span>{formatDate(fixture.dateTime)}</span>
                  <span className="text-accent-green font-semibold">FT</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TeamAvatar team={fixture.homeTeam} size={28} />
                      <span className="text-xs font-medium">{abbreviateTeamName(fixture.homeTeam?.name)}</span>
                    </div>
                    <span className="font-semibold text-base">{fixture.homeScore}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TeamAvatar team={fixture.awayTeam} size={28} />
                      <span className="text-xs font-medium">{abbreviateTeamName(fixture.awayTeam?.name)}</span>
                    </div>
                    <span className="font-semibold text-base">{fixture.awayScore}</span>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          ))}
        </div>
      </section>
    )
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <header className="px-4 space-y-1">
        <h1 className="page-header flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-brand-purple" />
          {t('pages.latest.title') || 'Latest'}
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
          {t('pages.latest.latestUpdates') || 'See our latest updates and behind-the-scenes content'}
        </p>
      </header>

      {/* Dynamic Order: Show Recent Results first if they're newer than news */}
      {shouldShowResultsFirst ? (
        <>
          <RecentResultsSection />
          <NewsSection />
        </>
      ) : (
        <>
          <NewsSection />
          <RecentResultsSection />
        </>
      )}

      {/* Season Fixtures */}
      {seasonFixtures.length > 0 && activeSeason && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold text-white">{activeSeason.name} Fixtures</h2>
            <button
              onClick={() => navigate('/fixtures')}
              className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
            >
              See all
            </button>
          </div>

          <div className="space-y-3">
            {seasonFixtures.map((fixture) => (
              <SurfaceCard 
                key={fixture.id} 
                interactive 
                onClick={() => handleFixtureClick(fixture)}
                padding="sm"
                className="flex flex-col gap-2 rounded-2xl"
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-400 border-b border-white/5 pb-1.5">
                  <span>{formatDate(fixture.dateTime)} • {formatTime(fixture.dateTime)}</span>
                  <span className="text-brand-purple font-semibold">{fixture.competition || 'League'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center w-1/3 gap-1.5">
                    <TeamAvatar team={fixture.homeTeam} size="sm" />
                    <span className="text-[11px] font-medium text-center line-clamp-1">
                      {abbreviateTeamName(fixture.homeTeam?.name)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-1/3">
                    <div className="bg-white/5 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide">
                      VS
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center w-1/3 gap-1.5">
                    <TeamAvatar team={fixture.awayTeam} size="sm" />
                    <span className="text-[11px] font-medium text-center line-clamp-1">
                      {abbreviateTeamName(fixture.awayTeam?.name)}
                    </span>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </section>
      )}

      {/* Top Scoring Teams */}
      {topScoringTeams.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold text-white">Top Scoring Teams</h2>
            <button
              onClick={() => navigate('/stats')}
              className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
            >
              View Stats
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topScoringTeams.map((stat, index) => (
              <div
                key={stat.id || `top-team-${index}`}
                className="rounded-2xl bg-gradient-to-r from-brand-purple via-indigo-500 to-sky-400 p-[1px] shadow-[0_10px_30px_rgba(59,7,100,0.35)]"
              >
                <SurfaceCard className="flex items-center justify-between p-3 rounded-[22px] bg-[#0c0c0f]">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-gray-400 w-5 text-center">{index + 1}</div>
                    <TeamAvatar team={{ id: stat.id, name: stat.name, logo: stat.logo }} size={32} />
                    <div>
                      <div className="font-semibold text-sm text-white">{stat.name}</div>
                      <div className="text-xs text-gray-400">
                        {stat.matches} {stat.matches === 1 ? 'match' : 'matches'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-brand-purple">{stat.goals}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Goals</span>
                  </div>
                </SurfaceCard>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Fixtures */}
      {upcomingFixtures.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold text-white">{t('navigation.fixtures') || 'Fixtures'}</h2>
            <button
              onClick={() => navigate('/fixtures')}
              className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
            >
              {t('common.viewAll') || 'See all'}
            </button>
          </div>

          <div className="space-y-3">
            {upcomingFixtures.map((fixture) => (
              <SurfaceCard 
                key={fixture.id} 
                interactive 
                onClick={() => handleFixtureClick(fixture)}
                padding="sm"
                className="flex flex-col gap-2 rounded-2xl"
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-400 border-b border-white/5 pb-1.5">
                  <span>{formatDate(fixture.dateTime)} • {formatTime(fixture.dateTime)}</span>
                  <span className="text-brand-purple font-semibold">{fixture.competition || 'League'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center w-1/3 gap-1.5">
                    <TeamAvatar team={fixture.homeTeam} size="sm" />
                    <span className="text-[11px] font-medium text-center line-clamp-1">
                      {abbreviateTeamName(fixture.homeTeam?.name)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-1/3">
                    <div className="bg-white/5 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide">
                      VS
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center w-1/3 gap-1.5">
                    <TeamAvatar team={fixture.awayTeam} size="sm" />
                    <span className="text-[11px] font-medium text-center line-clamp-1">
                      {abbreviateTeamName(fixture.awayTeam?.name)}
                    </span>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </section>
      )}

      {showNotificationModal && (
        <NotificationModal 
          isOpen={showNotificationModal} 
          onClose={() => setShowNotificationModal(false)} 
        />
      )}
    </motion.div>
  );
};

export default Latest;
