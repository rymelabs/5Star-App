import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MessageCircle, Heart, Share2 } from 'lucide-react';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';

const NewsArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArticleBySlug, getCommentsForItem, addComment, subscribeToComments, comments } = useNews();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  useEffect(() => {
    if (article?.id) {
      // Load comments using the article's document ID
      getCommentsForItem('article', article.id);
      
      // Subscribe to real-time comments
      const unsubscribe = subscribeToComments('article', article.id);
      return () => unsubscribe();
    }
  }, [article?.id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      // Fetch article by slug (from URL param)
      const articleData = await getArticleBySlug(id);
      if (articleData) {
        setArticle(articleData);
      } else {
        setError('Article not found');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !article?.id) return;

    try {
      setIsCommenting(true);
      await addComment('article', article.id, {
        content: newComment.trim(),
        userId: user.uid,
        userName: user.name
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-dark-700 rounded w-1/3"></div>
          <div className="h-8 bg-dark-700 rounded"></div>
          <div className="h-64 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">❌ {error || 'Article not found'}</div>
        <button onClick={() => navigate('/news')} className="btn-primary">
          Back to News
        </button>
      </div>
    );
  }

  const articleComments = comments[`article_${article.id}`] || [];

  return (
    <div className="p-6 pb-24">
      {/* Back Button */}
      <button
        onClick={() => navigate('/news')}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to News
      </button>

      {/* Article Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-4 leading-tight tracking-tight">
          {article.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {article.author}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(article.publishedAt).toLocaleDateString()}
          </div>
          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
            {article.category}
          </span>
        </div>

        {article.excerpt && (
          <p className="text-gray-300 text-lg leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Article Image */}
      {article.image && (
        <div className="mb-8">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Article Content */}
      <div className="prose prose-invert max-w-none mb-8">
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      </div>

      {/* Article Actions */}
      <div className="flex items-center gap-4 py-4 border-t border-dark-700 mb-8">
        <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors">
          <Heart className="w-5 h-5" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors">
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
        <div className="flex items-center gap-2 text-gray-400">
          <MessageCircle className="w-5 h-5" />
          <span>{articleComments.length} Comments</span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white">Comments</h3>

        {/* Add Comment Form */}
        {user && (
          <form onSubmit={handleAddComment} className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 resize-none"
              rows="3"
            />
            <button
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              className="btn-primary"
            >
              {isCommenting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {articleComments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            articleComments.map((comment) => (
              <div key={comment.id} className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{comment.userName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsArticle;