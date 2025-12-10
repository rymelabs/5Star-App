import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MessageCircle, Heart, Share2, Link2, X, Clock, ChevronRight } from 'lucide-react';
import BackButton from '../components/ui/BackButton';
import SurfaceCard from '../components/ui/SurfaceCard';
import NewsExcerpt from './NewsExcerpt';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';
import { getRelativeTime } from '../utils/dateUtils';

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
      <div className="min-h-screen bg-background pb-24">
        {/* Hero Section Skeleton */}
        <div className="relative h-[50vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 via-blue-600/10 to-background animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />

          {/* Navigation Skeleton */}
          <div className="absolute top-0 left-0 right-0 p-6 z-20">
            <div className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl animate-pulse" />
          </div>

          {/* Hero Content Skeleton */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 sm:pb-28 max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="w-20 h-6 bg-brand-purple/60 rounded-lg animate-pulse" />
                <div className="w-24 h-6 bg-black/40 backdrop-blur-md rounded-lg animate-pulse" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="w-full h-8 bg-white/20 rounded-lg animate-pulse" />
                <div className="w-3/4 h-8 bg-white/15 rounded-lg animate-pulse" />
                <div className="w-1/2 h-8 bg-white/10 rounded-lg animate-pulse" />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-brand-purple/20 rounded-full animate-pulse" />
                <div className="w-24 h-4 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="w-full mx-auto px-0 sm:px-4 md:px-6 -mt-16 relative z-10">
          <div className="w-full">
            {/* Article Body Skeleton */}
            <div className="w-full px-0 py-6 sm:px-0 md:py-10">
              {/* Excerpt Skeleton */}
              <div className="w-full h-6 bg-white/10 rounded-lg animate-pulse mb-8 ml-4 border-l-4 border-brand-purple/50" />

              {/* Content Skeleton */}
              <div className="w-full space-y-4">
                <div className="w-full h-4 bg-gray-300/10 rounded animate-pulse" />
                <div className="w-full h-4 bg-gray-300/8 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-gray-300/6 rounded animate-pulse" />
                <div className="w-full h-4 bg-gray-300/10 rounded animate-pulse" />
                <div className="w-4/5 h-4 bg-gray-300/8 rounded animate-pulse" />

                <div className="w-full h-6 bg-white/5 rounded-lg animate-pulse my-6" />

                <div className="w-full h-4 bg-gray-300/10 rounded animate-pulse" />
                <div className="w-full h-4 bg-gray-300/8 rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-gray-300/6 rounded animate-pulse" />
                <div className="w-full h-4 bg-gray-300/10 rounded animate-pulse" />
                <div className="w-2/3 h-4 bg-gray-300/8 rounded animate-pulse" />

                <div className="w-full h-6 bg-white/5 rounded-lg animate-pulse my-6" />

                <div className="w-full h-4 bg-gray-300/10 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-gray-300/8 rounded animate-pulse" />
                <div className="w-full h-4 bg-gray-300/6 rounded animate-pulse" />
              </div>

              {/* Action Bar Skeleton */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-10 bg-white/5 rounded-xl animate-pulse" />
                  <div className="w-16 h-10 bg-white/5 rounded-xl animate-pulse" />
                </div>
                <div className="w-20 h-10 bg-white/5 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section Skeleton */}
        <div className="w-full bg-black/20 backdrop-blur-sm border-t border-white/5 rounded-3xl mt-8">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <div className="w-32 h-8 bg-white/10 rounded-lg animate-pulse" />
              <div className="w-12 h-6 bg-white/5 rounded-full animate-pulse" />
            </div>

            {/* Comment Form Skeleton */}
            <div className="mb-12">
              <div className="bg-elevated rounded-xl p-4 border border-white/10">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-purple/50 to-blue-600/50 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="w-full h-20 bg-white/5 rounded-lg animate-pulse" />
                    <div className="flex justify-end">
                      <div className="w-16 h-8 bg-white/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List Skeleton */}
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-4 bg-white/20 rounded animate-pulse" />
                      <div className="w-16 h-3 bg-gray-500/20 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-300/10 rounded animate-pulse" />
                      <div className="w-4/5 h-4 bg-gray-300/8 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-6 bg-gray-500/10 rounded animate-pulse" />
                      <div className="w-14 h-6 bg-gray-500/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Article not found</h2>
        <p className="text-gray-400 mb-6">{error || "The article you're looking for doesn't exist."}</p>
        <button onClick={() => navigate('/news')} className="px-6 py-2 bg-brand-purple text-white rounded-xl font-medium">
          Back to News
        </button>
      </div>
    );
  }

  const articleComments = comments[`article_${article.id}`] || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-purple/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20">
          <BackButton className="bg-black/20 backdrop-blur-md border-white/10 text-white hover:bg-black/40" />
        </div>

        {/* Hero Content removed; details now placed below image */}
      </div>

      {/* Main Content */}
        <div className="w-full mx-auto px-[13px] sm:px-[20px] lg:px-[36px] -mt-6 relative z-10">
          <div className="w-full max-w-4xl mx-auto mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-brand-purple text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-purple/20 uppercase tracking-wider">
                {article.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5" />
                {getRelativeTime(article.publishedAt)}
              </span>
            </div>
            <h1 className="news-hero-title text-white text-shadow-lg tracking-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center border border-white/10 backdrop-blur-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span>{article.author}</span>
              </div>
            </div>
          </div>
          <div className="w-full">
          {/* Article Body */}
          <div className="w-full">
            <SurfaceCard padding="none" className="!bg-transparent !border-none !shadow-none px-[13px] sm:px-[20px] lg:px-[36px] py-[22px] md:py-[36px] mb-0 rounded-none border-x-0 w-full">
              {article.excerpt && <NewsExcerpt text={article.excerpt} />}
              
              <div className="w-full prose prose-invert prose-xl max-w-none prose-headings:text-white prose-p:text-gray-200 prose-a:text-brand-purple prose-strong:text-white prose-blockquote:border-brand-purple prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg news-article-content">
                <div className="whitespace-pre-wrap font-sans w-full leading-8 text-gray-100">
                  {article.content}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLike}
                    disabled={!user || isLiking}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      article.likedBy?.includes(user?.uid)
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        article.likedBy?.includes(user?.uid) ? 'fill-current' : ''
                      }`}
                    />
                    <span className="font-medium">
                      {article.likes || 0}
                    </span>
                  </button>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/5 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">{articleComments.length}</span>
                  </div>
                </div>

                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm bg-brand-purple text-white shadow-lg shadow-brand-purple/20 hover:bg-brand-purple/90 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline">Share</span>
                  </button>

                  {showShareMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-elevated border border-white/10 rounded-xl shadow-2xl z-50 min-w-[200px] overflow-hidden backdrop-blur-xl">
                      <div className="p-1">
                        <div className="text-xs text-gray-400 px-3 py-2 font-medium border-b border-white/5">
                          Share Article
                        </div>
                        {navigator.share && (
                          <button
                            onClick={() => handleShare('native')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share...</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                          <span>Copy Link</span>
                        </button>

                        <div className="border-t border-white/5 my-1" />

                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          <span>Twitter/X</span>
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24H12.82v-9.294H9.692V11.01h3.129V8.352c0-3.1 1.893-4.788 4.658-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.697h-3.12V24h6.116C23.407 24 24 23.407 24 22.676V1.324C24 .593 23.407 0 22.676 0" />
                          </svg>
                          <span>Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          <span>Telegram</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SurfaceCard>

            {/* Comments Section */}
            <div className="w-full bg-black/20 backdrop-blur-sm border-t border-white/5 rounded-3xl">
              <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    Discussion
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-sm font-medium text-gray-400">
                      {articleComments.length}
                    </span>
                  </h3>
                </div>

                {user ? (
                  <form onSubmit={handleAddComment} className="mb-8 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-purple to-blue-600 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                    <div className="relative bg-elevated rounded-xl p-3 border border-white/10">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-black/50">
                          <span className="text-white font-bold text-xs">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="What are your thoughts?"
                            className="w-full bg-transparent border-none p-2 text-white placeholder-gray-500 focus:ring-0 transition-all resize-none min-h-[70px] text-sm sm:text-base focus:outline-none"
                            disabled={isCommenting}
                          />
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                            <p className="text-[11px] text-gray-500">Be respectful and follow our guidelines.</p>
                            <button
                              type="submit"
                              disabled={isCommenting || !newComment.trim()}
                              className="px-5 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-white/20 disabled:text-gray-500 text-sm font-bold rounded-full transition-all transform active:scale-95"
                            >
                              {isCommenting ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-brand-purple/10 to-blue-600/10 border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold text-white mb-2">Join the conversation</h4>
                      <p className="text-gray-400 mb-5 max-w-md mx-auto text-sm">Sign in to share your thoughts, reply to others, and be part of the community.</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-7 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                      >
                        Sign in to comment
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {articleComments.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-400 text-base">No comments yet.</p>
                      <p className="text-gray-600 text-sm">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    articleComments.map((comment) => (
                      <div key={comment.id} className="group animate-fadeIn">
                        <div className="flex gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm hover:text-brand-purple cursor-pointer transition-colors">
                                  {comment.userName}
                                </span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">
                                  {getRelativeTime(comment.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-2.5">
                              {comment.content}
                            </div>
                            <div className="flex items-center gap-3">
                              <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-white transition-colors group/btn">
                                <Heart className="w-3 h-3 group-hover/btn:text-red-500 transition-colors" />
                                <span>Like</span>
                              </button>
                              <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-white transition-colors">
                                <MessageCircle className="w-3 h-3" />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Divider */}
                        <div className="h-px bg-white/5 mt-5 ml-12" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Related/Trending - Placeholder for now or remove if not needed) */}
          {/* <div className="lg:col-span-4 space-y-6">
             
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default NewsArticle;
