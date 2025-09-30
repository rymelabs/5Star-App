import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { Search, Filter, Clock, Eye, MessageCircle, Heart } from 'lucide-react';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import { truncateText, groupBy } from '../utils/helpers';

const News = () => {
  const navigate = useNavigate();
  const { articles } = useNews();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(articles.map(article => article.category))];
    return ['all', ...cats];
  }, [articles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    if (searchQuery.trim()) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(article => article.category === categoryFilter);
    }

    return filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [articles, searchQuery, categoryFilter]);

  const handleArticleClick = (article) => {
    navigate(`/news/${article.slug}`);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">News</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
        >
          <Filter className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search news articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  categoryFilter === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="space-y-6">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, index) => (
            <article
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className={`card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200 ${
                index === 0 ? 'p-0' : 'p-4'
              }`}
            >
              {index === 0 ? (
                /* Featured Article (First one) */
                <>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(article.publishedAt)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-400 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>Read more</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span>{article.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          <span>{article.likes}</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-400">
                        By {article.author}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Regular Articles */
                <div className="flex space-x-4">
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-dark-700 text-gray-300 text-xs font-medium rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {truncateText(article.excerpt, 100)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          <span>{article.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          <span>{article.likes}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {article.author}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-2">No articles found</p>
            <p className="text-sm text-gray-500">
              {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Load More Button (for future pagination) */}
      {filteredArticles.length > 10 && (
        <div className="text-center mt-8">
          <button className="btn-primary">
            Load More Articles
          </button>
        </div>
      )}
    </div>
  );
};

export default News;