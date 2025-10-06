import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, Save, AlertCircle, CheckCircle, ExternalLink, Home } from 'lucide-react';
import { getInstagramSettings, saveInstagramSettings } from '../../firebase/instagram';
import { useAuth } from '../../context/AuthContext';

const InstagramSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [settings, setSettings] = useState({
    enabled: false,
    username: '',
  });

  const [initialSettings, setInitialSettings] = useState(null);

  // Fetch current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const currentSettings = await getInstagramSettings();
        const settingsData = {
          enabled: currentSettings?.enabled || false,
          username: currentSettings?.username || '',
        };
        setSettings(settingsData);
        setInitialSettings(settingsData);
      } catch (error) {
        console.error('Error loading settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (settings.enabled && !settings.username) {
      setMessage({ type: 'error', text: 'Please enter your Instagram username' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      await saveInstagramSettings(settings);
      
      setMessage({ type: 'success', text: 'Instagram settings saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving Instagram settings:', error);
      setMessage({ type: 'error', text: 'Failed to save Instagram settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading Instagram settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Instagram className="w-6 h-6 text-pink-500" />
          <h1 className="page-header">Instagram Integration</h1>
        </div>
        <p className="text-gray-400">Connect your Instagram account to display posts on the home page</p>
      </div>

      {/* Alert/Success Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Instagram className="w-5 h-5 text-pink-500" />
          How It Works
        </h3>
        <div className="space-y-4 text-gray-300 text-sm">
          <p>
            This integration displays your public Instagram posts on the home page, allowing visitors to see your latest content and follow your account.
          </p>
          
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">✨ Quick Setup (2 steps):</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Enable the Instagram integration below</li>
              <li>Enter your Instagram username (without the @)</li>
              <li>Click Save Settings</li>
            </ol>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Your Instagram account must be <strong>public</strong> for posts to display. The integration automatically fetches your latest posts to show on the home page.</span>
            </p>
          </div>
          
          <p className="text-xs text-gray-500">
            Note: This displays public Instagram posts. No API keys or Facebook Developer setup required! 🎉
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
        
        <div className="space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
            <div>
              <label className="text-white font-medium">Enable Instagram Feed</label>
              <p className="text-sm text-gray-400">Show Instagram posts on the home page</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('enabled', !settings.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instagram Username <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                value={settings.username}
                onChange={(e) => handleChange('username', e.target.value.replace('@', ''))}
                placeholder="your_instagram_username"
                className="w-full pl-8 pr-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                disabled={!settings.enabled}
                required={settings.enabled}
              />
            </div>
            {settings.username && (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={`https://instagram.com/${settings.username.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-500 hover:text-pink-400 inline-flex items-center gap-1"
                >
                  <Instagram className="w-3 h-3" />
                  View @{settings.username.replace('@', '')} on Instagram
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter your public Instagram username. Posts will be automatically fetched and displayed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dark-700">
            <button
              type="submit"
              disabled={saving || (!settings.enabled && !initialSettings?.enabled)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Preview on Home Page
            </button>
          </div>
        </div>
      </form>

      {/* Testing Section */}
      {settings.enabled && settings.username && (
        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
          <p className="text-gray-400 mb-4">
            Visit the <a href="/" className="text-primary-500 hover:text-primary-400">home page</a> to see your Instagram feed in action.
          </p>
          {!settings.accessToken && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>No access token configured. Only your profile link will be displayed. Add an access token to show live posts.</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstagramSettings;
