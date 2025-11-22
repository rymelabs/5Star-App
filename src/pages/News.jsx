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
      <div className="min-h-screen bg-background pb-24">
        {/* Header Skeleton */}
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
        
        {/* Search Skeleton */}
        <div className="px-4 sm:px-6 mb-6">
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
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
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="page-header flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-brand-purple" />
          {t('pages.news.title')}
        </h1>
      </div>

      {/* Search & Filter */}
      <div className="px-4 sm:px-6 sticky top-[60px] z-20 mb-6">
        <div className="flex gap-2.5">
          <div className="relative group flex-1">
            <div className="absolute inset-0 bg-brand-purple/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
              <input
                type="text"
                placeholder={`${t('common.search')} ${t('pages.news.title').toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-elevated/80 backdrop-blur-xl border border-white/10 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all shadow-lg"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${
              showFilters 
                ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20' 
                : 'bg-elevated/80 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Featured Article */}
        {featuredArticle && !searchQuery && categoryFilter === 'all' && (
          <div 
            onClick={() => handleArticleClick(featuredArticle)}
            className="group relative aspect-[16/10] sm:aspect-[21/9] rounded-3xl overflow-hidden cursor-pointer border border-white/5 shadow-2xl"
          >
            <img
              src={featuredArticle.image}
              alt={featuredArticle.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-brand-purple text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-purple/20 uppercase tracking-wider">
                  {featuredArticle.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5" />
                  {getRelativeTime(featuredArticle.publishedAt)}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-brand-purple-light transition-colors">
                {featuredArticle.title}
              </h2>
              
              <p className="text-white/70 text-sm sm:text-base line-clamp-2 mb-4 max-w-2xl">
                {featuredArticle.excerpt || featuredArticle.summary}
              </p>

              <div className="flex items-center gap-4 text-xs sm:text-sm font-medium text-white/60">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {featuredArticle.author}
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  {featuredArticle.commentCount || 0}
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  {featuredArticle.likes || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Article List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {remainingArticles.map((article) => (
            <SurfaceCard
              key={article.id}
              className="group p-0 overflow-hidden h-full flex flex-col"
              interactive
              onClick={() => handleArticleClick(article)}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider">
                    {article.category}
                  </span>
                </div>
              </div>
              
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[11px] text-white/50 mb-2">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{getRelativeTime(article.publishedAt)}</span>
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-brand-purple transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-white/50 text-xs sm:text-sm line-clamp-2 mb-3 flex-1">
                  {truncateText(article.excerpt || article.summary, 100)}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-white/60">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate max-w-[90px]">{article.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] text-white/40">
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
            </SurfaceCard>
          ))}
        </div>

        {/* Empty State */}
        {remainingArticles.length === 0 && !featuredArticle && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('pages.news.noArticlesFound')}</h3>
            <p className="text-white/40">
              {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
            </p>
          </div>
        )}

        {/* Load More */}
        {!searchQuery && categoryFilter === 'all' && hasMoreNews && (
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
