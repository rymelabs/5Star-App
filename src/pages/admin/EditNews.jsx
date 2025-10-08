import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNews } from '../../context/NewsContext';
import { useLanguage } from '../../context/LanguageContext';
import { slugify } from '../../utils/helpers';
import { ArrowLeft, Save, X } from 'lucide-react';

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
    featured: false
  });

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
            featured: !!article.featured
          });
        }
      } catch (error) {
        console.error('EditNews: Failed to load article', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, getArticleById]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCancel = () => navigate(-1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setSaving(true);
    try {
      const slug = slugify(formData.title);
      const updated = {
        title: formData.title,
        slug,
        excerpt: formData.summary || formData.content.substring(0, 150) + '...',
        summary: formData.summary || formData.content.substring(0, 150) + '...',
        content: formData.content,
        image: formData.image,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: !!formData.featured
      };

      await updateArticle(id, updated);
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
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h2 className="ml-2 admin-header">{t('adminNews.editArticle')}</h2>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('adminNews.titleLabel')} *</label>
            <input name="title" value={formData.title} onChange={handleInputChange} className="input-field w-full" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('adminNews.summary')}</label>
            <textarea name="summary" value={formData.summary} onChange={handleInputChange} className="input-field w-full h-20 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('adminNews.content')} *</label>
            <textarea name="content" value={formData.content} onChange={handleInputChange} className="input-field w-full h-40 resize-y" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('adminNews.featuredImage')}</label>
              <input name="image" value={formData.image} onChange={handleInputChange} className="input-field w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('adminNews.category')}</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="input-field w-full">
                <option value="general">{t('adminNews.general')}</option>
                <option value="transfer">{t('adminNews.transfer')}</option>
                <option value="match">{t('adminNews.matchReport')}</option>
                <option value="injury">{t('adminNews.injury')}</option>
                <option value="interview">{t('adminNews.interview')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('adminNews.tags')}</label>
            <input name="tags" value={formData.tags} onChange={handleInputChange} className="input-field w-full" />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="w-4 h-4 text-primary bg-dark-700 border-dark-600 rounded focus:ring-primary focus:ring-2" />
              <span className="text-sm text-gray-300">{t('adminNews.featuredArticle')}</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">{t('adminNews.cancel')}</button>
            <button type="submit" disabled={saving || !formData.title.trim() || !formData.content.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
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
