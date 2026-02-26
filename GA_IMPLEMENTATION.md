# Google Analytics (GA4) Implementation Plan

This document describes how to add privacy-conscious Google Analytics (GA4) to the app, including consent handling and recommended events for fixtures, teams, news, and admin flows.

## Goals
- Track visits, page views, and key interactions (fixtures, teams, follows, searches, news, admin actions) with GA4.
- Respect user consent; no analytics until accepted.
- Keep data minimal and avoid sending PII (no emails; hash/obfuscate user IDs if needed).

## Setup
1) **Env var**: Add `VITE_GA_MEASUREMENT_ID` to your environment (do not commit secrets).
2) **Helper**: Create `src/utils/analytics.js` to:
   - Load `gtag.js` only after consent.
   - Queue events until GA is ready.
   - Export `initAnalytics(id)`, `trackPageView(path, params)`, `trackEvent(name, params)`, `setUserProps(props)`, `revokeAnalytics()`.
   - Set `anonymize_ip: true` and respect consent updates.
3) **Consent**: Show a consent banner; store choice in `localStorage`.
   - On accept: load GA via `initAnalytics` with the env ID.
   - On reject: do not load GA. If previously loaded, call `revokeAnalytics()` to deny storage and stop sending.
4) **Router hook**: Add `usePageTracking` (e.g., `src/hooks/usePageTracking.js`) to send `page_view` on route changes with `{ page_path, page_title, language, isAuthenticated }`.
5) **Integration points**: Wire key UI actions to `trackEvent` (see Events section).
6) **Debugging**: Use GA DebugView; verify events and params. Add light tests to ensure queuing works pre-init and no events fire without consent.

## Recommended events and params
- **Page views**: `page_view` `{ page_path, page_title, language, isAuthenticated }`.
- **Navigation**: `nav_click` `{ target: 'fixtures|teams|news|dashboard|settings' }`.
- **Search**: `search` `{ feature: 'teams|fixtures|news', query_length, has_filters }`.
- **Fixtures**:
  - `fixture_view` `{ fixtureId, competition, stage, status }`
  - `fixture_penalties_view` `{ fixtureId }` when a penalties block is shown
- **Teams**:
  - `team_view` `{ teamId, source: 'fixtures|search|news', has_follow }`
  - `team_follow` / `team_unfollow` `{ teamId, userId_hash }`
- **News**: `article_view` `{ articleId, category, word_count }`
- **Auth**: `login_start`, `login_success`, `signup_start`, `signup_success`
- **Admin (sampled)**:
  - `admin_fixture_edit` `{ fixtureId, has_penalties, status }`
  - `admin_bulk_upload` `{ entity: 'teams|fixtures' }`
- **Performance**: `ui_latency` `{ screen, ms }` for slow screens.

## User properties (set once per session)
- `role` (guest|user|admin)
- `language`
- `device_type`
- `theme`

## Consent handling notes
- Default: no analytics until the user accepts.
- On revoke, call `gtag('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied' })` and stop sending events; optionally clear GA cookies where possible.

## Implementation sketch (helper)
```js
// src/utils/analytics.js
let ready = false;
let queue = [];
const consented = () => localStorage.getItem('analytics-consent') === 'granted';

const push = (type, ...args) => {
  if (ready && window.gtag) window.gtag(type, ...args);
  else queue.push({ type, args });
};

export const initAnalytics = (measurementId) => {
  if (!measurementId || ready || !consented()) return;
  if (!window.dataLayer) window.dataLayer = [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.onload = () => {
    gtag('js', new Date());
    gtag('config', measurementId, { anonymize_ip: true });
    ready = true;
    queue.forEach(({ type, args }) => gtag(type, ...args));
    queue = [];
  };
  document.head.appendChild(script);
};

export const trackPageView = (path, params = {}) =>
  push('event', 'page_view', { page_path: path, ...params });

export const trackEvent = (name, params = {}) =>
  push('event', name, params);

export const setUserProps = (props = {}) =>
  push('set', 'user_properties', props);

export const revokeAnalytics = () => {
  if (window.gtag) {
    window.gtag('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied' });
  }
  ready = false;
};
```

## Integration steps
1) Add a consent banner; on accept, set `localStorage['analytics-consent']='granted'` and call `initAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID)`.
2) Add `usePageTracking` to router layout to emit `page_view` on navigation.
3) Wire key buttons/flows to `trackEvent` with the schemas above (fixtures detail, team view/follow, searches, news reads, auth funnel, admin edits).
4) Set `setUserProps` after auth/locale/theme changes.
5) Test in GA DebugView; ensure no events fire without consent.
