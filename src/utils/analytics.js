/**
 * Google Analytics (GA4) Utility
 * 
 * Privacy-conscious analytics with consent handling.
 * No analytics until user accepts consent.
 */

let ready = false;
let queue = [];

/**
 * Check if user has granted analytics consent
 */
const consented = () => localStorage.getItem('analytics-consent') === 'granted';

/**
 * Push events to GA or queue them for later
 */
const push = (type, ...args) => {
  if (ready && window.gtag) {
    window.gtag(type, ...args);
  } else {
    queue.push({ type, args });
  }
};

/**
 * Initialize Google Analytics
 * Only loads GA script after user consent
 * @param {string} measurementId - GA4 Measurement ID (e.g., G-XXXXXXXXXX)
 */
export const initAnalytics = (measurementId) => {
  if (!measurementId || ready || !consented()) return;
  
  if (!window.dataLayer) window.dataLayer = [];
  
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  // Set default consent to denied until script loads
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'granted'
  });
  
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.onload = () => {
    gtag('js', new Date());
    gtag('config', measurementId, {
      anonymize_ip: true,
      send_page_view: false // We'll send page views manually
    });
    ready = true;
    
    // Flush queued events
    queue.forEach(({ type, args }) => gtag(type, ...args));
    queue = [];
  };
  script.onerror = () => {
    console.warn('Failed to load Google Analytics');
  };
  document.head.appendChild(script);
};

/**
 * Track page view
 * @param {string} path - Page path
 * @param {object} params - Additional parameters
 */
export const trackPageView = (path, params = {}) => {
  if (!consented()) return;
  push('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    ...params
  });
};

/**
 * Track custom event
 * @param {string} name - Event name
 * @param {object} params - Event parameters
 */
export const trackEvent = (name, params = {}) => {
  if (!consented()) return;
  push('event', name, params);
};

/**
 * Set user properties
 * @param {object} props - User properties
 */
export const setUserProps = (props = {}) => {
  if (!consented()) return;
  push('set', 'user_properties', props);
};

/**
 * Revoke analytics consent
 * Stops sending events and updates consent state
 */
export const revokeAnalytics = () => {
  if (window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'denied'
    });
  }
  ready = false;
  queue = [];
  localStorage.setItem('analytics-consent', 'denied');
};

/**
 * Grant analytics consent
 * Initializes GA with the measurement ID
 */
export const grantAnalyticsConsent = () => {
  localStorage.setItem('analytics-consent', 'granted');
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    initAnalytics(measurementId);
  }
};

/**
 * Check if analytics is ready
 */
export const isAnalyticsReady = () => ready;

/**
 * Check if user has made a consent choice
 */
export const hasConsentChoice = () => {
  const consent = localStorage.getItem('analytics-consent');
  return consent === 'granted' || consent === 'denied';
};

/**
 * Get current consent status
 */
export const getConsentStatus = () => localStorage.getItem('analytics-consent');

// Predefined event helpers for common actions

/**
 * Track navigation click
 */
export const trackNavClick = (target) => {
  trackEvent('nav_click', { target });
};

/**
 * Track search
 */
export const trackSearch = (feature, queryLength, hasFilters = false) => {
  trackEvent('search', {
    feature,
    query_length: queryLength,
    has_filters: hasFilters
  });
};

/**
 * Track fixture view
 */
export const trackFixtureView = (fixtureId, competition, stage, status) => {
  trackEvent('fixture_view', {
    fixture_id: fixtureId,
    competition,
    stage,
    status
  });
};

/**
 * Track penalties view
 */
export const trackPenaltiesView = (fixtureId) => {
  trackEvent('fixture_penalties_view', { fixture_id: fixtureId });
};

/**
 * Track team view
 */
export const trackTeamView = (teamId, source, hasFollow = false) => {
  trackEvent('team_view', {
    team_id: teamId,
    source,
    has_follow: hasFollow
  });
};

/**
 * Track team follow/unfollow
 */
export const trackTeamFollow = (teamId, userIdHash, isFollow = true) => {
  trackEvent(isFollow ? 'team_follow' : 'team_unfollow', {
    team_id: teamId,
    user_id_hash: userIdHash
  });
};

/**
 * Track article view
 */
export const trackArticleView = (articleId, category, wordCount) => {
  trackEvent('article_view', {
    article_id: articleId,
    category,
    word_count: wordCount
  });
};

/**
 * Track auth events
 */
export const trackAuthEvent = (event) => {
  // event: 'login_start' | 'login_success' | 'signup_start' | 'signup_success'
  trackEvent(event);
};

/**
 * Track admin actions (sampled)
 */
export const trackAdminFixtureEdit = (fixtureId, hasPenalties, status) => {
  trackEvent('admin_fixture_edit', {
    fixture_id: fixtureId,
    has_penalties: hasPenalties,
    status
  });
};

export const trackAdminBulkUpload = (entity) => {
  trackEvent('admin_bulk_upload', { entity });
};

/**
 * Track UI latency for performance monitoring
 */
export const trackUILatency = (screen, ms) => {
  trackEvent('ui_latency', { screen, ms });
};
