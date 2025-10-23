import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MessageCircle, Heart, Share2, Link2, X } from 'lucide-react';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';

const NewsArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArticleBySlug, getCommentsForItem, addComment, subscribeToComments, comments, toggleLike, incrementArticleView } = useNews();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  useEffect(() => {
    if (article?.id) {
      // Increment view count
      incrementArticleView(article.id);
      
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

  const handleLike = async () => {
    if (!user || !article?.id || isLiking) return;

    try {
      setIsLiking(true);
      const result = await toggleLike(article.id, user.uid);
      // Update local article state
      setArticle(prev => ({
        ...prev,
        likes: result.likes,
        likedBy: result.liked 
          ? [...(prev.likedBy || []), user.uid]
          : (prev.likedBy || []).filter(id => id !== user.uid)
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (platform) => {
    const articleUrl = window.location.href;
    const articleTitle = article.title;
    const articleText = article.excerpt || article.summary || '';

    try {
      switch (platform) {
        case 'native':
          // Use Web Share API if available
          if (navigator.share) {
            await navigator.share({
              title: articleTitle,
              text: articleText,
              url: articleUrl
            });
          } else {
            // Fallback to copy link
            await navigator.clipboard.writeText(articleUrl);
            alert('Link copied to clipboard!');
          }
          break;

        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(articleUrl)}`,
            '_blank',
            'width=550,height=420'
          );
          break;

        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
            '_blank',
            'width=550,height=420'
          );
          break;

        case 'whatsapp':
          window.open(
            `https://wa.me/?text=${encodeURIComponent(articleTitle + ' - ' + articleUrl)}`,
            '_blank'
          );
          break;

        case 'telegram':
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`,
            '_blank'
          );
          break;

        case 'copy':
          await navigator.clipboard.writeText(articleUrl);
          alert('Link copied to clipboard!');
          break;

        default:
          break;
      }
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(articleUrl);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
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
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="news-article-layout">
        <article className="news-article-main">
          <header className="mb-8">
            <h1 className="news-article-header">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {article.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
              <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                {article.category}
              </span>
            </div>
            {article.excerpt && (
              <p className="text-gray-300 text-lg leading-relaxed">{article.excerpt}</p>
            )}
          </header>

          {article.image && (
            <div className="mb-8">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>
          )}

          <div className="prose prose-invert max-w-none mb-8 news-article-body">
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>

          <div className="news-article-actions">
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center gap-2 transition-colors ${
                article.likedBy?.includes(user?.uid)
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-400 hover:text-red-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className={`w-5 h-5 ${
                  article.likedBy?.includes(user?.uid) ? 'fill-current' : ''
                }`}
              />
              <span>
                {article.likes || 0} {article.likedBy?.includes(user?.uid) ? 'Liked' : 'Like'}
              </span>
            </button>

            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 min-w-[200px]">
                  <div className="p-2">
                    <div className="text-xs text-gray-400 px-3 py-2 font-medium">
                      Share Article
                    </div>
                    {navigator.share && (
                      <button
                        onClick={() => handleShare('native')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share...</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Copy Link</span>
                    </button>

                    <div className="border-t border-dark-700 my-2" />

                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Twitter/X</span>
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24H12.82v-9.294H9.692V11.01h3.129V8.352c0-3.1 1.893-4.788 4.658-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.697h-3.12V24h6.116C23.407 24 24 23.407 24 22.676V1.324C24 .593 23.407 0 22.676 0" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('telegram')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span>{articleComments.length} Comments</span>
            </div>
          </div>
        </article>

        <aside className="news-article-comments card">
          <h3 className="text-lg font-semibold text-white">
            Comments ({articleComments.length})
          </h3>

          {user ? (
            <form onSubmit={handleAddComment} className="border-t border-dark-700 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
                    disabled={isCommenting}
                  />
                  {newComment.trim() && (
                    <button
                      type="submit"
                      disabled={isCommenting}
                      className="text-primary-500 hover:text-primary-400 font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {isCommenting ? 'Posting...' : 'Post'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="border-t border-dark-700 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">
                    <button
                      onClick={() => navigate('/login')}
                      className="text-primary-500 hover:text-primary-400 font-medium"
                    >
                      Log in
                    </button>
                    {' '}to comment
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {articleComments.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              articleComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {comment.userName}
                      </span>
                      <span className="text-gray-300 text-sm leading-relaxed">
                        {comment.content}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NewsArticle;
