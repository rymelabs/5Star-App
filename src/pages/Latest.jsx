import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';
import { useInstagram } from '../context/InstagramContext';
import { ChevronRight, Calendar, Trophy, Instagram, Target, TrendingUp, Award } from 'lucide-react';
import { formatDate, formatTime, getMatchDayLabel } from '../utils/dateUtils';
import { truncateText, formatScore, abbreviateTeamName, isFixtureLive } from '../utils/helpers';

const Latest = () => {
  const navigate = useNavigate();
  
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
    <div className="px-4 py-6 space-y-8">
      {/* News Carousel Section */}
      {latestNews.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="page-header">Latest News</h2>
            <button
              onClick={() => navigate('/news')}
              className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Featured Article - Large Card */}
            {latestNews[0] && (
              <div
                onClick={() => handleNewsClick(latestNews[0])}
                className="card p-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200"
              >
                {/* News Image */}
                <div className="aspect-video overflow-hidden">
                  <img
                    src={latestNews[0].image}
                    alt={latestNews[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* News Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">
                    {latestNews[0].title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
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
              <div className="space-y-3">
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
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">Recent Results</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-accent-500 text-sm font-medium hover:text-accent-400 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentResults.map((match) => (
              <div
                key={match.id}
                onClick={() => handleFixtureClick(match)}
                className="card p-4 cursor-pointer hover:ring-2 hover:ring-accent-500 transition-all"
              >
                <div className="flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex items-center flex-1">
                    <img
                      src={match.homeTeam?.logo}
                      alt={match.homeTeam?.name}
                      className="w-6 h-6 object-contain mr-2"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <span className="text-white font-medium truncate">
                      {match.homeTeam?.name}
                    </span>
                  </div>
                  
                  {/* Score */}
                  <div className="px-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">FT</div>
                    </div>
                  </div>
                  
                  {/* Away Team */}
                  <div className="flex items-center flex-1 justify-end">
                    <span className="text-white font-medium truncate">
                      {match.awayTeam?.name}
                    </span>
                    <img
                      src={match.awayTeam?.logo}
                      alt={match.awayTeam?.name}
                      className="w-6 h-6 object-contain ml-2"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                </div>
                
                {/* Date */}
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {formatDate(match.dateTime)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Scorers Section */}
      {topScorers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">Top Scoring Teams</h2>
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
                    <img
                      src={scorer.team.logo}
                      alt={scorer.team.name}
                      className="w-6 h-6 object-contain mr-2"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div>
                      <div className="text-white font-medium">{scorer.team.name}</div>
                      <div className="text-xs text-gray-500">{scorer.matches} matches played</div>
                    </div>
                  </div>
                  
                  {/* Goals */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-500">{scorer.goals}</div>
                    <div className="text-xs text-gray-500">goals</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fixtures Section */}
      {upcomingFixtures.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">Upcoming Fixtures</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              See more
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingFixtures.map((fixture) => (
              <div
                key={fixture.id}
                onClick={() => handleFixtureClick(fixture)}
                className="card p-4 cursor-pointer hover:bg-dark-700 transition-colors duration-200 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  {/* Teams */}
                  <div className="flex items-center space-x-6 flex-1 min-w-0">
                    {/* Home Team */}
                    <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
                      <span className="font-medium text-white text-sm truncate">
                        {abbreviateTeamName(fixture.homeTeam.name)}
                      </span>
                      {fixture.homeTeam?.logo && (
                        <img
                          src={fixture.homeTeam.logo}
                          alt={fixture.homeTeam.name}
                          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    
                    {/* VS / Score / Time / Date */}
                    <div className="flex flex-col items-center px-4 flex-shrink-0">
                      {fixture.status === 'completed' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {fixture.homeScore} - {fixture.awayScore}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">FT</div>
                        </div>
                      ) : isFixtureLive(fixture) ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {fixture.homeScore || 0} - {fixture.awayScore || 0}
                          </div>
                          <div className="text-sm font-bold animate-live-pulse mt-1">
                            LIVE
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-primary-500">VS</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {fixture.dateTime ? formatTime(fixture.dateTime) : '--:--'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {fixture.dateTime ? formatDate(fixture.dateTime) : 'TBD'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {fixture.awayTeam?.logo && (
                        <img
                          src={fixture.awayTeam.logo}
                          alt={fixture.awayTeam.name}
                          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="font-medium text-white text-sm truncate">
                        {abbreviateTeamName(fixture.awayTeam.name)}
                      </span>
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
        <section>
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
                className="card p-4 cursor-pointer hover:bg-dark-700 transition-colors duration-200 overflow-hidden border-l-2 border-primary-500"
              >
                {/* Competition/Group badges */}
                {(fixture.groupId || fixture.stage) && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {fixture.groupId && activeSeason.groups && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded">
                        {activeSeason.groups.find(g => g.id === fixture.groupId)?.name || 'Group'}
                      </span>
                    )}
                    {fixture.stage && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded capitalize">
                        {fixture.stage === 'knockout' ? fixture.round || 'Knockout' : 'Group Stage'}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* Teams */}
                  <div className="flex items-center space-x-6 flex-1 min-w-0">
                    {/* Home Team */}
                    <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
                      <span className="font-medium text-white text-sm truncate max-w-[120px]" title={fixture.homeTeam?.name}>
                        {abbreviateTeamName(fixture.homeTeam?.name || 'Unknown')}
                      </span>
                      {fixture.homeTeam?.logo && (
                        <img
                          src={fixture.homeTeam.logo}
                          alt={fixture.homeTeam.name}
                          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                    </div>
                    
                    {/* VS / Score / Time / Date */}
                    <div className="flex flex-col items-center px-4 flex-shrink-0">
                      {fixture.status === 'completed' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {fixture.homeScore} - {fixture.awayScore}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">FT</div>
                        </div>
                      ) : isFixtureLive(fixture) ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {fixture.homeScore || 0} - {fixture.awayScore || 0}
                          </div>
                          <div className="text-sm font-bold animate-live-pulse mt-1">
                            LIVE
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-primary-500">VS</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {fixture.dateTime ? formatTime(fixture.dateTime) : '--:--'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {fixture.dateTime ? formatDate(fixture.dateTime) : 'TBD'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {fixture.awayTeam?.logo && (
                        <img
                          src={fixture.awayTeam.logo}
                          alt={fixture.awayTeam.name}
                          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <span className="font-medium text-white text-sm truncate max-w-[120px]" title={fixture.awayTeam?.name}>
                        {abbreviateTeamName(fixture.awayTeam?.name || 'Unknown')}
                      </span>
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
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">League Table</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              View full table
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="bg-transparent border border-gray-700 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_repeat(6,auto)_auto] gap-3 px-4 py-3 bg-dark-800/30 border-b border-gray-700 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div className="text-left">S/N</div>
              <div className="text-left">TEAM</div>
              <div className="text-center w-8">P</div>
              <div className="text-center w-8">W</div>
              <div className="text-center w-8">D</div>
              <div className="text-center w-8">L</div>
              <div className="text-center w-10">GD</div>
              <div className="text-center w-10">PTS</div>
              <div className="text-center w-24">FORM</div>
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
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Instagram className="w-5 h-5 text-pink-500 mr-2" />
              <h2 className="text-lg font-semibold text-white">Follow Us on Instagram</h2>
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
              <p className="text-gray-300 mb-1">Connect with us on Instagram!</p>
              <p className="text-sm text-gray-500 mb-4">See our latest updates and behind-the-scenes content</p>
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

      {/* Empty States */}
      {latestNews.length === 0 && upcomingFixtures.length === 0 && topTeams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Welcome to 5Star!</p>
            <p className="text-sm">Sports content will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Latest;