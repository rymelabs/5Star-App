import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Trophy, Users, Newspaper, Calendar, Shield } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { useFootball } from '../../context/FootballContext';
import { useCompetitions } from '../../context/CompetitionsContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const SearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { articles } = useNews();
  const { fixtures, teams, seasons } = useFootball();
  const { competitions } = useCompetitions();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Memoized search function
  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const searchResults = [];

    try {
      // 1. Search Teams
      if (teams && Array.isArray(teams)) {
        const teamResults = teams
          .filter(team => {
            if (!team) return false;
            const teamName = team.name || '';
            const teamCity = team.city || '';
            return teamName.toLowerCase().includes(lowerQuery) || 
                   teamCity.toLowerCase().includes(lowerQuery);
          })
          .slice(0, 5)
          .map(team => ({
            id: team.id,
            type: 'team',
            category: t('search.team'),
            icon: Users,
            title: team.name || t('search.unknownTeam'),
            subtitle: team.city || '',
            image: team.logo || null,
            data: team
          }));
        
        searchResults.push(...teamResults);
      }

      // 2. Search Players (from all teams)
      if (teams && Array.isArray(teams)) {
        const playerResults = [];
        teams.forEach(team => {
          if (team.players && Array.isArray(team.players)) {
            team.players
              .filter(player => {
                if (!player) return false;
                const playerName = player.name || '';
                return playerName.toLowerCase().includes(lowerQuery);
              })
              .forEach(player => {
                playerResults.push({
                  id: `${team.id}-${player.id}`,
                  type: 'player',
                  category: t('search.player'),
                  icon: Shield,
                  title: player.name || t('search.unknownPlayer'),
                  subtitle: `${team.name || t('search.unknownTeam')} • #${player.jerseyNumber || '?'}`,
                  image: team.logo || null,
                  data: { player, team }
                });
              });
          }
        });
        
        searchResults.push(...playerResults.slice(0, 5));
      }

      // 3. Search Competitions
      if (competitions && Array.isArray(competitions)) {
        const competitionResults = competitions
          .filter(comp => {
            if (!comp) return false;
            const compName = comp.name || '';
            return compName.toLowerCase().includes(lowerQuery);
          })
          .slice(0, 3)
          .map(comp => ({
            id: comp.id,
            type: 'competition',
            category: t('search.competition'),
            icon: Trophy,
            title: comp.name || t('search.unknownCompetition'),
            subtitle: comp.season || '',
            image: null,
            data: comp
          }));
        
        searchResults.push(...competitionResults);
      }

      // 4. Search Seasons
      if (seasons && Array.isArray(seasons)) {
        const seasonResults = seasons
          .filter(season => {
            if (!season) return false;
            const seasonName = season.name || '';
            return seasonName.toLowerCase().includes(lowerQuery);
          })
          .slice(0, 3)
          .map(season => ({
            id: season.id,
            type: 'season',
            category: t('search.season'),
            icon: Calendar,
            title: season.name || t('search.unknownSeason'),
            subtitle: `${season.startDate || ''} - ${season.endDate || ''}`,
            image: null,
            data: season
          }));
        
        searchResults.push(...seasonResults);
      }

      // 5. Search Fixtures
      if (fixtures && Array.isArray(fixtures)) {
        const fixtureResults = fixtures
          .filter(fixture => {
            if (!fixture) return false;
            
            const homeTeamName = fixture.homeTeam?.name || '';
            const awayTeamName = fixture.awayTeam?.name || '';
            const competition = fixture.competition || '';
            
            return homeTeamName.toLowerCase().includes(lowerQuery) ||
                   awayTeamName.toLowerCase().includes(lowerQuery) ||
                   competition.toLowerCase().includes(lowerQuery);
          })
          .slice(0, 5)
          .map(fixture => ({
            id: fixture.id,
            type: 'fixture',
            category: t('search.match'),
            icon: Trophy,
            title: `${fixture.homeTeam?.name || t('search.tbd')} vs ${fixture.awayTeam?.name || t('search.tbd')}`,
            subtitle: `${fixture.competition || ''} • ${fixture.date || ''}`,
            image: null,
            data: fixture
          }));
        
        searchResults.push(...fixtureResults);
      }

      // 6. Search News Articles
      if (articles && Array.isArray(articles)) {
        const newsResults = articles
          .filter(article => {
            if (!article) return false;
            
            const title = article.title || '';
            const excerpt = article.excerpt || '';
            const content = article.content || '';
            
            return title.toLowerCase().includes(lowerQuery) ||
                   excerpt.toLowerCase().includes(lowerQuery) ||
                   content.toLowerCase().includes(lowerQuery);
          })
          .slice(0, 5)
          .map(article => ({
            id: article.id,
            type: 'news',
            category: t('search.news'),
            icon: Newspaper,
            title: article.title || t('search.untitled'),
            subtitle: article.excerpt || '',
            image: article.image || null,
            data: article
          }));
        
        searchResults.push(...newsResults);
      }

      // Limit total results to 15
      setResults(searchResults.slice(0, 15));
      
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [teams, fixtures, articles, competitions, seasons]);

  // Debounced search effect
  useEffect(() => {
    if (query.trim().length >= 2) {
      setLoading(true);
      const timeoutId = setTimeout(() => {
        performSearch(query);
        setLoading(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query, performSearch]);

  const handleResultClick = (result) => {
    // Navigate based on result type
    switch (result.type) {
      case 'team':
        navigate(`/teams/${result.id}`);
        break;
      case 'player':
        // Could navigate to player profile if implemented
        console.log('Player selected:', result.data);
        break;
      case 'fixture':
        navigate(`/fixtures/${result.id}`);
        break;
      case 'news':
        navigate(`/news/${result.id}`);
        break;
      case 'competition':
        // Could navigate to competition page if implemented
        console.log('Competition selected:', result.data);
        break;
      case 'season':
        navigate(`/seasons/${result.id}`);
        break;
      default:
        console.log('Unknown result type:', result.type);
    }
    
    onClose();
  };

  const getCategoryColor = (category) => {
    const colors = {
      [t('search.team')]: 'text-blue-400',
      [t('search.player')]: 'text-green-400',
      [t('search.competition')]: 'text-purple-400',
      [t('search.season')]: 'text-orange-400',
      [t('search.match')]: 'text-red-400',
      [t('search.news')]: 'text-yellow-400'
    };
    return colors[category] || 'text-gray-400';
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-opacity-75 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div 
        className=" bg-black/50 backdrop-blur-sm border border-dark-700 rounded-lg w-full max-w-2xl mx-4 max-h-[600px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center p-4 border-b border-dark-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
        
        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              {t('search.searching')}
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const IconComponent = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <IconComponent className={`w-5 h-5 ${getCategoryColor(result.category)}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${getCategoryColor(result.category)}`}>
                            {result.category}
                          </span>
                          {result.subtitle && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs text-gray-400 truncate">
                                {result.subtitle}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Image */}
                      {result.image && (
                        <img
                          src={result.image}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{t('search.noResults')}</p>
              <p className="text-sm mt-1">{t('search.trySearching')}</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{t('search.startTyping')}</p>
              <p className="text-sm mt-1">{t('search.searchAcross')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;