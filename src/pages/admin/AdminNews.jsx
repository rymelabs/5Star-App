import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../context/NewsContext';
import { useAuth } from '../../context/AuthContext';
import { useSoftDelete } from '../../hooks/useSoftDelete';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import AdminPageLayout from '../../components/AdminPageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { slugify } from '../../utils/helpers';
import {
  Plus,
  Edit,
  Trash2,
  Image,
  Link,
  FileText,
  Save,
  X,
  Eye,
  Calendar,
  ToggleRight,
  ToggleLeft
} from 'lucide-react';
import { uploadImage, validateImageFile } from '../../services/imageUploadService';

const AdminNews = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    allArticles,
    addArticle,
    approveArticle,
    rejectArticle,
    newsSettings,
    updateNewsSettings
  } = useNews();
  const { softDeleteArticle } = useSoftDelete();
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
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, articleId: null, articleTitle: '' });
  const [imageUploadMethod, setImageUploadMethod] = useState('url');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const allowAdminNews = !!newsSettings?.allowAdminNews;
  const isSuperAdmin = user?.isSuperAdmin;
  const isAdmin = user?.isAdmin;
  const authorName = user?.displayName || user?.name || user?.email || 'Admin';
  const canCreateArticle = isSuperAdmin || (isAdmin && allowAdminNews);

  useEffect(() => {
    if (!canCreateArticle && showAddForm) {
      setShowAddForm(false);
    }
  }, [canCreateArticle, showAddForm]);

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImageFile);
    setImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedImageFile]);

  const articles = useMemo(() => {
    const statusWeight = {
      pending: 0,
      rejected: 1,
      published: 2
    };
    return [...(allArticles || [])].sort((a, b) => {
      const weightA = statusWeight[a.status || 'published'] ?? 3;
      const weightB = statusWeight[b.status || 'published'] ?? 3;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      const dateA = new Date(a.createdAt || a.publishedAt || 0);
      const dateB = new Date(b.createdAt || b.publishedAt || 0);
      return dateB - dateA;
    });
  }, [allArticles]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUploadMethodChange = (method) => {
    setImageUploadMethod(method);
    setImageError('');
    if (method === 'url') {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    } else {
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedImageFile(null);
      setImageError('');
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setImageError(validation.error);
      showToast(validation.error, 'error');
      e.target.value = '';
      return;
    }

    setSelectedImageFile(file);
    setImageError('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !canCreateArticle) return;

    setLoading(true);
    try {
      const excerpt = formData.summary || `${formData.content.substring(0, 150)}...`;
      const slug = slugify(formData.title);
      let headerImageUrl = formData.image;
      const defaultImage = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop';

      if (imageUploadMethod === 'file' && selectedImageFile) {
        setUploadingImage(true);
        try {
          const safeSlug = slug || formData.title.replace(/\s+/g, '-').toLowerCase();
          headerImageUrl = await uploadImage(selectedImageFile, 'articles', `${safeSlug}_${Date.now()}`);
        } catch (uploadError) {
          console.error('Error uploading article image:', uploadError);
          const message = uploadError.message || 'Failed to upload image';
          setImageError(message);
          showToast(message, 'error');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      const newArticle = {
        title: formData.title,
        slug,
        excerpt,
        summary: excerpt,
        content: formData.content,
        image: headerImageUrl || defaultImage,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        author: authorName,
        ownerId: user?.uid || null,
        ownerName: authorName,
        featured: !!formData.featured,
        readTime: Math.ceil(formData.content.split(' ').length / 200),
        views: 0,
        likes: 0,
        comments: [],
        status: isSuperAdmin ? 'published' : 'pending'
      };

      if (isSuperAdmin) {
        newArticle.approvedBy = user?.uid || null;
        newArticle.approvedByName = authorName;
      }

      await addArticle(newArticle);
      setFormData({
        title: '',
        summary: '',
        content: '',
        image: '',
        category: 'general',
        tags: '',
        featured: false
      });
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setImageUploadMethod('url');
      setImageError('');
      setShowAddForm(false);

      if (isSuperAdmin) {
        showToast(t('adminNews.publishedSuccess'), 'success');
      } else {
        showToast(t('adminNews.submittedForApproval'), 'success');
      }
    } catch (error) {
      console.error('Error adding article:', error);
      showToast(t('adminNews.addFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteArticle = async () => {
    const { articleId, articleTitle } = confirmDelete;
    setConfirmDelete({ isOpen: false, articleId: null, articleTitle: '' });

    try {
      // Find the full article to pass to soft delete
      const article = allArticles.find(a => a.id === articleId);
      if (article) {
        await softDeleteArticle(article);
        showToast(`"${articleTitle}" moved to recycle bin`, 'success');
      } else {
        showToast(t('adminNews.articleNotFound') || 'Article not found', 'error');
      }
    } catch (error) {
      console.error('AdminNews: Failed to delete article:', error);
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
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageUploadMethod('url');
    setImageError('');
    setShowAddForm(false);
  };

  const handleApprove = async (article) => {
    try {
      await approveArticle(article.id, { userId: user?.uid, userName: authorName });
      showToast(t('adminNews.approveSuccess'), 'success');
    } catch (error) {
      console.error('Error approving article:', error);
      showToast(t('adminNews.approveFailed'), 'error');
    }
  };

  const handleReject = async (article) => {
    const reason = window.prompt(t('adminNews.rejectPrompt'));
    if (reason === null) return;
    try {
      await rejectArticle(article.id, { userId: user?.uid, userName: authorName, reason });
      showToast(t('adminNews.rejectSuccess'), 'success');
    } catch (error) {
      console.error('Error rejecting article:', error);
      showToast(t('adminNews.rejectFailed'), 'error');
    }
  };

  const handleToggleNewsSettings = async () => {
    if (!isSuperAdmin) return;
    try {
      setSettingsSaving(true);
      await updateNewsSettings({ allowAdminNews: !allowAdminNews });
      showToast(
        !allowAdminNews ? t('adminNews.adminSubmissionEnabled') : t('adminNews.adminSubmissionDisabled'),
        'success'
      );
    } catch (error) {
      console.error('Error updating news settings:', error);
      showToast(t('adminNews.newsSettingsUpdateFailed'), 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'transfer':
        return 'text-purple-500 bg-purple-500/20';
      case 'match':
        return 'text-accent-500 bg-accent-500/20';
      case 'injury':
        return 'text-red-500 bg-red-500/20';
      case 'interview':
        return 'text-primary-500 bg-primary-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const statusStyles = {
    published: 'text-green-400 bg-green-500/20 border border-green-500/30',
    pending: 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30',
    rejected: 'text-red-400 bg-red-500/20 border border-red-500/30'
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canManageArticle = (article, action) => {
    const isOwner = article.ownerId && user?.uid && article.ownerId === user.uid;
    switch (action) {
      case 'edit':
        return isSuperAdmin || (isOwner && article.status !== 'published');
      case 'delete':
        return isSuperAdmin || (isOwner && article.status !== 'published');
      default:
        return false;
    }
  };

  const totalArticles = articles.length;
  const pendingArticles = articles.filter(article => article.status === 'pending').length;
  const publishedArticles = articles.filter(article => article.status === 'published').length;
  const featuredArticles = articles.filter(article => article.featured).length;

  return (
    <AdminPageLayout
      title={t('adminNews.title')}
      subtitle="NEWS OPS"
      description={t('adminNews.getStarted')}
      onBack={() => navigate('/admin')}
      actions={canCreateArticle ? [
        {
          label: t('adminNews.addArticle'),
          icon: Plus,
          onClick: () => setShowAddForm(true),
          variant: 'primary',
        },
      ] : []}
      stats={[
        { label: t('adminNews.articles'), value: totalArticles, icon: FileText },
        { label: t('adminNews.status.pending'), value: pendingArticles, icon: Calendar },
        { label: t('adminNews.status.published'), value: publishedArticles, icon: Eye },
        { label: t('adminNews.featured'), value: featuredArticles, icon: Image },
      ]}
    >
      <div className="space-y-6">
        {isSuperAdmin && (
          <div className="card relative overflow-hidden p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-purple/15 via-transparent to-blue-500/15" />
            <div className="relative">
              <h3 className="text-white font-semibold text-sm uppercase tracking-[0.3em]">{t('adminNews.allowAdminSubmissions')}</h3>
              <p className="text-xs text-white/60 mt-1 max-w-xl">{t('adminNews.allowAdminSubmissionsDesc')}</p>
            </div>
            <div className="relative flex items-center justify-end">
              <button
                onClick={handleToggleNewsSettings}
                disabled={settingsSaving}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
                  allowAdminNews
                    ? 'bg-green-500/20 border border-green-400/40 text-green-200 hover:bg-green-500/30'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                } ${settingsSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {allowAdminNews ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {allowAdminNews ? t('adminNews.toggleOn') : t('adminNews.toggleOff')}
              </button>
            </div>
          </div>
        )}

        {!isSuperAdmin && !allowAdminNews && (
          <div className="card border border-yellow-500/30 bg-yellow-500/10 text-yellow-100 p-3 text-[11px] uppercase tracking-[0.25em]">
            {t('adminNews.adminSubmissionDisabledNotice')}
          </div>
        )}

        {/* Add Article Form */}
        {showAddForm && (
          <div className="card relative overflow-hidden p-3 sm:p-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-transparent to-blue-500/10" />
            <div className="relative">
            <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-white uppercase tracking-[0.3em]">{t('adminNews.addNewArticle')}</h3>
              <p className="text-xs text-white/60 mt-1">{t('adminNews.addNewArticleDesc')}</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 rounded-full hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('adminNews.summary')}
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="input-field w-full h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {t('adminNews.featuredImage')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleImageUploadMethodChange('url')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          imageUploadMethod === 'url'
                            ? 'bg-blue-600 text-white'
                            : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        }`}
                      >
                        <Link className="w-3.5 h-3.5" />
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImageUploadMethodChange('file')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          imageUploadMethod === 'file'
                            ? 'bg-blue-600 text-white'
                            : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        }`}
                      >
                        <Image className="w-3.5 h-3.5" />
                        {t('adminNews.uploadImage') || 'Upload'}
                      </button>
                    </div>
                  </div>

                  {imageUploadMethod === 'url' && (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        placeholder={t('adminNews.imagePlaceholder')}
                      />
                      {formData.image && (
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                          <img
                            src={formData.image}
                            alt="Featured preview"
                            className="w-20 h-20 object-cover rounded-lg border border-dark-600"
                          />
                          <span className="text-xs text-gray-400">{t('adminNews.preview') || 'Preview'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {imageUploadMethod === 'file' && (
                    <div className="space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        disabled={uploadingImage}
                      />
                      {selectedImageFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Image className="w-4 h-4" />
                          <span>{selectedImageFile.name}</span>
                          <span className="text-gray-500">
                            ({(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      )}
                      {imagePreviewUrl && (
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                          <img
                            src={imagePreviewUrl}
                            alt="Selected featured preview"
                            className="w-20 h-20 object-cover rounded-lg border border-dark-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImageFile(null);
                              setImagePreviewUrl(null);
                              setImageError('');
                            }}
                            className="px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                          >
                            {t('common.reset')}
                          </button>
                        </div>
                      )}
                      {imageError && (
                        <p className="text-xs text-red-400">{imageError}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {t('adminNews.imageUploadHelp') || 'Supported: JPEG, PNG, GIF, WebP up to 5MB.'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('adminNews.tags')}
                </label>
                <input
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

              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim() || !canCreateArticle}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-xs font-semibold uppercase tracking-[0.3em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading && <Save className="w-4 h-4 animate-spin" />}
                {loading ? t('adminNews.publishing') : t('adminNews.publishArticle')}
              </button>
            </form>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-2.5">
          {articles.map((article) => {
            const statusKey = article.status || 'published';
            const canEdit = canManageArticle(article, 'edit');
            const canDelete = canManageArticle(article, 'delete');
            const showApproveActions = isSuperAdmin && statusKey === 'pending';

            return (
              <div key={article.id} className="card group relative overflow-hidden p-2.5">
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-purple/10 via-transparent to-blue-500/10" />
                <div className="relative flex gap-2.5">
                  {/* Thumbnail */}
                  <div className="w-24 h-20 flex-shrink-0 rounded-md overflow-hidden border border-white/10 bg-black/30">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=160&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <Image className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.3em] ${getCategoryColor(article.category)}`}>
                          {article.category ? article.category.charAt(0).toUpperCase() + article.category.slice(1) : t('adminNews.general')}
                        </span>
                        {article.featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.3em] text-yellow-400 bg-yellow-500/20">
                            {t('adminNews.featured')}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.3em] ${statusStyles[statusKey] || 'text-gray-300 bg-gray-600/20 border border-gray-600/30'}`}>
                          {t(`adminNews.status.${statusKey}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/news/${article.slug || article.id}`)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          title={t('adminNews.viewArticle')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => canEdit && navigate(`/admin/news/edit/${article.id}`)}
                          className={`p-1.5 rounded-lg border ${canEdit ? 'border-white/10 text-white hover:bg-white/10' : 'border-white/5 text-white/30 cursor-not-allowed'}`}
                          title={t('adminNews.editArticle')}
                          disabled={!canEdit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => canDelete && setConfirmDelete({ isOpen: true, articleId: article.id, articleTitle: article.title })}
                          className={`p-1.5 rounded-lg border ${canDelete ? 'border-red-500/30 text-red-200 hover:bg-red-500/20' : 'border-white/5 text-white/30 cursor-not-allowed'}`}
                          title={t('adminNews.deleteArticle')}
                          disabled={!canDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-white font-semibold text-[13px] leading-tight line-clamp-2">{article.title}</h3>
                    <p className="text-white/60 text-xs line-clamp-2">{article.excerpt || article.summary}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.publishedAt || article.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {article.readTime || 0} {t('adminNews.min')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views || 0}
                      </span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-white/50">
                        {article.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">#{tag}</span>
                        ))}
                        {article.tags.length > 2 && (
                          <span>+{article.tags.length - 2}</span>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 border-t border-white/5 pt-1.5 flex flex-wrap gap-1.5">
                      {article.ownerName && (
                        <span>{t('adminNews.submittedBy').replace('{name}', article.ownerName)}</span>
                      )}
                      {article.status === 'pending' && (
                        <span>{t('adminNews.submittedOn').replace('{date}', formatDate(article.submittedAt))}</span>
                      )}
                      {article.status === 'rejected' && (
                        <span>
                          {t('adminNews.rejectedOn').replace('{date}', formatDate(article.rejectedAt))}
                          {article.rejectionReason ? ` - ${article.rejectionReason}` : ''}
                        </span>
                      )}
                    </div>

                    {showApproveActions && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(article)}
                          className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-400/40 text-green-200 text-[11px] font-semibold uppercase tracking-[0.3em]"
                        >
                          {t('adminNews.approve')}
                        </button>
                        <button
                          onClick={() => handleReject(article)}
                          className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 text-[11px] font-semibold uppercase tracking-[0.3em]"
                        >
                          {t('adminNews.reject')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {articles.length === 0 && (
            <div className="card text-center py-8">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-white/60" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{t('adminNews.noArticles')}</h3>
              <p className="text-sm text-white/60 mb-4">{t('adminNews.getStarted')}</p>
              {canCreateArticle && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-xs font-semibold uppercase tracking-[0.3em]"
                >
                  {t('adminNews.publishFirst')}
                </button>
              )}
            </div>
          )}
        </div>
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
    </AdminPageLayout>
  );
};

export default AdminNews;
