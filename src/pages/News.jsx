import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNews } from '../context/NewsContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Filter, Eye, MessageCircle, Heart, Loader2, ChevronRight, Clock, User, Newspaper } from 'lucide-react';
import SurfaceCard from '../components/ui/SurfaceCard';
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
      if (entries[0].isIntersecting && hasMoreNews && categoryFilter === 'all') {
        loadMoreArticles();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMoreNews, categoryFilter, loadMoreArticles]);

  // Get unique categories - use both context articles and paginated articles
  const categories = useMemo(() => {
    const allArticles = categoryFilter !== 'all' ? articles : paginatedArticles;
    const cats = [...new Set(allArticles.map(article => article.category))];
    return ['all', ...cats];
  }, [articles, paginatedArticles, categoryFilter]);

  // Filter articles - use context articles for filtering, paginated for normal view
  const filteredArticles = useMemo(() => {
    // If user is filtering by category, use context articles (already loaded)
    if (categoryFilter !== 'all') {
      let filtered = articles.filter(article => article.category === categoryFilter);
      return filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    // Otherwise, use paginated articles
    return paginatedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [articles, paginatedArticles, categoryFilter]);

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header Skeleton */}
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
        
        {/* Search Skeleton */}
        <div className="px-4 sm:px-6 mb-6">
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
        </div>

        <div className="w-full mx-auto px-4 sm:px-6 space-y-6">
          {/* Featured Article Skeleton */}
          <div className="aspect-[16/10] sm:aspect-[21/9] rounded-3xl bg-white/5 animate-pulse border border-white/5" />

          {/* Article List Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden h-full flex flex-col">
                <div className="aspect-video bg-white/5 animate-pulse" />
                <div className="p-5 space-y-4 flex-1">
                  <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse" />
                    <div className="h-6 w-1/2 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                  <div className="pt-4 border-t border-white/5 flex justify-between">
                    <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-32 md:pb-24"
    >
      {/* Header with Filter */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <h1 className="page-header flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-brand-purple" />
          {t('pages.news.title')}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
            showFilters 
              ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20' 
              : 'bg-elevated/80 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-xs">{t('common.filter') || 'Filter'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 mb-6">
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-wrap gap-2 p-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize border ${
                  categoryFilter === category
                    ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20'
                    : 'bg-elevated/50 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 mt-4 sm:mt-0">
        {/* Featured Article */}
        {featuredArticle && categoryFilter === 'all' && (
          <SurfaceCard
            interactive
            onClick={() => handleArticleClick(featuredArticle)}
            className="p-0 overflow-hidden group rounded-none bg-[#0c0c0f] border-l-0 border-r-0 border-t border-b border-white/10"
          >
            <div className="relative h-44 sm:h-56 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-brand-purple text-white text-[11px] font-bold rounded-lg shadow-lg shadow-brand-purple/20 uppercase tracking-wider">
                    {featuredArticle.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <Clock className="w-3.5 h-3.5" />
                    {getRelativeTime(featuredArticle.publishedAt)}
                  </span>
                </div>
                <h2 className="font-bold text-white text-lg sm:text-2xl leading-tight line-clamp-2">
                  {featuredArticle.title}
                </h2>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <p className="text-white/60 text-xs sm:text-sm line-clamp-2 mb-2">
                {truncateText(featuredArticle.excerpt || featuredArticle.summary, 120)}
              </p>
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-white/50">
                <span className="truncate">{featuredArticle.author}</span>
                <span className="text-brand-purple font-semibold">Read Article</span>
              </div>
            </div>
          </SurfaceCard>
        )}

        {/* Article List */}
        <div className="news-compact-reset">
          {/* Mobile: flat feed rows. Desktop: keep grid feel via wrapping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-4">
            {remainingArticles.map((article) => (
              <SurfaceCard
                key={article.id}
                className="group p-0 overflow-hidden h-full flex flex-col bg-[#0c0c0f] sm:bg-elevated/30 sm:hover:bg-elevated/50 transition-colors border-0 sm:border sm:border-white/5 rounded-none news-card"
                interactive
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex flex-row sm:flex-col h-full border-b border-white/5 sm:border-b-0">
                  {/* Image Section */}
                  <div className="relative w-16 h-16 sm:w-full sm:h-auto sm:aspect-[16/9] overflow-hidden shrink-0 rounded-lg sm:rounded-none bg-gray-800">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                      <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[8px] font-bold rounded-md uppercase tracking-wider">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-2 sm:p-3 flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/60 mb-1 news-card-meta">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{getRelativeTime(article.publishedAt)}</span>
                    </div>

                    <h3 className="news-card-title font-semibold text-white text-sm sm:text-base line-clamp-2 mb-0.5 leading-snug group-hover:text-brand-purple transition-colors">
                      {article.title}
                    </h3>

                    <p className="hidden sm:block text-white/60 text-[11px] sm:text-xs line-clamp-2 mb-3 flex-1 news-card-body">
                      {truncateText(article.excerpt || article.summary, 80)}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-auto sm:border-t sm:border-white/5">
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-white/70 news-card-meta">
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate max-w-[80px]">{article.author}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-white/50 ml-auto sm:ml-0 news-card-meta">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{article.commentCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{article.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {remainingArticles.length === 0 && !featuredArticle && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('pages.news.noArticlesFound')}</h3>
            <p className="text-white/40">
              {categoryFilter !== 'all' ? 'Try adjusting your filters' : 'No articles available'}
            </p>
          </div>
        )}

        {/* Load More */}
        {categoryFilter === 'all' && hasMoreNews && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {loadingMore ? (
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                <span className="text-sm font-medium text-white/60">{t('pages.news.loadingMoreArticles')}</span>
              </div>
            ) : (
              <button 
                onClick={loadMoreArticles}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all"
              >
                Load More Articles
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default News;
