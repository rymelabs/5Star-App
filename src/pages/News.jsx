import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Filter, Eye, MessageCircle, Heart, Loader2 } from 'lucide-react';
import { getRelativeTime } from '../utils/dateUtils';
import { truncateText } from '../utils/helpers';
import { newsCollection, commentsCollection } from '../firebase/firestore';
import { getCachedItem, setCachedItem } from '../utils/cache';

const NEWS_CACHE_KEY = 'cache:news-page';

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') {
      const nanos = typeof value.nanoseconds === 'number' ? value.nanoseconds / 1e6 : 0;
      return value.seconds * 1000 + nanos;
    }
  }
  return null;
};

const serializeTimestamp = (value) => {
  const millis = toMillis(value);
  return typeof millis === 'number' ? new Date(millis).toISOString() : null;
};

const sanitizeArticles = (articles = []) => articles.map((article) => {
  const sanitized = { ...article };
  delete sanitized._doc;
  if (sanitized.updatedAt) {
    sanitized.updatedAt = serializeTimestamp(sanitized.updatedAt) || sanitized.updatedAt;
  }
  if (sanitized.publishedAt) {
    sanitized.publishedAt = serializeTimestamp(sanitized.publishedAt) || sanitized.publishedAt;
  }
  if (sanitized.createdAt) {
    sanitized.createdAt = serializeTimestamp(sanitized.createdAt) || sanitized.createdAt;
  }
  return sanitized;
});

const computeLatestArticleTimestamp = (articles = []) => {
  return articles.reduce((acc, article) => {
    const timestamp = toMillis(article.updatedAt) || toMillis(article.publishedAt) || toMillis(article.createdAt);
    if (typeof timestamp === 'number' && timestamp > acc) {
      return timestamp;
    }
    return acc;
  }, 0);
};

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
  const cachedCursorIdRef = useRef(null);
  
  const persistNewsCache = useCallback((articlesList, hasMoreValue, lastDocValue) => {
    const latestUpdatedAt = computeLatestArticleTimestamp(articlesList);
    setCachedItem(NEWS_CACHE_KEY, {
      articles: articlesList,
      hasMore: hasMoreValue,
      lastDocId: lastDocValue || null,
      latestUpdatedAt
    });
  }, []);

  const hydrateNewsFromCache = useCallback((cache) => {
    setPaginatedArticles(cache.articles || []);
    setHasMoreNews(cache.hasMore ?? true);
    cachedCursorIdRef.current = cache.lastDocId || null;
    setInitialLoaded(true);
  }, []);

  const rehydrateNewsCursor = useCallback(async (cache) => {
    if (!cache?.lastDocId || newsLastDoc) return;
    const snapshot = await newsCollection.getDocSnapshot(cache.lastDocId);
    if (snapshot) {
      setNewsLastDoc(snapshot);
    }
  }, [newsLastDoc]);

  const enhanceWithCommentCounts = useCallback(async (items) => {
    return Promise.all(items.map(async (article) => {
      try {
        const count = await commentsCollection.getCountForItem('article', article.id);
        return { ...article, commentCount: count };
      } catch (err) {
        console.error('Error fetching comment count for article', article.id, err);
        return { ...article, commentCount: article.commentCount || 0 };
      }
    }));
  }, []);

  const loadInitialArticles = useCallback(async () => {
    try {
      const { articles: newArticles, lastDoc, hasMore } = await newsCollection.getPaginated(20);
      const articlesWithCounts = await enhanceWithCommentCounts(newArticles);
      const sanitizedArticles = sanitizeArticles(articlesWithCounts);
      setPaginatedArticles(sanitizedArticles);
      setNewsLastDoc(lastDoc);
      setHasMoreNews(hasMore);
      setInitialLoaded(true);
      const lastDocId = lastDoc?.id || null;
      cachedCursorIdRef.current = lastDocId;
      persistNewsCache(sanitizedArticles, hasMore, lastDocId);
    } catch (error) {
      console.error('Error loading initial articles:', error);
      setInitialLoaded(true);
    }
  }, [enhanceWithCommentCounts, persistNewsCache]);

  useEffect(() => {
    let isMounted = true;
    const cached = getCachedItem(NEWS_CACHE_KEY);
    if (cached?.articles?.length) {
      hydrateNewsFromCache(cached);
      rehydrateNewsCursor(cached);
    }

    const checkFreshnessAndLoad = async () => {
      if (!cached?.articles?.length) {
        await loadInitialArticles();
        return;
      }

      try {
        const latestRemote = await newsCollection.getLatestUpdatedAt();
        if (!isMounted) return;
        const cachedTimestamp = cached.latestUpdatedAt || 0;
        if (!latestRemote || latestRemote <= cachedTimestamp) {
          return;
        }
        await loadInitialArticles();
      } catch (error) {
        console.error('Error validating news cache:', error);
      }
    };

    checkFreshnessAndLoad();

    return () => {
      isMounted = false;
    };
  }, [hydrateNewsFromCache, loadInitialArticles, rehydrateNewsCursor]);

  const loadMoreArticles = useCallback(async () => {
    if (!hasMoreNews || loadingMore) return;

    setLoadingMore(true);
    try {
      let cursor = newsLastDoc;
      if (!cursor && cachedCursorIdRef.current) {
        cursor = await newsCollection.getDocSnapshot(cachedCursorIdRef.current);
        if (cursor) {
          setNewsLastDoc(cursor);
        }
      }

      if (!cursor) {
        return;
      }

      const { articles: newArticles, lastDoc, hasMore } = await newsCollection.getPaginated(20, cursor);
      const articlesWithCounts = await enhanceWithCommentCounts(newArticles);
      const sanitized = sanitizeArticles(articlesWithCounts);
      const lastDocId = lastDoc?.id || cachedCursorIdRef.current;
      setPaginatedArticles(prev => {
        const merged = [...prev, ...sanitized];
        cachedCursorIdRef.current = lastDocId || null;
        persistNewsCache(merged, hasMore, cachedCursorIdRef.current);
        return merged;
      });
      setNewsLastDoc(lastDoc);
      setHasMoreNews(hasMore);
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreNews, loadingMore, newsLastDoc, enhanceWithCommentCounts, persistNewsCache]);

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
  }, [loadingMore, hasMoreNews, searchQuery, categoryFilter, loadMoreArticles]);

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

  if (!initialLoaded) {
    return (
      <div className="px-4 py-6">
        <div className="news-bento-grid">
          <section className="bento-section news-header">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
              <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
            </div>
          </section>

          <section className="bento-section news-controls">
            <div className="h-11 w-full rounded-xl bg-white/5 animate-pulse" />
            <div className="card p-4">
              <div className="h-4 w-32 bg-white/10 rounded-full animate-pulse mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            </div>
          </section>

          <section className="bento-section news-featured">
            <div className="card news-featured-card overflow-hidden">
              <div className="news-featured-card__media bg-white/5 animate-pulse" />
              <div className="news-featured-card__content space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-4 w-24 rounded-full bg-white/5 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-5 w-2/3 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-4 w-full bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                  <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </section>

          <section className="bento-section news-list">
            <div className="news-articles-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="card news-article-card overflow-hidden">
                  <div className="news-article-card__media bg-white/5 animate-pulse" />
                  <div className="news-article-card__content space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-20 rounded-full bg-white/10 animate-pulse" />
                      <div className="h-4 w-16 rounded-full bg-white/5 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((__, lineIdx) => (
                        <div key={lineIdx} className="h-4 w-full bg-white/5 rounded animate-pulse" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

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
