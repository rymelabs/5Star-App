import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOptionalNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';
import { useInstagram } from '../context/InstagramContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight, Calendar, Trophy, Instagram, TrendingUp, Award } from 'lucide-react';
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
          
          if (notifications.length > 0) {
            // Check if there are new notifications since last check
            const latestNotificationTime = notifications[0].createdAt?.toMillis?.() || 0;
            const shouldShow = !lastSeenTimestamp || latestNotificationTime > parseInt(lastSeenTimestamp);
            if (shouldShow) {
              setTimeout(() => {
                setShowNotificationModal(true);
                // Update last check timestamp to latest notification time
                sessionStorage.setItem('lastNotificationCheck', latestNotificationTime.toString());
              }, 2000);
            }
          }
        } catch (error) {
          /* ignore notification check errors */
        }
      };
      
      checkForNewNotifications();
    }
  }, [user]);
  
  // Use hooks at the top level (hooks cannot be in try-catch)
  const newsContext = useOptionalNews();
  const footballContext = useFootball();
  const instagramContext = useInstagram();

  // Safely extract values with fallbacks
  const articles = newsContext?.articles || [];
  const fixtures = footballContext?.fixtures || [];
  const leagueTable = footballContext?.leagueTable || [];
  const activeSeason = footballContext?.activeSeason || null;
  const seasons = footballContext?.seasons || [];
  const leagues = footballContext?.leagues || [];
  const instagramPosts = instagramContext?.posts || [];
  const instagramSettings = instagramContext?.settings || null;

  // Get latest news for carousel (top 3)
  const latestNews = articles?.slice(0, 3) || [];

  const getCompetitionDetails = React.useCallback((seasonId, leagueId, competitionName) => {
    // First try to find from seasons
    if (seasonId) {
      const season = seasons.find(s => s.id === seasonId);
      if (season) {
        return {
          id: season.id,
          logo: season.logo || null,
          type: 'season'
        };
      }
    }

    // Then try to find from leagues
    if (leagueId) {
      const league = leagues.find(l => l.id === leagueId);
      if (league) {
        return {
          id: league.id,
          logo: league.logo || null,
          type: 'league'
        };
      }
    }

    // Try to find by name match
    const league = leagues.find(l =>
      l.name?.toLowerCase() === competitionName?.toLowerCase()
    );
    if (league) {
      return {
        id: league.id,
        logo: league.logo || null,
        type: 'league'
      };
    }

    return { id: null, logo: null, type: null };
  }, [seasons, leagues]);

  // Live fixtures grouped by competition/league/season (for Live Matches section)
  const groupedLiveContent = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];

    const competitionsMap = new Map();

    fixtures
      .filter(fixture => isFixtureLive(fixture))
      .forEach(fixture => {
        const compName = fixture.competition || 'General Fixtures';
        const seasonName = fixture.seasonId === activeSeason?.id ? activeSeason.name : null;
        const groupKey = seasonName || compName;

        if (!competitionsMap.has(groupKey)) {
          const details = getCompetitionDetails(fixture.seasonId, fixture.leagueId, compName);

          competitionsMap.set(groupKey, {
            name: groupKey,
            logo: details.logo,
            competitionId: details.id,
            competitionType: details.type,
            isActiveSeason: !!seasonName,
            competition: compName,
            liveFixtures: []
          });
        }

        const group = competitionsMap.get(groupKey);
        group.liveFixtures.push(fixture);
      });

    return Array.from(competitionsMap.values())
      .map(group => {
        group.liveFixtures.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        return group;
      })
      .filter(group => group.liveFixtures.length > 0)
      .sort((a, b) => {
        if (a.isActiveSeason && !b.isActiveSeason) return -1;
        if (!a.isActiveSeason && b.isActiveSeason) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [fixtures, activeSeason, getCompetitionDetails]);

  // Group all content by competition/league/season
  const groupedContent = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];

    const now = new Date();
    const competitionsMap = new Map();

    // Process all fixtures and group by competition/season
    fixtures.forEach(fixture => {
      const compName = fixture.competition || 'General Fixtures';
      const seasonName = fixture.seasonId === activeSeason?.id ? activeSeason.name : null;
      const groupKey = seasonName || compName;

      if (!competitionsMap.has(groupKey)) {
        // Find details for this group
        const details = getCompetitionDetails(fixture.seasonId, fixture.leagueId, compName);
        
        competitionsMap.set(groupKey, {
          name: groupKey,
          logo: details.logo,
          competitionId: details.id,
          competitionType: details.type,
          isActiveSeason: !!seasonName,
          competition: compName,
          upcomingFixtures: [],
          recentResults: []
        });
      }

      const group = competitionsMap.get(groupKey);
      const fixtureDate = new Date(fixture.dateTime);

      // Categorize fixtures
      if (fixture.status === 'completed') {
        group.recentResults.push(fixture);
      } else if (fixtureDate > now) {
        group.upcomingFixtures.push(fixture);
      }
    });

    // Process and sort each group
    return Array.from(competitionsMap.values())
      .map(group => {
        // Sort upcoming by date (earliest first), limit to 5
        group.upcomingFixtures.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        group.upcomingFixtures = group.upcomingFixtures.slice(0, 5);

        // Sort results by date (most recent first), limit to 6
        group.recentResults.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        group.recentResults = group.recentResults.slice(0, 6);

        return group;
      })
      .filter(group =>
        group.upcomingFixtures.length > 0 ||
        group.recentResults.length > 0
      )
      .sort((a, b) => {
        // Active season first
        if (a.isActiveSeason && !b.isActiveSeason) return -1;
        if (!a.isActiveSeason && b.isActiveSeason) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [fixtures, activeSeason, getCompetitionDetails]);

  // Get top 6 teams from league table
  const topTeams = leagueTable?.slice(0, 6) || [];

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
              className="p-0 overflow-hidden group rounded-none"
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
                  <h3 className="font-bold text-white text-lg sm:text-2xl leading-tight line-clamp-2">
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
            <div className="bg-[#0c0c0f] border-t border-b border-white/10">
              {latestNews.slice(1).map((article, index) => (
                <div
                  key={article.id}
                  onClick={() => handleNewsClick(article)}
                  className={`flex gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer ${index < latestNews.length - 2 ? 'border-b border-white/10' : ''}`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden bg-gray-800">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-semibold text-white text-sm sm:text-base line-clamp-2 mb-0.5">
                      {article.title}
                    </h4>
                    <span className="text-xs text-gray-500">{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  );

  // Handle competition click
  const handleCompetitionClick = (group) => {
    if (group.competitionId && group.competitionType) {
      navigate(`/competitions/${group.competitionType}/${group.competitionId}`);
    }
  };

  // Competition Group Component
  const CompetitionGroup = ({ group }) => (
    <section className="space-y-4">
      {/* Competition Header */}
      <div 
        className={`flex items-center gap-2 px-2 ${group.competitionId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={() => handleCompetitionClick(group)}
      >
        {group.logo ? (
          <img 
            src={group.logo} 
            alt={group.name} 
            className="w-5 h-5 object-contain rounded"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <Trophy 
          className="w-5 h-5 text-brand-purple" 
          style={{ display: group.logo ? 'none' : 'block' }}
        />
        <h2 className="text-[13px] sm:text-xl font-bold text-white leading-tight">{group.name}</h2>
        {group.isActiveSeason && (
          <PillChip label="Active Season" size="sm" variant="solid" tone="primary" />
        )}
        {group.competitionId && (
          <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
        )}
      </div>

      {/* Recent Results */}
      {group.recentResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-bold text-white/90 tracking-wide">Recent Results</h3>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
            {group.recentResults.map((fixture) => (
              <div 
                key={fixture.id} 
                onClick={() => handleFixtureClick(fixture)}
                className="flex-shrink-0 w-44 bg-[#0a0a0a]/50 backdrop-blur-sm rounded-lg border border-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.03] transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500">{formatDate(fixture.dateTime)}</span>
                  <span className="text-[10px] font-bold text-emerald-400">FT</span>
                </div>
                
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
        </div>
      )}

      {/* Upcoming Fixtures */}
      {group.upcomingFixtures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-green-500 rounded-full" />
              <h3 className="text-sm font-bold text-white/90 tracking-wide">Upcoming Fixtures</h3>
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
            {group.upcomingFixtures.map((fixture) => (
              <CompactFixtureRow key={fixture.id} fixture={fixture} onClick={handleFixtureClick} />
            ))}
          </div>
        </div>
      )}
    </section>
  );

  const LiveMatchesSection = () => (
    groupedLiveContent.length > 0 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold text-white">{t('pages.latest.liveMatches') || 'Live Matches'}</h2>
          <button
            onClick={() => navigate('/fixtures')}
            className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
          >
            {t('common.viewAll') || 'See all'}
          </button>
        </div>

        <div className="space-y-6">
          {groupedLiveContent.map((group) => (
            <div key={`live-${group.name}`} className="space-y-3">
              <div
                className={`flex items-center gap-2 px-2 ${group.competitionId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => handleCompetitionClick(group)}
              >
                {group.logo ? (
                  <img
                    src={group.logo}
                    alt={group.name}
                    className="w-5 h-5 object-contain rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <Trophy
                  className="w-5 h-5 text-brand-purple"
                  style={{ display: group.logo ? 'none' : 'block' }}
                />
                <h3 className="text-[13px] sm:text-base font-bold text-white leading-tight">{group.name}</h3>
                {group.competitionId && (
                  <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                )}
              </div>

              <div className="bg-[#0a0a0a]/50 backdrop-blur-sm rounded-xl border border-white/[0.04] overflow-hidden">
                {group.liveFixtures.map((fixture) => (
                  <CompactFixtureRow key={fixture.id} fixture={fixture} onClick={handleFixtureClick} />
                ))}
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
      className="space-y-8 pb-8 md:pb-4"
    >
      <header className="px-4 space-y-1">
        <h1 className="page-header flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-brand-purple" />
          {t('pages.latest.title') || 'Latest'}
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
          {t('pages.latest.latestUpdates') || 'Stay updated with the latest news, results, and fixtures'}
        </p>
      </header>

      {/* Live Matches */}
      <LiveMatchesSection />

      {/* Latest News */}
      <NewsSection />

      {/* Grouped Content by Competition/League/Season */}
      {groupedContent.map((group) => (
        <CompetitionGroup key={group.name} group={group} />
      ))}

      {/* League Table if available */}
      {topTeams.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-purple" />
              <h2 className="text-lg font-semibold text-white">League Standings</h2>
            </div>
            <button
              onClick={() => navigate('/table')}
              className="text-brand-purple text-xs font-semibold tracking-wide uppercase hover:text-brand-purple/80 transition-colors"
            >
              View Full Table
            </button>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-r from-brand-purple/20 via-indigo-500/20 to-sky-400/20 p-[1px]">
            <SurfaceCard className="rounded-[22px] bg-[#0c0c0f] overflow-hidden">
              {topTeams.map((entry, index) => (
                <div
                  key={entry.team.id}
                  className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`font-bold w-6 text-center ${
                      index < 3 ? 'text-brand-purple' : 'text-gray-500'
                    }`}>
                      {entry.position}
                    </div>
                    <NewTeamAvatar team={entry.team} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{entry.team.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500">PTS</div>
                      <div className="font-bold text-white">{entry.points}</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-gray-500">GD</div>
                      <div className="font-semibold text-gray-300">{entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}</div>
                    </div>
                  </div>
                </div>
              ))}
            </SurfaceCard>
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
