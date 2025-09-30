import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  articles: [],
  loading: false,
  error: null,
};

// Actions
const NEWS_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ARTICLES: 'SET_ARTICLES',
  ADD_ARTICLE: 'ADD_ARTICLE',
  UPDATE_ARTICLE: 'UPDATE_ARTICLE',
  DELETE_ARTICLE: 'DELETE_ARTICLE',
  ADD_COMMENT: 'ADD_COMMENT',
  UPDATE_COMMENT: 'UPDATE_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
};

// Reducer
const newsReducer = (state, action) => {
  switch (action.type) {
    case NEWS_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case NEWS_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case NEWS_ACTIONS.SET_ARTICLES:
      return { ...state, articles: action.payload };
    case NEWS_ACTIONS.ADD_ARTICLE:
      return { ...state, articles: [action.payload, ...state.articles] };
    case NEWS_ACTIONS.UPDATE_ARTICLE:
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.id ? { ...article, ...action.payload } : article
        ),
      };
    case NEWS_ACTIONS.DELETE_ARTICLE:
      return {
        ...state,
        articles: state.articles.filter(article => article.id !== action.payload),
      };
    case NEWS_ACTIONS.ADD_COMMENT:
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.articleId
            ? { ...article, comments: [...(article.comments || []), action.payload.comment] }
            : article
        ),
      };
    case NEWS_ACTIONS.UPDATE_COMMENT:
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.articleId
            ? {
                ...article,
                comments: article.comments.map(comment =>
                  comment.id === action.payload.commentId
                    ? { ...comment, ...action.payload.updates }
                    : comment
                ),
              }
            : article
        ),
      };
    case NEWS_ACTIONS.DELETE_COMMENT:
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.articleId
            ? {
                ...article,
                comments: article.comments.filter(comment => comment.id !== action.payload.commentId),
              }
            : article
        ),
      };
    default:
      return state;
  }
};

// Context
const NewsContext = createContext();

// Provider component
export const NewsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(newsReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedArticles = localStorage.getItem('5star_news_articles');
    if (savedArticles) {
      try {
        const articles = JSON.parse(savedArticles);
        dispatch({ type: NEWS_ACTIONS.SET_ARTICLES, payload: articles });
      } catch (error) {
        console.error('Error loading news articles:', error);
      }
    } else {
      // Initialize with mock data
      initializeMockData();
    }
  }, []);

  // Save articles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('5star_news_articles', JSON.stringify(state.articles));
  }, [state.articles]);

  // Initialize with mock data
  const initializeMockData = () => {
    const mockArticles = [
      {
        id: 1,
        title: 'Premier League Season Kicks Off with Exciting Matches',
        slug: 'premier-league-season-kicks-off',
        excerpt: 'The new Premier League season has started with some thrilling matches and unexpected results...',
        content: 'The new Premier League season has started with some thrilling matches and unexpected results. Manchester City opened their campaign with a convincing 3-0 victory over newly promoted Sheffield United, while Arsenal managed a hard-fought 2-1 win against Nottingham Forest. Liverpool faced a tough challenge against Chelsea, resulting in a 1-1 draw at Stamford Bridge. The season promises to be one of the most competitive in recent years, with several teams making significant signings during the summer transfer window.',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        author: 'Sports Editor',
        publishedAt: new Date().toISOString(),
        category: 'Premier League',
        tags: ['Premier League', 'Season Start', 'Football'],
        comments: [],
        likes: 42,
      },
      {
        id: 2,
        title: 'Transfer Window Closes with Record-Breaking Deals',
        slug: 'transfer-window-closes-record-breaking-deals',
        excerpt: 'The summer transfer window has closed with several record-breaking deals that have reshaped the football landscape...',
        content: 'The summer transfer window has closed with several record-breaking deals that have reshaped the football landscape. The most notable move was the €100 million transfer of Jude Bellingham to Real Madrid, making him one of the most expensive English players of all time. Manchester United secured the services of Mason Mount from Chelsea for €64 million, while Arsenal strengthened their midfield with the addition of Declan Rice for a club-record fee. Liverpool made a surprise move for Alexis Mac Allister from Brighton, adding depth to their midfield options.',
        image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        author: 'Transfer Specialist',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'Transfers',
        tags: ['Transfers', 'Summer Window', 'Deals'],
        comments: [],
        likes: 78,
      },
      {
        id: 3,
        title: 'Young Talents Making Their Mark in Professional Football',
        slug: 'young-talents-making-mark-professional-football',
        excerpt: 'A new generation of young players is emerging and making significant impacts in professional football...',
        content: 'A new generation of young players is emerging and making significant impacts in professional football across Europe. Players like Pedri at Barcelona, Phil Foden at Manchester City, and Bukayo Saka at Arsenal are leading the charge for their respective teams. These talented individuals are not only contributing to their clubs\' success but also representing their national teams at the highest level. The focus on youth development in football academies is paying dividends, with clubs investing heavily in nurturing the next generation of stars.',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        author: 'Youth Development Reporter',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'Youth Football',
        tags: ['Youth', 'Talents', 'Development'],
        comments: [],
        likes: 35,
      },
    ];

    dispatch({ type: NEWS_ACTIONS.SET_ARTICLES, payload: mockArticles });
  };

  // Add article
  const addArticle = (articleData) => {
    const newArticle = {
      id: Date.now(),
      ...articleData,
      publishedAt: new Date().toISOString(),
      comments: [],
      likes: 0,
    };
    dispatch({ type: NEWS_ACTIONS.ADD_ARTICLE, payload: newArticle });
    return newArticle;
  };

  // Update article
  const updateArticle = (articleId, updates) => {
    dispatch({
      type: NEWS_ACTIONS.UPDATE_ARTICLE,
      payload: { id: articleId, ...updates },
    });
  };

  // Delete article
  const deleteArticle = (articleId) => {
    dispatch({ type: NEWS_ACTIONS.DELETE_ARTICLE, payload: articleId });
  };

  // Add comment to article
  const addComment = (articleId, commentData, user) => {
    const newComment = {
      id: Date.now(),
      ...commentData,
      author: user.name,
      authorAvatar: user.avatar,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    dispatch({
      type: NEWS_ACTIONS.ADD_COMMENT,
      payload: { articleId, comment: newComment },
    });
    return newComment;
  };

  // Update comment
  const updateComment = (articleId, commentId, updates) => {
    dispatch({
      type: NEWS_ACTIONS.UPDATE_COMMENT,
      payload: { articleId, commentId, updates },
    });
  };

  // Delete comment
  const deleteComment = (articleId, commentId) => {
    dispatch({
      type: NEWS_ACTIONS.DELETE_COMMENT,
      payload: { articleId, commentId },
    });
  };

  // Get article by slug
  const getArticleBySlug = (slug) => {
    return state.articles.find(article => article.slug === slug);
  };

  // Get articles by category
  const getArticlesByCategory = (category) => {
    return state.articles.filter(article => article.category === category);
  };

  // Search articles
  const searchArticles = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return state.articles.filter(
      article =>
        article.title.toLowerCase().includes(lowercaseQuery) ||
        article.excerpt.toLowerCase().includes(lowercaseQuery) ||
        article.content.toLowerCase().includes(lowercaseQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const value = {
    ...state,
    addArticle,
    updateArticle,
    deleteArticle,
    addComment,
    updateComment,
    deleteComment,
    getArticleBySlug,
    getArticlesByCategory,
    searchArticles,
  };

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};

// Hook to use news context
export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export default NewsContext;