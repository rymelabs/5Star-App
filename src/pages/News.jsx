import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Filter, Clock, Eye, MessageCircle, Heart, Loader2 } from 'lucide-react';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import { truncateText, groupBy } from '../utils/helpers';
import { newsCollection, commentsCollection } from '../firebase/firestore';

const News = () => {
  const navigate = useNavigate();
  const { articles } = useNews();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [paginatedArticles, setPaginatedArticles] = useState([]);
  const [newsLastDoc, setNewsLastDoc] = useState(null);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  // Intersection observer for infinite scroll
  const observerRef = useRef(null);
  const loadMoreRef = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreNews && !searchQuery && categoryFilter === 'all') {
        loadMoreArticles();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMoreNews, searchQuery, categoryFilter]);
  
  // Load initial articles
  useEffect(() => {
    if (!initialLoaded) {
      loadInitialArticles();
    }
  }, []);
  
  const loadInitialArticles = async () => {
    try {
      const { articles: newArticles, lastDoc, hasMore } = await newsCollection.getPaginated(20);
      // Attach comment counts for paginated articles (context articles already have counts)
      const articlesWithCounts = await Promise.all(newArticles.map(async (a) => {
        try {
          const count = await commentsCollection.getCountForItem('article', a.id);
          return { ...a, commentCount: count };
        } catch (err) {
          console.error('Error fetching comment count for article', a.id, err);
          return { ...a, commentCount: a.commentCount || 0 };
        }
      }));
      setPaginatedArticles(articlesWithCounts);
      setNewsLastDoc(lastDoc);
      setHasMoreNews(hasMore);
      setInitialLoaded(true);
    } catch (error) {
      console.error('Error loading initial articles:', error);
      setInitialLoaded(true);
    }
  };
  
  const loadMoreArticles = async () => {
    if (!hasMoreNews || loadingMore || !newsLastDoc) return;
    
    setLoadingMore(true);
    try {
      const { articles: newArticles, lastDoc, hasMore } = await newsCollection.getPaginated(20, newsLastDoc);
      const articlesWithCounts = await Promise.all(newArticles.map(async (a) => {
        try {
          const count = await commentsCollection.getCountForItem('article', a.id);
          return { ...a, commentCount: count };
        } catch (err) {
          console.error('Error fetching comment count for article', a.id, err);
          return { ...a, commentCount: a.commentCount || 0 };
        }
      }));
      setPaginatedArticles(prev => [...prev, ...articlesWithCounts]);
      setNewsLastDoc(lastDoc);
      setHasMoreNews(hasMore);
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Get unique categories - use both context articles and paginated articles
  const categories = useMemo(() => {
    const allArticles = searchQuery || categoryFilter !== 'all' ? articles : paginatedArticles;
    const cats = [...new Set(allArticles.map(article => article.category))];
    return ['all', ...cats];
  }, [articles, paginatedArticles, searchQuery, categoryFilter]);

  // Filter articles - use context articles for filtering, paginated for normal view
  const filteredArticles = useMemo(() => {
    // If user is searching or filtering, use context articles (already loaded)
    if (searchQuery.trim() || categoryFilter !== 'all') {
      let filtered = articles;

      if (searchQuery.trim()) {
        filtered = filtered.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (article.excerpt || article.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (article.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (categoryFilter !== 'all') {
        filtered = filtered.filter(article => article.category === categoryFilter);
      }

      return filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    // Otherwise, use paginated articles
    return paginatedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [articles, paginatedArticles, searchQuery, categoryFilter]);

  const handleArticleClick = (article) => {
    navigate(`/news/${article.slug}`);
  };

  const featuredArticle = filteredArticles[0] || null;
  const remainingArticles = filteredArticles.slice(1);

  return (
    <div className="px-4 py-6">
      <div className="news-bento-grid">
        <section className="bento-section news-header">
          <div className="flex items-center justify-between">
            <h1 className="page-header">{t('pages.news.title')}</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>

        <section className="bento-section news-controls">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={`${t('common.search')} ${t('pages.news.title').toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {showFilters && (
            <div className="card p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">{t('pages.news.filterByCategory')}</h3>
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
        </section>

        {featuredArticle && (
          <section className="bento-section news-featured">
            <article
              onClick={() => handleArticleClick(featuredArticle)}
              className="card news-featured-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200"
            >
              <div className="news-featured-card__media">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="news-featured-card__content">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                    {featuredArticle.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getRelativeTime(featuredArticle.publishedAt)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-white mb-3 line-clamp-2">
                  {featuredArticle.title}
                </h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {featuredArticle.excerpt || featuredArticle.summary}
                </p>
                <div className="flex items-center justify-between gap-4 flex-wrap text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>Read more</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>{featuredArticle.commentCount || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      <span>{featuredArticle.likes || 0}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-400">
                    By {featuredArticle.author}
                  </span>
                </div>
              </div>
            </article>
          </section>
        )}

        <section className="bento-section news-list">
          {remainingArticles.length > 0 ? (
            <div className="news-articles-grid">
              {remainingArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="card news-article-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all duration-200"
                >
                  <div className="news-article-card__media">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="news-article-card__content">
                    <div className="flex items-center gap-2 mb-2">
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
                      {truncateText(article.excerpt || article.summary, 100)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          <span>{article.commentCount || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          <span>{article.likes || 0}</span>
                        </div>
                      </div>
                      <span>{article.author}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !featuredArticle && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-2">{t('pages.news.noArticlesFound')}</p>
                <p className="text-sm text-gray-500">
                  {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
                </p>
              </div>
            )
          )}
        </section>

        {!searchQuery && categoryFilter === 'all' && hasMoreNews && (
          <section className="bento-section news-load-more">
            <div ref={loadMoreRef} className="news-load-more__inner">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2 text-primary-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{t('pages.news.loadingMoreArticles')}</span>
                </div>
              ) : (
                <button 
                  onClick={loadMoreArticles}
                  className="btn-primary"
                >
                  Load More Articles
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default News;
