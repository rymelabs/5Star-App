import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { useFootball } from '../../context/FootballContext';

const SearchModal = ({ onClose, onResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { searchArticles } = useNews();
  const { fixtures, teams } = useFootball();

  useEffect(() => {
    if (query.trim().length > 2) {
      setLoading(true);
      const timeoutId = setTimeout(() => {
        performSearch(query);
        setLoading(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = (searchQuery) => {
    const searchResults = [];
    
    // Search news articles
    const newsResults = searchArticles(searchQuery).map(article => ({
      ...article,
      type: 'news',
      category: 'News',
    }));
    
    // Search fixtures by team names
    const fixtureResults = fixtures
      .filter(fixture => 
        fixture.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fixture.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(fixture => ({
        ...fixture,
        type: 'fixture',
        category: 'Fixture',
        title: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
      }));
    
    // Search teams
    const teamResults = teams
      .filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(team => ({
        ...team,
        type: 'team',
        category: 'Team',
        title: team.name,
      }));
    
    searchResults.push(...newsResults, ...fixtureResults, ...teamResults);
    setResults(searchResults.slice(0, 10)); // Limit to 10 results
  };

  const handleResultClick = (result) => {
    onResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-start justify-center pt-20">
      <div className="bg-dark-800 rounded-lg w-full max-w-md mx-4 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-dark-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search news, fixtures, teams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id || index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-white line-clamp-2">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {result.category}
                      </p>
                      {result.excerpt && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                    </div>
                    {result.image && (
                      <img
                        src={result.image}
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length > 2 ? (
            <div className="p-4 text-center text-gray-400">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              Type to search...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;