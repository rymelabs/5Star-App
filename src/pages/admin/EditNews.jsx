import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNews } from '../../context/NewsContext';
import { useLanguage } from '../../context/LanguageContext';
import { slugify } from '../../utils/helpers';
import { ArrowLeft, Save, Image, Link } from 'lucide-react';
import { uploadImage, validateImageFile } from '../../services/imageUploadService';

const EditNews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getArticleById, updateArticle } = useNews();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image: '',
    category: 'general',
    tags: '',
    featured: false,
  });
  const [imageUploadMethod, setImageUploadMethod] = useState('url');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const article = await getArticleById(id);
        if (article) {
          setFormData({
            title: article.title || '',
            summary: article.summary || article.excerpt || '',
            content: article.content || '',
            image: article.image || '',
            category: article.category || 'general',
            tags: (article.tags || []).join(', '),
            featured: !!article.featured,
          });
          setSelectedImageFile(null);
          setImagePreviewUrl(null);
          setImageUploadMethod('url');
          setImageError('');
        }
      } catch (error) {
        console.error('EditNews: Failed to load article', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, getArticleById]);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUploadMethodChange = (method) => {
    setImageUploadMethod(method);
    setImageError('');
    if (method === 'url') {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    } else {
      setFormData((prev) => ({ ...prev, image: '' }));
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
      e.target.value = '';
      return;
    }

    setSelectedImageFile(file);
    setImageError('');
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleCancel = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageUploadMethod('url');
    setImageError('');
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setSaving(true);
    try {
      const slug = slugify(formData.title);
      let headerImageUrl = formData.image;
      const defaultImage = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop';

      if (imageUploadMethod === 'file' && selectedImageFile) {
        setUploadingImage(true);
        try {
          const safeSlug = slug || formData.title.replace(/\s+/g, '-').toLowerCase();
          headerImageUrl = await uploadImage(selectedImageFile, 'articles', `${safeSlug}_${Date.now()}`);
        } catch (uploadError) {
          console.error('EditNews: Failed to upload image', uploadError);
          setImageError(uploadError.message || 'Failed to upload image');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      const updated = {
        title: formData.title,
        slug,
        excerpt: formData.summary || `${formData.content.substring(0, 150)}...`,
        summary: formData.summary || `${formData.content.substring(0, 150)}...`,
        content: formData.content,
        image: headerImageUrl || defaultImage,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured: !!formData.featured,
      };

      await updateArticle(id, updated);
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setImageUploadMethod('url');
      setImageError('');
      navigate('/admin/news');
    } catch (error) {
      console.error('EditNews: Failed to save article', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h2 className="ml-2 admin-header">{t('adminNews.editArticle')}</h2>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('adminNews.titleLabel')} *
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field w-full"
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
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  />
                  {formData.image && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <img
                        src={formData.image}
                        alt="Featured preview"
                        className="w-20 h-20 object-cover rounded-lg border border-dark-600"
                      />
                      <span className="text-xs text-gray-400">
                        {t('adminNews.preview') || 'Preview'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {imageUploadMethod === 'file' && (
                <div className="space-y-2">
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
                  {imageError && <p className="text-xs text-red-400">{imageError}</p>}
                  <p className="text-xs text-gray-500">
                    {t('adminNews.imageUploadHelp') || 'Supported: JPEG, PNG, GIF, WebP up to 5MB.'}
                  </p>
                </div>
              )}
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
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="input-field w-full"
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
              disabled={saving || uploadingImage || !formData.title.trim() || !formData.content.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? t('adminNews.saving') : t('adminNews.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNews;
