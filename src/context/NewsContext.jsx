import React, { createContext, useContext, useState, useEffect } from 'react';
import { newsCollection, commentsCollection } from '../firebase/firestore';

const NewsContext = createContext();

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export const NewsProvider = ({ children }) => {
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const articlesData = await newsCollection.getAll();
      setArticles(articlesData);
    } catch (error) {
      console.error('Error loading articles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getArticleById = async (articleId) => {
    try {
      return await newsCollection.getById(articleId);
    } catch (error) {
      console.error('Error getting article:', error);
      throw error;
    }
  };

  const getArticleBySlug = async (slug) => {
    try {
      return await newsCollection.getBySlug(slug);
    } catch (error) {
      console.error('Error getting article by slug:', error);
      throw error;
    }
  };

  const addArticle = async (articleData) => {
    try {
      const articleId = await newsCollection.add(articleData);
      const newArticle = { 
        id: articleId, 
        ...articleData,
        publishedAt: new Date()
      };
      setArticles(prev => [newArticle, ...prev]);
      return newArticle;
    } catch (error) {
      console.error('Error adding article:', error);
      throw error;
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
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
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

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const updateArticle = async (articleId, articleData) => {
    try {
      await newsCollection.update(articleId, articleData);
      setArticles(prev => prev.map(article => 
        article.id === articleId ? { ...article, ...articleData } : article
      ));
      return true;
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  };

  const deleteArticle = async (articleId) => {
    try {
      await newsCollection.delete(articleId);
      setArticles(prev => prev.filter(article => article.id !== articleId));
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  };

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
    articles,
    comments,
    loading,
    error,
    getArticleById,
    getArticleBySlug,
    addArticle,
    updateArticle,
    deleteArticle,
    getCommentsForItem,
    addComment,
    subscribeToComments,
    refreshArticles: loadArticles
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};