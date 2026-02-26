# Guest-First Authentication Plan

## 1. Goals
- Keep the public experience (home/latest feed, fixtures, teams, news, stats) available regardless of auth state.
- Treat every visitor as a **guest session** by default and only surface auth prompts when attempting protected actions (e.g., following a team, saving preferences, posting comments).
- Preserve the existing Firebase Auth integration so guests can elevate to registered accounts without losing context (scroll position, selections, cached data).

## 2. User States
| State | Description | Capabilities |
| --- | --- | --- |
| Guest | Default for every visitor (no Firebase user yet). | Read-only access to all public pages, browse teams/news, view fixtures, receive cached data. |
| Anonymous Firebase User | Backend-friendly guest created automatically when we need a UID (e.g., for temporary likes or queueing follow requests before login). | Same as Guest, plus ability to store transient preferences in Firestore under the anonymous UID. |
| Authenticated User | Signed-in visitor via email/phone/etc. | All guest abilities plus follow teams, notification subscriptions, comment/like actions, profile, settings, admin tools if flagged. |

## 3. Architectural Strategy
1. **Auth Context Enhancements**
   - Extend `AuthContext` to expose `authState: 'guest' | 'anonymous' | 'authenticated'` and helper booleans (`isGuest`, `isAnonymous`, `isAuthenticated`).
   - Lazily provision an anonymous Firebase user only when an action requires a backend UID but the visitor is still a guest.
   - Persist the last-known user state in memory/localStorage to skip UI flicker on refresh.

2. **Routing / Access Control**
   - Default routes (`/`, `/fixtures`, `/teams`, `/news`, `/stats`, article detail, etc.) should render for all states.
   - Replace blanket redirects with contextual prompts: only push to `/auth` when a guest attempts a gated action (follow, save settings, view notifications, etc.).
   - Keep admin-only routes behind `user?.isAdmin` guard, unaffected by guest changes.

3. **Gated Interaction Pattern**
   - Wrap follow buttons, notification toggles, profile entry points with a helper (`requireAuthAction(actionName, onSuccess)`):
     1. If `isAuthenticated`, run `onSuccess` immediately.
     2. If `isGuest`, open a modal or inline prompt offering “Continue as guest” (read-only) vs “Sign in to follow teams”.
     3. If `isAnonymous`, allow action if backend supports it, otherwise escalate to full login.
   - Centralize this guard to keep UX consistent.

4. **Caching & State Continuity**
   - Leverage the existing caching (Teams/News) to pre-populate guest sessions quickly.
   - When a guest logs in, sync any queued actions (e.g., they tapped “Follow” and agreed to log in). Store pending intents in sessionStorage to replay post-auth.

5. **Telemetry & Messaging**
   - Track conversions from guest ➜ authenticated to measure impact.
   - Copy guidelines: emphasize benefits (“Follow teams to receive alerts”) rather than blocking language.

## 4. Implementation Phases
### Phase A – Foundations
1. Update `AuthContext` to differentiate guest/anonymous/authenticated states and expose new helpers.
2. Audit `AppContent` routes and remove forced redirects for `/auth` except for explicitly protected pages (profile, settings, notifications, admin).
3. Introduce a lightweight `useAuthGate` hook that components can call to enforce sign-in only when required.

### Phase B – UX Touchpoints
4. Replace follow button auth errors with modal prompt:
   - Title: “Sign in to follow teams”.
   - Body: Outline benefits; allow “Maybe later” to remain guest without navigation.
5. Apply the same guard to other interactive areas: notifications inbox, calendar reminders, likes/comments (if enabled).
6. Update header/profile icon to show “Guest” state with call-to-action to sign in.

### Phase C – Anonymous Session Support (optional but recommended)
7. When a guest opts to “Remind me later” yet we need a UID (e.g., storing mute preferences), provision Firebase anonymous auth and label them as `isAnonymous`.
8. Ensure anonymous accounts can be upgraded seamlessly when the user completes email/phone sign-in (`linkWithCredential`).

### Phase D – QA & Rollout
9. Unit-test the `useAuthGate` hook and context helpers.
10. Manually verify flows:
    - Fresh guest visits home ➜ browses freely.
    - Guest clicks follow ➜ sees prompt ➜ logs in ➜ returns to same page with follow completed.
    - Authenticated user experience unchanged for protected pages.
11. Instrument analytics for prompt impressions vs. conversions.

## 5. Execution Checklist
- [ ] Refactor `AuthContext` to emit guest/anonymous/authenticated states.
- [ ] Update route guards in `AppContent` to allow guest browsing.
- [ ] Build `useAuthGate` (or similar) hook consumed by follow buttons, notification toggles, etc.
- [ ] Create a shared “Sign in to continue” modal component with configurable messaging.
- [ ] Implement optional anonymous-auth fallback for advanced guest personalization.
- [ ] Add telemetry hooks for tracking CTA success.
- [ ] Document QA scenarios and add automated tests where practical.

## 6. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Guests experience state flicker while Firebase initializes. | Cache auth state locally and hold UI in a short skeleton state before showing prompts. |
| Follow requests lost when user navigates to auth. | Store intended action (team ID, action type) in sessionStorage and replay post-login. |
| Anonymous accounts clutter user table. | Periodically clean up untouched anonymous UIDs or upgrade them once linked. |
| Admin-only routes become accessible. | Leave admin flag checks untouched; only adjust public-route gating. |

## 7. Deliverables
- Updated `AuthContext`, `AppContent`, `useAuthGate`, follow button prompt, and QA checklist.
- Analytics events for guest ➜ auth conversion.
- Documentation (this file) stored at `AUTH_GUEST_STRATEGY.md` for ongoing reference.
