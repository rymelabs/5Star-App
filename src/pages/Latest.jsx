import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    
    // Filter fixtures for the active season
    const seasonOnly = fixtures.filter(f => f.seasonId === activeSeason.id);
    
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

  // Calculate top scorers from completed fixtures
  const topScorers = React.useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];
    
    const scorers = {};
    
    // Iterate through completed fixtures
    fixtures.filter(f => f.status === 'completed').forEach(fixture => {
      // Count goals for home team
      if (fixture.homeScore > 0 && fixture.homeTeam) {
        const teamId = fixture.homeTeam.id;
        if (!scorers[teamId]) {
          scorers[teamId] = {
            team: fixture.homeTeam,
            goals: 0,
            matches: 0
          };
        }
        scorers[teamId].goals += fixture.homeScore;
        scorers[teamId].matches += 1;
      }
      
      // Count goals for away team
      if (fixture.awayScore > 0 && fixture.awayTeam) {
        const teamId = fixture.awayTeam.id;
        if (!scorers[teamId]) {
          scorers[teamId] = {
            team: fixture.awayTeam,
            goals: 0,
            matches: 0
          };
        }
        scorers[teamId].goals += fixture.awayScore;
        scorers[teamId].matches += 1;
      }
    });
    
    // Convert to array and sort by goals
    return Object.values(scorers)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
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

  return (
    <div className="px-4 py-6">
      <div className="latest-bento-grid">
        {/* News Carousel Section */}
        {latestNews.length > 0 && (
          <section className="bento-section bento-news">
          <div className="flex items-center justify-between mb-4">
            <h2 className="page-header">{t('pages.latest.title') || 'Latest'}</h2>
            <button
              onClick={() => navigate('/news')}
              className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              {t('common.viewAll') || 'See all'}
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Featured Article - Large Card */}
            {latestNews[0] && (
              <div
                onClick={() => handleNewsClick(latestNews[0])}
                className="card p-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200 latest-news-featured"
              >
                {/* News Image */}
                <div className="latest-news-featured__image">
                  <img
                    src={latestNews[0].image}
                    alt={latestNews[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* News Content */}
                <div className="p-4 latest-news-featured__content">
                  <h3 className="font-semibold text-white text-base lg:text-lg mb-2 line-clamp-2">
                    {latestNews[0].title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2 lg:line-clamp-3">
                    {truncateText(latestNews[0].excerpt || latestNews[0].summary || latestNews[0].content, 120)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDate(latestNews[0].publishedAt)}
                    </span>
                    <button className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors">
                      Read more
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Other Articles - Smaller Cards in Grid */}
            {latestNews.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestNews.slice(1, 3).map((article) => (
                  <div
                    key={article.id}
                    onClick={() => handleNewsClick(article)}
                    className="card p-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200 flex"
                  >
                    {/* News Image - Compact Square */}
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* News Content - Compact */}
                    <div className="p-3 flex-1 flex flex-col justify-center">
                      <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

        {/* Recent Results Section */}
        {recentResults.length > 0 && (
          <section className="bento-section bento-results">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">{t('pages.latest.recentResults')}</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-accent-500 text-sm font-medium hover:text-accent-400 transition-colors"
            >
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="results-grid">
            {recentResults.map((match) => (
              <div
                key={match.id}
                onClick={() => handleFixtureClick(match)}
                className="result-card cursor-pointer transition-all duration-200 overflow-hidden bg-gradient-to-br from-dark-900/60 to-dark-800 border border-dark-700 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="text-xs text-gray-400 mb-2">
                  {match.competition
                    ? t('common.competitionBy', { competition: match.competition, admin: match.ownerName || t('common.defaultAdminName') })
                    : t('common.managedBy', { admin: match.ownerName || t('common.defaultAdminName') })}
                </div>
                <div className="result-card__inner">
                  {/* Home Team */}
                  <div className="result-team result-team--home">
                    {match.homeTeam?.logo && (
                      <img
                        src={match.homeTeam?.logo}
                        alt={match.homeTeam?.name}
                        className="result-team__logo"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="result-team__name">
                      {match.homeTeam?.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="result-score">
                    <div className="result-score__value">
                      {match.homeScore} - {match.awayScore}
                    </div>
                    <div className="result-score__status">
                      {t('match.ft')}
                    </div>
                    <div className="result-score__date">
                      {formatDate(match.dateTime)}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="result-team result-team--away">
                    <span className="result-team__name">
                      {match.awayTeam?.name}
                    </span>
                    {match.awayTeam?.logo && (
                      <img
                        src={match.awayTeam?.logo}
                        alt={match.awayTeam?.name}
                        className="result-team__logo"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

        {/* Top Scorers Section */}
        {topScorers.length > 0 && (
          <section className="bento-section bento-scorers">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">{t('pages.latest.topScoringTeams')}</h2>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="space-y-3">
              {topScorers.map((scorer, index) => (
                <div
                  key={scorer.team.id}
                  className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                >
                  {/* Rank & Team */}
                  <div className="flex items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 font-bold text-xs ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-dark-700 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <TeamAvatar name={scorer.team.name} logo={scorer.team.logo} size={36} className="mr-3" />
                    <div>
                      <div className="text-white font-medium">{scorer.team.name}</div>
                      <div className="text-xs text-gray-500">{scorer.matches} matches played</div>
                    </div>
                  </div>
                  
                  {/* Goals */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-500">{scorer.goals}</div>
                    <div className="text-xs text-gray-500">{t('pages.latest.goals')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

        {/* Fixtures Section */}
        {upcomingFixtures.length > 0 && (
          <section className="bento-section bento-upcoming">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">{t('pages.latest.upcomingMatches')}</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingFixtures.map((fixture) => (
              <div
                key={fixture.id}
                onClick={() => handleFixtureClick(fixture)}
                className="rounded-2xl p-3 cursor-pointer transition-all duration-200 overflow-hidden bg-gradient-to-br from-dark-900/60 to-dark-800 border border-dark-700 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="text-xs text-gray-400 mb-2">
                  {fixture.competition
                    ? t('common.competitionBy', { competition: fixture.competition, admin: fixture.ownerName || t('common.defaultAdminName') })
                    : t('common.managedBy', { admin: fixture.ownerName || t('common.defaultAdminName') })}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 flex-1 min-w-0">
                    <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
                      <span className="font-medium text-white truncate max-w-[160px]" title={fixture.homeTeam?.name}>{abbreviateTeamName(fixture.homeTeam?.name || 'Unknown')}</span>
                      {fixture.homeTeam?.logo && (
                        <img
                          src={fixture.homeTeam.logo}
                          alt={fixture.homeTeam.name}
                          className="w-8 h-8 object-contain rounded-full flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-center px-4 flex-shrink-0">
                      {fixture.status === 'completed' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{fixture.homeScore} - {fixture.awayScore}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('match.ft')}</div>
                        </div>
                      ) : isFixtureLive(fixture) ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{fixture.homeScore || 0} - {fixture.awayScore || 0}</div>
                          <div className="text-sm font-bold animate-live-pulse mt-1">{t('match.live')}</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-primary-500">VS</div>
                          <div className="text-xs text-gray-400 mt-1">{fixture.dateTime ? formatTime(fixture.dateTime) : '--:--'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{fixture.dateTime ? formatDate(fixture.dateTime) : 'TBD'}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {fixture.awayTeam?.logo && (
                        <img
                          src={fixture.awayTeam.logo}
                          alt={fixture.awayTeam.name}
                          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <span className="font-medium text-white truncate max-w-[160px]" title={fixture.awayTeam?.name}>{abbreviateTeamName(fixture.awayTeam?.name || 'Unknown')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

        {/* Season Fixtures Section */}
        {activeSeason && seasonFixtures.length > 0 && (
          <section className="bento-section bento-season">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">{activeSeason.name} Fixtures</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              See more
            </button>
          </div>
          
          <div className="space-y-3">
            {seasonFixtures.map((fixture) => (
              <div
                key={fixture.id}
                onClick={() => handleFixtureClick(fixture)}
                className="rounded-2xl p-3 cursor-pointer transition-all duration-200 overflow-hidden bg-gradient-to-br from-dark-900/60 to-dark-800 border border-dark-700 hover:shadow-lg hover:-translate-y-0.5 border-l-2 border-primary-500"
              >
                <div className="text-xs text-gray-400 mb-2">
                  {fixture.competition
                    ? t('common.competitionBy', { competition: fixture.competition, admin: fixture.ownerName || t('common.defaultAdminName') })
                    : t('common.managedBy', { admin: fixture.ownerName || t('common.defaultAdminName') })}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 flex-1 min-w-0">
                    <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
                      <span className="font-medium text-white truncate max-w-[160px]" title={fixture.homeTeam?.name}>{abbreviateTeamName(fixture.homeTeam?.name || 'Unknown')}</span>
                      {fixture.homeTeam?.logo && (
                        <img
                          src={fixture.homeTeam.logo}
                          alt={fixture.homeTeam.name}
                          className="w-8 h-8 object-contain rounded-full flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-center px-4 flex-shrink-0">
                      {fixture.status === 'completed' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{fixture.homeScore} - {fixture.awayScore}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('match.ft')}</div>
                        </div>
                      ) : isFixtureLive(fixture) ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{fixture.homeScore || 0} - {fixture.awayScore || 0}</div>
                          <div className="text-sm font-bold animate-live-pulse mt-1">{t('match.live')}</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-primary-500">VS</div>
                          <div className="text-xs text-gray-400 mt-1">{fixture.dateTime ? formatTime(fixture.dateTime) : '--:--'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{fixture.dateTime ? formatDate(fixture.dateTime) : 'TBD'}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {fixture.awayTeam?.logo && (
                        <img
                          src={fixture.awayTeam.logo}
                          alt={fixture.awayTeam.name}
                          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <span className="font-medium text-white truncate max-w-[160px]" title={fixture.awayTeam?.name}>{abbreviateTeamName(fixture.awayTeam?.name || 'Unknown')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

        {/* League Table Section */}
        {topTeams.length > 0 && (
          <section className="bento-section bento-table">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">{t('pages.latest.leagueTable')}</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="bg-transparent border border-gray-700 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_repeat(6,auto)_auto] gap-3 px-4 py-3 bg-dark-800/30 border-b border-gray-700 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div className="text-left">{t('table.position')}</div>
              <div className="text-left">{t('table.team')}</div>
              <div className="text-center w-8">{t('table.played')}</div>
              <div className="text-center w-8">{t('table.won')}</div>
              <div className="text-center w-8">{t('table.drawn')}</div>
              <div className="text-center w-8">{t('table.lost')}</div>
              <div className="text-center w-10">{t('table.goalDifference')}</div>
              <div className="text-center w-10">{t('table.points')}</div>
              <div className="text-center w-24">{t('pages.latest.form')}</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-700/50">
              {topTeams.map((team, index) => (
                <div
                  key={team.team.id}
                  className="grid grid-cols-[auto_1fr_repeat(6,auto)_auto] gap-3 px-4 py-3 hover:bg-dark-800/30 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-white">
                      {team.position}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={team.team.logo}
                      alt={team.team.name}
                      className="w-5 h-5 object-contain flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                      <TeamAvatar name={team.team.name} logo={team.team.logo} size={20} />
                    <span className="text-sm font-medium text-white truncate">
                      {team.team.name}
                    </span>
                  </div>
                  
                  <div className="text-center w-8 flex items-center justify-center">
                    <span className="text-sm text-gray-300">{team.played}</span>
                  </div>
                  
                  <div className="text-center w-8 flex items-center justify-center">
                    <span className="text-sm text-gray-300">{team.won}</span>
                  </div>
                  
                  <div className="text-center w-8 flex items-center justify-center">
                    <span className="text-sm text-gray-300">{team.drawn}</span>
                  </div>
                  
                  <div className="text-center w-8 flex items-center justify-center">
                    <span className="text-sm text-gray-300">{team.lost}</span>
                  </div>
                  
                  <div className="text-center w-10 flex items-center justify-center">
                    <span className={`text-sm ${
                      team.goalDifference > 0 ? 'text-accent-400' : 
                      team.goalDifference < 0 ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                    </span>
                  </div>
                  
                  <div className="text-center w-10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {team.points}
                    </span>
                  </div>
                  
                  {/* Form Indicators */}
                  <div className="flex items-center justify-center gap-1 w-24">
                    {teamForm[team.team.id]?.map((result, idx) => (
                      <div
                        key={idx}
                        className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                          result === 'W' ? 'bg-green-500/20 text-green-500' :
                          result === 'D' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}
                        title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                      >
                        {result}
                      </div>
                    )) || (
                      <span className="text-xs text-gray-600">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

        {/* Instagram Feed Section */}
        {instagramSettings?.enabled && instagramSettings?.username && (
          <section className="bento-section bento-instagram">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Instagram className="w-5 h-5 text-pink-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">{t('pages.latest.followInstagram')}</h2>
            </div>
            <a
              href={`https://instagram.com/${instagramSettings.username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-pink-500 text-sm font-medium hover:text-pink-400 transition-colors"
            >
              @{instagramSettings.username.replace('@', '')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>
          
          {instagramPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {instagramPosts.slice(0, 6).map((post, index) => (
                  <a
                    key={post.id || index}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card p-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all duration-200 group"
                  >
                    {/* Post Image */}
                    <div className="aspect-square overflow-hidden bg-dark-700 relative">
                      {post.media_type === 'VIDEO' ? (
                        <img
                          src={post.thumbnail_url || post.media_url}
                          alt={post.caption || 'Instagram post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={post.media_url}
                          alt={post.caption || 'Instagram post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      
                      {/* Video indicator */}
                      {post.media_type === 'VIDEO' && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Hover overlay with caption preview */}
                      {post.caption && (
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                          <p className="text-white text-xs line-clamp-3">
                            {post.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="card p-8 text-center bg-gradient-to-br from-pink-500/5 to-purple-500/5 border-pink-500/20">
              <Instagram className="w-12 h-12 text-pink-500 mx-auto mb-3 opacity-50" />
              <p className="text-gray-300 mb-1">{t('pages.latest.connectInstagram')}</p>
              <p className="text-sm text-gray-500 mb-4">{t('pages.latest.latestUpdates')}</p>
            </div>
          )}
          
          {/* Instagram CTA */}
          <div className="mt-4 text-center">
            <a
              href={`https://instagram.com/${instagramSettings.username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-pink-500/25"
            >
              <Instagram className="w-5 h-5" />
              Follow @{instagramSettings.username.replace('@', '')}
            </a>
          </div>
        </section>
      )}

      </div>

      {/* Empty States */}
      {latestNews.length === 0 && upcomingFixtures.length === 0 && topTeams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Welcome to 5Star!</p>
            <p className="text-sm">{t('pages.latest.sportsContent')}</p>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && user && (
        <NotificationModal 
          userId={user.uid} 
          onClose={() => setShowNotificationModal(false)} 
        />
      )}
    </div>
  );
};

export default Latest;
