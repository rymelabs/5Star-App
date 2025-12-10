import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield } from 'lucide-react';
import { 
  hasConsentChoice, 
  grantAnalyticsConsent, 
  revokeAnalytics,
  getConsentStatus 
} from '../utils/analytics';

/**
 * Cookie/Analytics Consent Banner
 * Shows on first visit, allows user to accept or decline analytics
 */
const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Show banner if user hasn't made a choice yet
    if (!hasConsentChoice()) {
      // Small delay for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    grantAnalyticsConsent();
    setVisible(false);
  };

  const handleDecline = () => {
    revokeAnalytics();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-20 sm:pb-4 animate-slideUp">
      <div className="max-w-2xl mx-auto bg-elevated border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">We value your privacy</h3>
              <p className="text-gray-400 text-xs">Help us improve your experience</p>
            </div>
          </div>
          <button 
            onClick={handleDecline}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            We use analytics to understand how you use our app and improve your experience. 
            Your data is anonymized and never shared with third parties.
          </p>

          {/* Details toggle */}
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-brand-purple text-xs font-medium hover:underline mb-3"
          >
            {showDetails ? 'Hide details' : 'Learn more'}
          </button>

          {showDetails && (
            <div className="bg-black/20 rounded-xl p-3 mb-4 text-xs text-gray-400 space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">Anonymized tracking</span>
                  <p>Your IP is anonymized and we don't collect personal information.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">No third-party sharing</span>
                  <p>Analytics data is only used to improve the app experience.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">You're in control</span>
                  <p>You can change your preference anytime in Settings.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-purple hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/20 transition-all"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Settings component for managing consent
 * Can be used in a Settings page
 */
export const AnalyticsSettings = () => {
  const [consent, setConsent] = useState(getConsentStatus());

  const handleToggle = () => {
    if (consent === 'granted') {
      revokeAnalytics();
      setConsent('denied');
    } else {
      grantAnalyticsConsent();
      setConsent('granted');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center">
          <Cookie className="w-5 h-5 text-brand-purple" />
        </div>
        <div>
          <h4 className="text-white font-medium text-sm">Analytics</h4>
          <p className="text-gray-400 text-xs">Help improve the app with anonymous usage data</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          consent === 'granted' ? 'bg-brand-purple' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            consent === 'granted' ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ConsentBanner;
