import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../context/NewsContext';
import { slugify } from '../../utils/helpers';
import { ArrowLeft, Plus, Edit, Trash2, Image, FileText, Save, X, Eye, Calendar } from 'lucide-react';

const AdminNews = () => {
  const navigate = useNavigate();
  const { articles, addArticle, deleteArticle } = useNews();
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-white">News Management</h1>
              <p className="text-sm text-gray-400">{articles.length} articles</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Article
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add Article Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Article</h3>
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
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Summary
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="input-field w-full h-20 resize-none"
                  placeholder="Brief summary (optional - will auto-generate from content if empty)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="input-field w-full h-40 resize-y"
                  placeholder="Write your article content here..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="general">General</option>
                    <option value="transfer">Transfer</option>
                    <option value="match">Match Report</option>
                    <option value="injury">Injury</option>
                    <option value="interview">Interview</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Tag1, Tag2, Tag3 (comma separated)"
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
                  <span className="text-sm text-gray-300">Featured article</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="card p-4">
              <div className="flex items-start space-x-4">
                {/* Article Image */}
                <div className="flex-shrink-0">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-20 h-16 object-cover rounded-lg bg-dark-700"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=160&fit=crop';
                    }}
                  />
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                      </span>
                      {article.featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-yellow-500 bg-yellow-500/20">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/news/${article.slug || article.id}`)}
                        className="p-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors"
                        title="View Article"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/news/edit/${article.id}`)}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
                            try {
                              await deleteArticle(article.id);
                              console.log('Article deleted successfully');
                            } catch (error) {
                              console.error('Failed to delete article:', error);
                              alert('Failed to delete article. Please try again.');
                            }
                          }
                        }}
                        className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {article.excerpt || article.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(article.publishedAt)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{article.readTime} min read</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{article.views} views</span>
                      </span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-1 py-0.5 bg-dark-700 text-gray-400 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-gray-500">+{article.tags.length - 3}</span>
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
            <h3 className="text-lg font-semibold text-white mb-2">No articles yet</h3>
            <p className="text-gray-400 mb-4">Get started by publishing your first article</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Publish First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNews;