import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';

const SearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const { articles } = useNews();
  const { teams, fixtures } = useFootball();

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(query.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFixtures = fixtures.filter(fixture =>
    fixture.homeTeam.toLowerCase().includes(query.toLowerCase()) ||
    fixture.awayTeam.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-black/30 backdrop-blur-[26px] border border-gray-700/50 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-700/50">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, teams, fixtures..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none tracking-tight"
            autoFocus
          />
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {query && (
            <>
              {/* Articles */}
              {filteredArticles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-primary-500 mb-2 tracking-tight">Articles</h3>
                  <div className="space-y-2">
                    {filteredArticles.slice(0, 3).map(article => (
                      <div key={article.id} className="p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
                        <p className="text-sm font-medium text-white tracking-tight line-clamp-1">{article.title}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{article.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams */}
              {filteredTeams.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-primary-500 mb-2 tracking-tight">Teams</h3>
                  <div className="space-y-2">
                    {filteredTeams.slice(0, 3).map(team => (
                      <div key={team.id} className="p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center">
                          <img src={team.logo} alt={team.name} className="w-6 h-6 mr-3" />
                          <p className="text-sm font-medium text-white tracking-tight">{team.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixtures */}
              {filteredFixtures.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-primary-500 mb-2 tracking-tight">Fixtures</h3>
                  <div className="space-y-2">
                    {filteredFixtures.slice(0, 3).map(fixture => (
                      <div key={fixture.id} className="p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
                        <p className="text-sm font-medium text-white tracking-tight">
                          {fixture.homeTeam} vs {fixture.awayTeam}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(fixture.dateTime).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {filteredArticles.length === 0 && filteredTeams.length === 0 && filteredFixtures.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No results found for "{query}"</p>
                </div>
              )}
            </>
          )}

          {!query && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Start typing to search...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;