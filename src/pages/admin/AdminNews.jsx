import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../context/NewsContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../context/LanguageContext';
import { slugify } from '../../utils/helpers';
import { ArrowLeft, Plus, Edit, Trash2, Image, FileText, Save, X, Eye, Calendar } from 'lucide-react';

const AdminNews = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { articles, addArticle, deleteArticle } = useNews();
  const { toast, showToast, hideToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image: '',
    category: 'general',
    tags: '',
    featured: false
  });
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, articleId: null, articleTitle: '' });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setLoading(true);
    try {
      const excerpt = formData.summary || formData.content.substring(0, 150) + '...';
      const slug = slugify(formData.title);
      
      const newArticle = {
        title: formData.title,
        slug: slug,
        excerpt: excerpt,
        summary: excerpt,
        content: formData.content,
        image: formData.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        author: 'Admin',
        publishedAt: new Date(),
        featured: formData.featured,
        readTime: Math.ceil(formData.content.split(' ').length / 200),
        views: 0,
        likes: 0,
        comments: []
      };
      
      addArticle(newArticle);
      setFormData({
        title: '',
        summary: '',
        content: '',
        image: '',
        category: 'general',
        tags: '',
        featured: false
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding article:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteArticle = async () => {
    const { articleId } = confirmDelete;
    setConfirmDelete({ isOpen: false, articleId: null, articleTitle: '' });

    try {
      console.log('AdminNews: Attempting to delete article:', articleId);
      await deleteArticle(articleId);
      console.log('AdminNews: Article deleted successfully');
      showToast(t('adminNews.deleteSuccess'), 'success');
    } catch (error) {
      console.error('AdminNews: Failed to delete article:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      const errorMsg = error?.code === 'permission-denied' 
        ? t('adminNews.permissionDenied')
        : error?.message || t('adminNews.deleteFailed');
      showToast(errorMsg, 'error');
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      image: '',
      category: 'general',
      tags: '',
      featured: false
    });
    setShowAddForm(false);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'transfer': return 'text-purple-500 bg-purple-500/20';
      case 'match': return 'text-accent-500 bg-accent-500/20';
      case 'injury': return 'text-red-500 bg-red-500/20';
      case 'interview': return 'text-primary-500 bg-primary-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2">
              <h1 className="admin-header">{t('adminNews.title')}</h1>
              <p className="text-sm text-gray-400">{articles.length} {t('adminNews.articles')}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary w-full flex items-center justify-center text-sm py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('adminNews.addArticle')}
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add Article Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t('adminNews.addNewArticle')}</h3>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminNews.titleLabel')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder={t('adminNews.titlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminNews.summary')}
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="input-field w-full h-20 resize-none"
                  placeholder={t('adminNews.summaryPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminNews.content')} *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="input-field w-full h-40 resize-y"
                  placeholder={t('adminNews.contentPlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminNews.featuredImage')}
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder={t('adminNews.imagePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminNews.category')}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="general">{t('adminNews.general')}</option>
                    <option value="transfer">{t('adminNews.transfer')}</option>
                    <option value="match">{t('adminNews.matchReport')}</option>
                    <option value="injury">{t('adminNews.injury')}</option>
                    <option value="interview">{t('adminNews.interview')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('adminNews.tags')}
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder={t('adminNews.tagsPlaceholder')}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary bg-dark-700 border-dark-600 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{t('adminNews.featuredArticle')}</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('adminNews.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('adminNews.publishing') : t('adminNews.publishArticle')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="card p-4 overflow-hidden">
              <div className="flex items-start gap-4">
                {/* Article Image */}
                <div className="flex-shrink-0 w-24 h-20">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover rounded-lg bg-dark-700"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=160&fit=crop';
                    }}
                  />
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(article.category)}`}>
                        {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                      </span>
                      {article.featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-yellow-500 bg-yellow-500/20 whitespace-nowrap">
                          {t('adminNews.featured')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/news/${article.slug || article.id}`)}
                        className="p-1.5 text-accent-400 hover:text-accent-300 hover:bg-accent-500/10 rounded transition-colors"
                        title={t('adminNews.viewArticle')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/news/edit/${article.id}`)}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        title={t('adminNews.editArticle')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ isOpen: true, articleId: article.id, articleTitle: article.title })}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        title={t('adminNews.deleteArticle')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-2 line-clamp-2 break-words">
                    {article.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2 break-words">
                    {article.excerpt || article.summary}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(article.publishedAt)}</span>
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span>{article.readTime} {t('adminNews.min')}</span>
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Eye className="w-3 h-3 flex-shrink-0" />
                        <span>{article.views || 0}</span>
                      </span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-dark-700 text-gray-400 rounded text-xs whitespace-nowrap">
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-gray-500 whitespace-nowrap">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('adminNews.noArticles')}</h3>
            <p className="text-gray-400 mb-4">{t('adminNews.getStarted')}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              {t('adminNews.publishFirst')}
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, articleId: null, articleTitle: '' })}
        onConfirm={confirmDeleteArticle}
        title={t('adminNews.deleteArticleTitle')}
        message={t('adminNews.deleteConfirm').replace('{title}', confirmDelete.articleTitle)}
        confirmText={t('adminNews.deleteArticleButton')}
        type="danger"
      />

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default AdminNews;