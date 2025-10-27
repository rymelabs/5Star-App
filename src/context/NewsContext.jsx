import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { newsCollection, commentsCollection, appSettingsCollection } from '../firebase/firestore';

const NewsContext = createContext();

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export const NewsProvider = ({ children }) => {
  const [allArticles, setAllArticles] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsSettings, setNewsSettings] = useState({ allowAdminNews: false });

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await appSettingsCollection.getNewsSettings();
        setNewsSettings(settings || { allowAdminNews: false });
      } catch (settingsError) {
        console.error('Error loading news settings:', settingsError);
      }
    };

    loadSettings();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const articlesData = await newsCollection.getAll();
      const articlesWithCounts = await Promise.all(
        articlesData.map(async (article) => {
          const commentCount = await commentsCollection.getCountForItem('article', article.id);
          return {
            ...article,
            commentCount
          };
        })
      );
      setAllArticles(articlesWithCounts);
    } catch (loadError) {
      console.error('Error loading articles:', loadError);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const getArticleById = async (articleId) => {
    try {
      return await newsCollection.getById(articleId);
    } catch (articleError) {
      console.error('Error getting article:', articleError);
      throw articleError;
    }
  };

  const getArticleBySlug = async (slug) => {
    try {
      return await newsCollection.getBySlug(slug);
    } catch (slugError) {
      console.error('Error getting article by slug:', slugError);
      throw slugError;
    }
  };

  const addArticle = async (articleData) => {
    try {
      const articleId = await newsCollection.add(articleData);
      const savedArticle = await newsCollection.getById(articleId);
      const enrichedArticle = { ...savedArticle, commentCount: 0 };
      setAllArticles(prev => [enrichedArticle, ...prev]);
      return enrichedArticle;
    } catch (addError) {
      console.error('Error adding article:', addError);
      throw addError;
    }
  };

  const getCommentsForItem = async (itemType, itemId) => {
    try {
      const itemComments = await commentsCollection.getForItem(itemType, itemId);
      setComments(prev => ({
        ...prev,
        [`${itemType}_${itemId}`]: itemComments
      }));
      return itemComments;
    } catch (commentsError) {
      console.error('Error getting comments:', commentsError);
      throw commentsError;
    }
  };

  const addComment = async (itemType, itemId, commentData) => {
    try {
      const commentId = await commentsCollection.add({
        ...commentData,
        itemType,
        itemId
      });

      const newComment = {
        id: commentId,
        ...commentData,
        itemType,
        itemId,
        createdAt: new Date()
      };

      const key = `${itemType}_${itemId}`;
      setComments(prev => ({
        ...prev,
        [key]: [newComment, ...(prev[key] || [])]
      }));

      if (itemType === 'article') {
        setAllArticles(prev => prev.map(article =>
          article.id === itemId
            ? { ...article, commentCount: (article.commentCount || 0) + 1 }
            : article
        ));
      }

      return newComment;
    } catch (commentError) {
      console.error('Error adding comment:', commentError);
      throw commentError;
    }
  };

  const updateArticle = async (articleId, articleData) => {
    try {
      await newsCollection.update(articleId, articleData);
      const updatedArticle = await newsCollection.getById(articleId);
      let commentCount = 0;
      setAllArticles(prev => prev.map(article => {
        if (article.id === articleId) {
          commentCount = article.commentCount ?? 0;
          return { ...updatedArticle, commentCount };
        }
        return article;
      }));
      return { ...updatedArticle, commentCount };
    } catch (updateError) {
      console.error('Error updating article:', updateError);
      throw updateError;
    }
  };

  const deleteArticle = async (articleId) => {
    try {
      const articleIdStr = String(articleId);
      await newsCollection.delete(articleIdStr);
      setAllArticles(prev => prev.filter(article => String(article.id) !== articleIdStr));
      return true;
    } catch (deleteError) {
      console.error('Error deleting article:', deleteError);
      throw deleteError;
    }
  };

  const toggleLike = async (articleId, userId) => {
    try {
      const result = await newsCollection.toggleLike(articleId, userId);
      setAllArticles(prev => prev.map(article =>
        article.id === articleId
          ? {
              ...article,
              likes: result.likes,
              likedBy: result.liked
                ? [...(article.likedBy || []), userId]
                : (article.likedBy || []).filter(id => id !== userId)
            }
          : article
      ));
      return result;
    } catch (likeError) {
      console.error('Error toggling like:', likeError);
      throw likeError;
    }
  };

  const incrementArticleView = async (articleId) => {
    try {
      const newViewCount = await newsCollection.incrementView(articleId);
      if (newViewCount !== undefined) {
        setAllArticles(prev => prev.map(article =>
          article.id === articleId
            ? { ...article, views: newViewCount }
            : article
        ));
      }
      return newViewCount;
    } catch (viewError) {
      console.error('Error incrementing view count:', viewError);
    }
  };

  const approveArticle = async (articleId, { userId, userName }) => {
    try {
      await newsCollection.update(articleId, {
        status: 'published',
        approvedBy: userId,
        approvedByName: userName,
        approvedAt: new Date(),
        publishedAt: new Date(),
        rejectedBy: null,
        rejectedByName: null,
        rejectedAt: null,
        rejectionReason: null
      });
      const updatedArticle = await newsCollection.getById(articleId);
      let commentCount = 0;
      setAllArticles(prev => prev.map(article => {
        if (article.id === articleId) {
          commentCount = article.commentCount ?? 0;
          return { ...updatedArticle, commentCount };
        }
        return article;
      }));
      return { ...updatedArticle, commentCount };
    } catch (approveError) {
      console.error('Error approving article:', approveError);
      throw approveError;
    }
  };

  const rejectArticle = async (articleId, { userId, userName, reason = '' }) => {
    try {
      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      await newsCollection.update(articleId, {
        status: 'rejected',
        rejectedBy: userId,
        rejectedByName: userName,
        rejectedAt: new Date(),
        rejectionReason: trimmedReason || null,
        approvedBy: null,
        approvedByName: null,
        approvedAt: null,
        publishedAt: null
      });
      const updatedArticle = await newsCollection.getById(articleId);
      let commentCount = 0;
      setAllArticles(prev => prev.map(article => {
        if (article.id === articleId) {
          commentCount = article.commentCount ?? 0;
          return { ...updatedArticle, commentCount };
        }
        return article;
      }));
      return { ...updatedArticle, commentCount };
    } catch (rejectError) {
      console.error('Error rejecting article:', rejectError);
      throw rejectError;
    }
  };

  const updateNewsSettings = async (updates) => {
    try {
      const newSettings = { ...newsSettings, ...updates };
      await appSettingsCollection.updateNewsSettings(newSettings);
      setNewsSettings(newSettings);
      return newSettings;
    } catch (settingsError) {
      console.error('Error updating news settings:', settingsError);
      throw settingsError;
    }
  };

  const publishedArticles = useMemo(
    () => allArticles.filter(article => (article.status || 'published') === 'published'),
    [allArticles]
  );

  const subscribeToComments = (itemType, itemId) => {
    return commentsCollection.onSnapshot(itemType, itemId, (updatedComments) => {
      const key = `${itemType}_${itemId}`;
      setComments(prev => ({
        ...prev,
        [key]: updatedComments
      }));
    });
  };

  const value = {
    articles: publishedArticles,
    allArticles,
    comments,
    loading,
    error,
    newsSettings,
    getArticleById,
    getArticleBySlug,
    addArticle,
    updateArticle,
    deleteArticle,
    toggleLike,
    incrementArticleView,
    getCommentsForItem,
    addComment,
    approveArticle,
    rejectArticle,
    updateNewsSettings,
    subscribeToComments,
    refreshArticles: loadArticles
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};
