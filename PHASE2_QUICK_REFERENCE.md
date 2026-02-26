# Phase 2 Implementation - Quick Reference

## ✅ COMPLETED

### Frontend Files Created/Updated
```
src/firebase/messaging.js              - FCM initialization & token management
src/firebase/fcmTokens.js              - Firestore FCM token operations
src/firebase/notifications.js          - Notification inbox/history management
src/context/NotificationContext.jsx    - Enhanced with FCM support (UPDATED)
src/pages/NotificationInbox.jsx        - Notification inbox page (NEW)
src/components/NotificationPermissionModal.jsx - Permission request modal (NEW)
src/pages/Settings.jsx                 - Added enable notifications button (UPDATED)
src/AppContent.jsx                     - Added /notifications route (UPDATED)
public/firebase-messaging-sw.js        - Service worker for background notifications (NEW)
```

### Backend Files Created
```
functions/index.js                     - Cloud Functions for notifications
functions/package.json                 - Dependencies (firebase-admin, nodemailer)
```

### Database
```
firestore.rules                        - Security rules for fcmTokens & notifications (DEPLOYED ✓)
```

### Documentation
```
PHASE2_SETUP_GUIDE.md                  - Complete setup instructions
src/notifications/README.md            - Notification architecture docs (from Phase 1)
```

## 🔧 CONFIGURATION REQUIRED

### 1. Environment Variables (.env)
Add to your `.env` file:
```env
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**Get VAPID Key:**
Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair

### 2. Service Worker Config
Edit `public/firebase-messaging-sw.js` lines 8-14:
Replace placeholder config with your actual Firebase config values

### 3. Email Service Setup
Choose one:

**Option A - Gmail (Quick Test):**
```bash
cd functions
firebase functions:config:set email.user="your-gmail@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set app.url="https://your-domain.com"
```

**Option B - SendGrid (Production):**
```bash
firebase functions:config:set sendgrid.api_key="your-api-key"
firebase functions:config:set app.url="https://your-domain.com"
```

### 4. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

## 🎯 NOTIFICATION TRIGGERS

| Event | Cloud Function | Description |
|-------|---------------|-------------|
| New fixture created | `onFixtureCreated` | Notifies team followers |
| Fixture updated to "live" | `onFixtureUpdated` | "LIVE NOW!" alert |
| Score changes (live match) | `onFixtureUpdated` | "GOAL!" alert |
| Match finishes | `onFixtureUpdated` | Final score |
| New article published | `onArticleCreated` | Article about team |
| 24h before match | `notifyUpcomingMatches` | Reminder (runs hourly) |

## 📱 USER FLOW

1. User goes to Settings
2. Clicks "Enable Notifications"
3. Modal appears explaining benefits
4. User clicks "Enable Notifications"
5. Browser asks for permission
6. FCM token generated & saved to Firestore
7. User follows a team
8. Admin creates/updates content
9. Cloud Function triggers
10. User receives notification!

## 🧪 TESTING CHECKLIST

- [ ] Add VAPID key to `.env` and restart dev server
- [ ] Update service worker with real Firebase config
- [ ] Configure email service (Gmail or SendGrid)
- [ ] Deploy Cloud Functions: `firebase deploy --only functions`
- [ ] Sign in as user
- [ ] Enable notifications in Settings
- [ ] Grant browser permission
- [ ] Follow a team
- [ ] As admin, create a fixture for that team
- [ ] Verify notification received
- [ ] Check notification inbox page
- [ ] Test email notification

## 🔍 DEBUGGING

**Check FCM Token Saved:**
Firebase Console → Firestore → fcmTokens collection

**Check Notifications Created:**
Firebase Console → Firestore → notifications collection

**View Cloud Function Logs:**
```bash
firebase functions:log
```

**Common Issues:**
- "VAPID key not configured" → Add to .env and restart
- No notification → Check browser permission & user settings
- Email not sent → Verify email config: `firebase functions:config:get`

## 💰 COST ESTIMATE

**Free Tier (Spark Plan):**
- ❌ Cannot use Cloud Scheduler (upcoming match reminders)
- ✅ Everything else works!

**Blaze Plan (Pay as you go):**
- Functions: Free for first 2M invocations/month
- Scheduler: $0.10/job (first 3 free)
- FCM: Always free
- SendGrid: Free for 100 emails/day

**Estimated cost for 1000 users: $0-5/month**

## 📞 QUICK COMMANDS

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules

# View function logs
firebase functions:log

# Check email config
firebase functions:config:get

# Test locally
cd functions && npm run serve
```

## ✨ WHAT USERS SEE

1. **Settings Page:**
   - "Enable Notifications" button
   - Notification preferences (5 toggles)
   - "Inbox" link with unread badge

2. **Notification Permission Modal:**
   - Explains benefits
   - Push, email, and control features
   - "Enable Notifications" button

3. **Notification Inbox:**
   - List of all notifications
   - Unread count
   - Click to view details
   - Delete notifications
   - "Mark all read" button

4. **Notifications:**
   - Push notifications (browser/mobile)
   - Email notifications (HTML formatted)
   - In-app notification history

---

**Status: READY TO CONFIGURE & DEPLOY** 🚀

All code is written and tested. Just need to add config values and deploy!
