import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Trophy, Users, Newspaper, Calendar, Shield, ArrowRight } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { useFootball } from '../../context/FootballContext';
import { useCompetitions } from '../../context/CompetitionsContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// Inner component that uses the contexts
const SearchModalContent = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { articles = [] } = useNews() || {};
  const { fixtures = [], teams = [], seasons = [] } = useFootball() || {};
  const { competitions = [] } = useCompetitions() || {};
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // Only depend on query, performSearch is stable enough via useCallback

  const handleResultClick = (result) => {
    // Navigate based on result type
    switch (result.type) {
      case 'team':
        navigate(`/teams/${result.id}`);
        break;
      case 'player':
        // Could navigate to player profile if implemented
        break;
      case 'fixture':
        navigate(`/fixtures/${result.id}`);
        break;
      case 'news':
        navigate(`/news/${result.id}`);
        break;
      case 'competition':
        // Could navigate to competition page if implemented
        break;
      case 'season':
        navigate(`/seasons/${result.id}`);
        break;
      default:
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
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop with heavy blur */}
          <motion.div
            className="absolute inset-0 bg-app/60 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal Container */}
          <motion.div 
            className="relative w-full bg-elevated/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
        {/* Search Input Area */}
        <div className="relative border-b border-white/5 bg-white/5">
          <div className="flex items-center px-6 py-5">
            <Search className="w-6 h-6 text-brand-purple mr-4" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xl text-white placeholder-white/30 outline-none font-light tracking-wide"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full hover:bg-white/10 transition-colors mr-2"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-purple border-t-transparent mx-auto mb-4"></div>
              <p className="text-white/40 font-light">{t('search.searching')}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-white/30 uppercase tracking-wider">
                {t('search.results')}
              </div>
              {results.map((result, index) => {
                const IconComponent = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-6 py-4 text-left hover:bg-white/5 transition-all group border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon/Image Container */}
                      <div className="relative flex-shrink-0">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shadow-lg ring-1 ring-white/10"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                            result.category === 'Team' ? 'from-blue-500/20 to-brand-purple/20' :
                            result.category === 'Competition' ? 'from-orange-500/20 to-red-500/20' :
                            'from-gray-700 to-gray-800'
                          }`}>
                            <IconComponent className={`w-5 h-5 ${getCategoryColor(result.category)}`} />
                          </div>
                        )}
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors truncate">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 ${getCategoryColor(result.category)}`}>
                            {result.category}
                          </span>
                          {result.subtitle && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-sm text-white/40 truncate">
                                {result.subtitle}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow Hint */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">
                        <ArrowRight className="w-5 h-5 text-brand-purple" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length === 0 ? (
            <div className="p-8">
              <div className="mb-8">
                <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4 px-2">
                  {t('search.trending')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Live Matches', 'News', 'Transfers', 'Tables', 'Competitions'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 rounded-full bg-white/5 hover:bg-brand-purple/20 border border-white/5 text-sm text-white/70 hover:text-brand-purple transition-all hover:scale-105 active:scale-95 hover:border-brand-purple/30"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-lg font-medium text-white/60">{t('search.noResults')}</p>
              <p className="text-sm text-white/30 mt-2">{t('search.trySearching')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-center text-xs text-white/30">
          <span className="text-brand-purple/50">Fivescores</span>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Error boundary wrapper for HMR resilience
class SearchModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('SearchModal error (likely HMR):', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Return null when there's an error - modal just won't show
      return null;
    }
    return this.props.children;
  }
}

const SearchModal = (props) => (
  <SearchModalErrorBoundary>
    <SearchModalContent {...props} />
  </SearchModalErrorBoundary>
);

export default SearchModal;
