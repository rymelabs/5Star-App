import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';
import { ChevronRight, Calendar, Trophy } from 'lucide-react';
import { formatDate, formatTime, getMatchDayLabel } from '../utils/dateUtils';
import { truncateText, formatScore, abbreviateTeamName, isFixtureLive } from '../utils/helpers';

const Latest = () => {
  const navigate = useNavigate();
  
  // Add try-catch for context usage
  let articles = [];
  let fixtures = [];
  let leagueTable = [];
  
  try {
    const newsContext = useNews();
    articles = newsContext?.articles || [];
  } catch (error) {
    console.error('Error accessing NewsContext:', error);
  }
  
  try {
    const footballContext = useFootball();
    fixtures = footballContext?.fixtures || [];
    leagueTable = footballContext?.leagueTable || [];
  } catch (error) {
    console.error('Error accessing FootballContext:', error);
  }

  // Get latest news for carousel (top 3)
  const latestNews = articles?.slice(0, 3) || [];

  // Get upcoming fixtures (next 5) - simplified to avoid date parsing errors
  const upcomingFixtures = fixtures?.slice(0, 5) || [];

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

  return (
    <div className="px-4 py-6 space-y-8">
      {/* News Carousel Section */}
      {latestNews.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Latest News</h2>
            <button
              onClick={() => navigate('/news')}
              className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="space-y-4">
            {latestNews.map((article) => (
              <div
                key={article.id}
                onClick={() => handleNewsClick(article)}
                className="card p-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200"
              >
                {/* News Image */}
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* News Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {truncateText(article.excerpt || article.summary || article.content, 120)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDate(article.publishedAt)}
                    </span>
                    <button className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors">
                      Read more
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fixtures Section */}
      {upcomingFixtures.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">Upcoming Fixtures</h2>
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
                      <img
                        src={fixture.homeTeam.logo}
                        alt={fixture.homeTeam.name}
                        className="w-10 h-10 object-contain rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* VS / Time / Date */}
                    <div className="flex flex-col items-center px-4 flex-shrink-0">
                      <div className="text-sm font-semibold text-primary-500">VS</div>
                      {isFixtureLive(fixture) ? (
                        <div className="text-sm font-bold animate-live-pulse mt-1">
                          LIVE
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-gray-400 mt-1">
                            {fixture.dateTime ? formatTime(fixture.dateTime) : '--:--'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {fixture.dateTime ? formatDate(fixture.dateTime) : 'TBD'}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img
                        src={fixture.awayTeam.logo}
                        alt={fixture.awayTeam.name}
                        className="w-10 h-10 object-contain rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
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

      {/* League Table Section */}
      {topTeams.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">League Table</h2>
            </div>
            <button
              onClick={() => navigate('/fixtures')}
              className="flex items-center text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              View full table
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-dark-700 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Team</div>
              <div className="col-span-2 text-center">P</div>
              <div className="col-span-2 text-center">GD</div>
              <div className="col-span-2 text-center">Pts</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-dark-700">
              {topTeams.map((team, index) => (
                <div
                  key={team.team.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-dark-700 transition-colors duration-200"
                >
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-medium text-white">
                      {team.position}
                    </span>
                  </div>
                  
                  <div className="col-span-5 flex items-center space-x-2">
                    <img
                      src={team.team.logo}
                      alt={team.team.name}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {team.team.name}
                    </span>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-gray-300">{team.played}</span>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className={`text-sm ${
                      team.goalDifference > 0 ? 'text-accent-400' : 
                      team.goalDifference < 0 ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                    </span>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-white">
                      {team.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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