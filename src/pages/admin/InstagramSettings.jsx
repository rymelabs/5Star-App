import React, { useState, useEffect } from 'react';
import { Instagram, Save, Eye, EyeOff, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { getInstagramSettings, saveInstagramSettings } from '../../firebase/instagram';
import { useAuth } from '../../context/AuthContext';

const InstagramSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [settings, setSettings] = useState({
    enabled: false,
    username: '',
    accessToken: '',
    refreshToken: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getInstagramSettings();
      if (data) {
        setSettings({
          enabled: data.enabled || false,
          username: data.username || '',
          accessToken: data.accessToken || '',
          refreshToken: data.refreshToken || ''
        });
      }
    } catch (error) {
      console.error('Error loading Instagram settings:', error);
      setMessage({ type: 'error', text: 'Failed to load Instagram settings' });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white">Instagram Integration</h1>
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
        <h3 className="text-lg font-semibold text-white mb-4">Setup Instructions</h3>
        <div className="space-y-4 text-gray-300 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">Option 1: Simple Display (Username Only)</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Enable Instagram integration below</li>
              <li>Enter your Instagram username</li>
              <li>Save settings</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">Note: Without an access token, the Instagram section will show a follow button and link to your profile.</p>
          </div>
          
          <div className="border-t border-dark-700 pt-4">
            <h4 className="font-medium text-white mb-2">Option 2: Live Feed (Access Token Required)</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Create a Facebook Developer account at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400">developers.facebook.com</a></li>
              <li>Set up an Instagram Basic Display app</li>
              <li>Generate a User Access Token</li>
              <li>Paste the access token below</li>
              <li>Save settings</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Access tokens expire after 60 days. You'll need to refresh them periodically. Consider setting up long-lived tokens in your Facebook Developer dashboard.</span>
              </p>
            </div>
          </div>
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
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="yourusername"
                className="w-full pl-8 pr-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                disabled={!settings.enabled}
                required={settings.enabled}
              />
            </div>
            {settings.username && (
              <a
                href={`https://instagram.com/${settings.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-500 hover:text-primary-400 mt-1 inline-flex items-center gap-1"
              >
                View Profile <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Token (Optional)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={settings.accessToken}
                onChange={(e) => handleChange('accessToken', e.target.value)}
                placeholder="Enter your Instagram access token"
                className="w-full pr-10 px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                disabled={!settings.enabled}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required to display live Instagram posts. Leave empty to show only profile link.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button
              type="submit"
              disabled={saving || !settings.enabled}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              Reset
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
