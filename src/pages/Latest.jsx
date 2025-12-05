import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOptionalNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';
import { useInstagram } from '../context/InstagramContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight, Calendar, Trophy, Instagram, Target, TrendingUp, Award } from 'lucide-react';
import NewTeamAvatar from '../components/NewTeamAvatar';
import { formatDate, formatTime, getMatchDayLabel } from '../utils/dateUtils';
import { truncateText, formatScore, abbreviateTeamName, isFixtureLive } from '../utils/helpers';
import NotificationModal from '../components/NotificationModal';
import SurfaceCard from '../components/ui/SurfaceCard';
import PillChip from '../components/ui/PillChip';
import CompactFixtureRow from '../components/CompactFixtureRow';

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
  const newsContext = useOptionalNews();
  const footballContext = useFootball();
  const instagramContext = useInstagram();

  useEffect(() => {
    if (!newsContext) {
      console.warn('Latest page: Rendering without NewsProvider context');
    }
  }, [newsContext]);
  
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

  // Calculate top scoring teams grouped by competition
  const topScoringTeamsByCompetition = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];

    const competitionsMap = new Map();

    fixtures
      .filter(f => f.status === 'completed')
      .forEach(fixture => {
        const compName = fixture.competition || 'Unknown Competition';
        
        if (!competitionsMap.has(compName)) {
          competitionsMap.set(compName, {
            name: compName,
            teamsMap: new Map()
          });
        }
        
        const compData = competitionsMap.get(compName);
        const teamsMap = compData.teamsMap;

        const processTeam = (team, score) => {
            if (!team?.id) return;
            const scoreNum = Number(score);
            if (isNaN(scoreNum)) return;

            if (!teamsMap.has(team.id)) {
                teamsMap.set(team.id, {
                    id: team.id,
                    name: team.name,
                    logo: team.logo,
                    goals: 0,
                    matches: 0
                });
            }
            const entry = teamsMap.get(team.id);
            entry.matches += 1;
            entry.goals += scoreNum;
        };

        processTeam(fixture.homeTeam, fixture.homeScore);
        processTeam(fixture.awayTeam, fixture.awayScore);
      });

    return Array.from(competitionsMap.values())
        .map(comp => ({
            name: comp.name,
            teams: Array.from(comp.teamsMap.values())
                .sort((a, b) => b.goals - a.goals)
                .slice(0, 3)
        }))
        .filter(comp => comp.teams.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [fixtures]);

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
          {latestNews.length > 1 && (
            <div className="rounded-2xl bg-gradient-to-r from-brand-purple/20 via-indigo-500/20 to-sky-400/20 p-[1px]">
              <SurfaceCard className="rounded-[22px] bg-[#0c0c0f] overflow-hidden">
                {latestNews.slice(1).map((article) => (
                  <div
                    key={article.id}
                    onClick={() => handleNewsClick(article)}
                    className="flex gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 mb-1">
                        {article.title}
                      </h4>
                      <span className="text-[11px] text-gray-500">{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                ))}
              </SurfaceCard>
            </div>
          )}
        </div>
      </section>
    )
  );

  // Recent Results Section Component
  const RecentResultsSection = () => (
    recentResults.length > 0 && (
      <section className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-bold text-white tracking-wide">Results</h2>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 px-4 hide-scrollbar">
          {recentResults.map((fixture) => (
            <div 
              key={fixture.id} 
              onClick={() => handleFixtureClick(fixture)}
              className="flex-shrink-0 w-44 bg-[#0a0a0a]/50 backdrop-blur-sm rounded-lg border border-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.03] transition-all group"
            >
              {/* Match Info */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-500">{formatDate(fixture.dateTime)}</span>
                <span className="text-[10px] font-bold text-emerald-400">FT</span>
              </div>
              
              {/* Teams */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <NewTeamAvatar team={fixture.homeTeam} size={18} />
                    <span className={`text-[11px] truncate ${
                      Number(fixture.homeScore) > Number(fixture.awayScore) ? 'text-white font-semibold' : 'text-gray-400'
                    }`}>{abbreviateTeamName(fixture.homeTeam?.name)}</span>
                  </div>
                  <span className={`text-sm font-bold ml-2 ${
                    Number(fixture.homeScore) > Number(fixture.awayScore) ? 'text-white' : 'text-gray-500'
                  }`}>{fixture.homeScore}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <NewTeamAvatar team={fixture.awayTeam} size={18} />
                    <span className={`text-[11px] truncate ${
                      Number(fixture.awayScore) > Number(fixture.homeScore) ? 'text-white font-semibold' : 'text-gray-400'
                    }`}>{abbreviateTeamName(fixture.awayTeam?.name)}</span>
                  </div>
                  <span className={`text-sm font-bold ml-2 ${
                    Number(fixture.awayScore) > Number(fixture.homeScore) ? 'text-white' : 'text-gray-500'
                  }`}>{fixture.awayScore}</span>
                </div>
              </div>
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
          <TrendingUp className="w-6 h-6 text-brand-purple" />
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
        <section className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-brand-purple rounded-full" />
              <h2 className="text-sm font-bold text-white tracking-wide">{activeSeason.name}</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="text-[11px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-[#0a0a0a]/50 backdrop-blur-sm rounded-xl border border-white/[0.04] overflow-hidden">
            {seasonFixtures.map((fixture) => (
              <CompactFixtureRow key={fixture.id} fixture={fixture} onClick={handleFixtureClick} />
            ))}
          </div>
        </section>
      )}

      {/* Top Scoring Teams */}
      {topScoringTeamsByCompetition.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold text-white">Top Scoring Teams</h2>
            <button
              onClick={() => navigate('/stats')}
              className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
            >
              View Stats
            </button>
          </div>
          
          <div className="space-y-8">
            {topScoringTeamsByCompetition.map((competition) => (
              <div key={competition.name} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <Trophy className="w-4 h-4 text-brand-purple" />
                  <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">{competition.name}</h3>
                </div>
                
                <div className="rounded-2xl bg-gradient-to-r from-brand-purple/20 via-indigo-500/20 to-sky-400/20 p-[1px]">
                  <SurfaceCard className="rounded-[22px] bg-[#0c0c0f] overflow-hidden">
                    {competition.teams.map((stat, index) => (
                      <div
                        key={stat.id}
                        className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`font-bold w-5 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {index + 1}
                          </div>
                          <NewTeamAvatar team={{ id: stat.id, name: stat.name, logo: stat.logo }} size={32} />
                          <div>
                            <div className="font-semibold text-sm text-white group-hover:text-brand-purple transition-colors">{stat.name}</div>
                            <div className="text-xs text-gray-400">
                              {stat.matches} {stat.matches === 1 ? 'match' : 'matches'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-brand-purple">{stat.goals}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Goals</span>
                        </div>
                      </div>
                    ))}
                  </SurfaceCard>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Fixtures */}
      {upcomingFixtures.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-green-500 rounded-full" />
              <h2 className="text-sm font-bold text-white tracking-wide">{t('navigation.fixtures') || 'Upcoming'}</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="text-[11px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {t('common.viewAll') || 'View all'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-[#0a0a0a]/50 backdrop-blur-sm rounded-xl border border-white/[0.04] overflow-hidden">
            {upcomingFixtures.map((fixture) => (
              <CompactFixtureRow key={fixture.id} fixture={fixture} onClick={handleFixtureClick} />
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
