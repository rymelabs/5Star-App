import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useFootball } from '../context/FootballContext';
import { ChevronRight, Calendar, Trophy } from 'lucide-react';

const LatestSimple = () => {
  const navigate = useNavigate();
  
  // Safely get context data
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

  return (
    <div className="px-4 py-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="page-header mb-2">Latest Updates</h1>
        <p className="text-gray-400">Welcome to the 5Star Sports App!</p>
      </div>
      
      {/* Debug Info */}
      <div className="card p-4 mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Debug Info</h3>
        <p className="text-gray-400 text-sm">Articles: {articles.length}</p>
        <p className="text-gray-400 text-sm">Fixtures: {fixtures.length}</p>
        <p className="text-gray-400 text-sm">League Table: {leagueTable.length}</p>
      </div>
      
      {/* News Section */}
      {articles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[30px] font-semibold text-primary-500">Latest News</h1>
            <button
              onClick={() => navigate('/news')}
              className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="space-y-4">
            {articles.slice(0, 2).map((article) => (
              <div key={article.id} className="card p-4">
                <h3 className="font-semibold text-white mb-2">{article.title}</h3>
                <p className="text-gray-400 text-sm">{article.category}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/fixtures')}
          className="card p-4 text-center hover:bg-dark-700 transition-colors"
        >
          <Calendar className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="text-white font-medium">Fixtures</p>
        </button>
        
        <button
          onClick={() => navigate('/news')}
          className="card p-4 text-center hover:bg-dark-700 transition-colors"
        >
          <Trophy className="w-8 h-8 text-accent-500 mx-auto mb-2" />
          <p className="text-white font-medium">News</p>
        </button>
      </div>
    </div>
  );
};

export default LatestSimple;