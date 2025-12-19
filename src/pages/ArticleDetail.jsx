import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, User, Heart, MessageCircle, Send, Share, Bookmark } from 'lucide-react';
import { formatDate, getRelativeTime } from '../utils/dateUtils';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getArticleBySlug, addComment, updateArticle } = useNews();
  const { user } = useAuth();
  
  const [article, setArticle] = useState(null);
  const imageAspectRatioEffective = '2 / 1';
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const foundArticle = getArticleBySlug(slug);
    if (foundArticle) {
      setArticle(foundArticle);
    }
  }, [slug, getArticleBySlug]);

  const handleAddComment = () => {
    if (!comment.trim() || !user || !article) return;

    const newComment = addComment(article.id, { text: comment.trim() }, user);
    setComment('');
    
    // Refresh article data
    const updatedArticle = getArticleBySlug(slug);
    setArticle(updatedArticle);
  };

  const handleLike = () => {
    if (!article) return;
    
    const newLikes = isLiked ? article.likes - 1 : article.likes + 1;
    updateArticle(article.id, { likes: newLikes });
    setIsLiked(!isLiked);
    setArticle({ ...article, likes: newLikes });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In a real app, you'd save this to user preferences
  };

  if (!article) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-pulse">Loading article...</div>
      </div>
    );
  }

  const imageAspectRatioEffective = imageAspectRatio
    ? Math.max(imageAspectRatio, 4 / 3)
    : 4 / 3;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <Share className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full hover:bg-dark-800 transition-colors ${
                isBookmarked ? 'text-accent-500' : 'text-gray-400'
              }`}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <div className="px-6 sm:px-8 lg:px-12 py-6">
        <div className="mb-4">
          <span className="px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
            {article.category}
          </span>
        </div>
        
        <h1 className="text-lg font-bold text-white mb-4 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{article.comments?.length || 0}</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              <span>{article.likes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Image */}
      <div className="overflow-hidden mb-6" style={{ aspectRatio: imageAspectRatioEffective }}>
        <img
          src={article.image}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover blur-xl scale-110 opacity-40"
        />
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-contain -mt-full"
        />
      </div>

      {/* Article Content */}
      <div className="px-6 sm:px-8 lg:px-12 mb-8">
        <div className="prose prose-invert prose-lg max-w-none">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-gray-300 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-dark-700">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-dark-700 text-gray-300 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 sm:px-8 lg:px-12 mb-8">
        <div className="flex items-center justify-center space-x-6 py-4 border-y border-dark-700">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'bg-red-600 text-white'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
            }`}
          >
            <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
            <span>{article.likes}</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors"
          >
            <Share className="w-5 h-5" />
            <span>Share</span>
          </button>
          
          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isBookmarked
                ? 'bg-accent-600 text-white'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
            }`}
          >
            <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-4">
        <h3 className="text-lg font-semibold text-white mb-6">
          Comments ({article.comments?.length || 0})
        </h3>

        {/* Add Comment */}
        {user ? (
          <div className="card p-4 mb-6">
            <div className="flex space-x-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What are your thoughts on this article?"
                  className="input-field w-full h-24 resize-none"
                  rows="4"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-4 mb-6 text-center">
            <p className="text-gray-400 mb-3">
              Sign in to join the conversation
            </p>
            <button
              onClick={() => navigate('/auth/login')}
              className="btn-primary"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {article.comments && article.comments.length > 0 ? (
            article.comments.map((comment) => (
              <div key={comment.id} className="card p-4">
                <div className="flex space-x-3">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-white">
                        {comment.author}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">
                      {comment.text}
                    </p>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-400 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{comment.likes}</span>
                      </button>
                      <button className="text-sm text-gray-500 hover:text-white transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-1">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
