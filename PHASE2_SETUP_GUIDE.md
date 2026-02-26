# Phase 2 Notification System - Setup Guide

## ✅ What Has Been Implemented

### 1. Frontend Components
- ✅ Firebase Cloud Messaging (FCM) configuration (`src/firebase/messaging.js`)
- ✅ FCM token management (`src/firebase/fcmTokens.js`)
- ✅ Notification inbox/history system (`src/firebase/notifications.js`)
- ✅ Enhanced NotificationContext with FCM support
- ✅ Notification inbox page (`src/pages/NotificationInbox.jsx`)
- ✅ Notification permission modal component
- ✅ Updated Settings page with enable notifications button
- ✅ Service worker for background notifications (`public/firebase-messaging-sw.js`)

### 2. Backend (Cloud Functions)
- ✅ Firebase Cloud Functions initialized in `/functions` directory
- ✅ Comprehensive notification triggers:
  - `onFixtureCreated` - Notify when new matches are scheduled
  - `onFixtureUpdated` - Notify for live matches, score updates, final results
  - `onArticleCreated` - Notify when articles about followed teams are published
  - `notifyUpcomingMatches` - Scheduled function (runs every hour) for 24h reminders
- ✅ Email notification support with HTML templates
- ✅ Push notification support via FCM
- ✅ User preference checking (respects user settings)
- ✅ Automatic invalid token cleanup

### 3. Database Security
- ✅ Firestore security rules for `fcmTokens` collection
- ✅ Firestore security rules for `notifications` collection
- ✅ Rules deployed to Firebase

## 🔧 Required Configuration Steps

### Step 1: Update .env File

Add the following to your `.env` file (create it if it doesn't exist):

```env
# Existing Firebase config...
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# NEW: Add this VAPID key for FCM
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**How to get your VAPID key:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project Settings
4. Go to "Cloud Messaging" tab
5. Scroll to "Web Push certificates"
6. Click "Generate key pair" if you don't have one
7. Copy the key and paste it as `VITE_FIREBASE_VAPID_KEY`

### Step 2: Update Service Worker with Firebase Config

Edit `/public/firebase-messaging-sw.js` and replace the placeholder config with your actual Firebase configuration:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
});
```

### Step 3: Configure Email Service (Cloud Functions)

#### Option A: Gmail (Development/Testing)
1. Create an app password for Gmail:
   - Go to Google Account → Security
   - Enable 2-Factor Authentication
   - Go to App Passwords
   - Generate a new app password for "Mail"

2. Set Firebase Functions environment variables:
```bash
cd functions
firebase functions:config:set email.user="your-gmail@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set email.from="5Star App <noreply@5starapp.com>"
firebase functions:config:set app.url="https://your-app-url.com"
```

#### Option B: SendGrid (Production - Recommended)
1. Sign up for [SendGrid](https://sendgrid.com)
2. Get your API key
3. Update `functions/index.js` to use SendGrid:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Replace emailTransporter with:
async function sendEmailNotification(userId, notification) {
  const email = await getUserEmail(userId);
  if (!email) return { success: false };

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: notification.title,
    html: /* ... your HTML template ... */
  };

  await sgMail.send(msg);
}
```

4. Set config:
```bash
firebase functions:config:set sendgrid.api_key="your-sendgrid-api-key"
```

### Step 4: Deploy Cloud Functions

```bash
cd functions
npm install  # If you haven't already
cd ..
firebase deploy --only functions
```

This will deploy all notification Cloud Functions to Firebase.

### Step 5: Enable Cloud Scheduler (for upcoming match reminders)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Enable the "Cloud Scheduler API"
4. The scheduler will automatically run `notifyUpcomingMatches` every hour

**Note:** Cloud Scheduler requires Blaze plan (pay-as-you-go). Free tier includes 3 jobs.

### Step 6: Test Notifications

1. **Test Push Notifications:**
   - Run `npm run dev` locally
   - Sign in as a user
   - Go to Settings
   - Click "Enable Notifications"
   - Grant browser permission
   - Follow a team
   - As admin, create a fixture for that team
   - You should receive a notification!

2. **Test Email Notifications:**
   - Ensure email configuration is set (Step 3)
   - Follow a team
   - Create a fixture
   - Check your email inbox

3. **Test Live Match Notifications:**
   - Create a fixture with status "scheduled"
   - Update it to status "live"
   - Followers should get a "LIVE NOW!" notification

## 📱 How It Works

### Notification Flow

```
1. User enables notifications (Settings page)
   ↓
2. FCM token is generated and saved to Firestore (fcmTokens collection)
   ↓
3. User follows a team (followers array updated in teams collection)
   ↓
4. Admin creates/updates a fixture or article
   ↓
5. Cloud Function triggers automatically
   ↓
6. Function checks team followers
   ↓
7. For each follower:
   - Check user notification preferences
   - Create notification record in Firestore
   - Send push notification (if enabled)
   - Send email notification (if enabled)
   ↓
8. User receives notification on their device
```

### Notification Types

| Type | Trigger | Setting Key | Description |
|------|---------|-------------|-------------|
| `fixture_created` | New fixture added | `upcomingMatches` | Notifies about newly scheduled matches |
| `match_live` | Fixture status → "live" | `liveMatches` | Notifies when match starts |
| `score_update` | Score changes while live | `liveMatches` | Notifies on goals during live match |
| `match_finished` | Fixture status → "finished" | `matchResults` | Notifies with final score |
| `article_published` | New article with team tags | `teamNews` | Notifies about team news |
| `upcoming_match_reminder` | Scheduled function | `upcomingMatches` | Reminds 24h before match |

## 🎛️ User Notification Preferences

Users can control notifications in Settings:

- **Team Notifications** (Master switch) - Enables/disables all team notifications
- **Upcoming Matches** - 24-hour reminders
- **Live Match Alerts** - When matches start
- **Match Results** - Final scores
- **Team News** - Articles about followed teams
- **Push Notifications** - Browser/mobile push
- **Email Notifications** - Email delivery

## 🔍 Monitoring & Debugging

### View Cloud Function Logs
```bash
firebase functions:log
```

### Check Notification Records
```javascript
// In Firebase Console → Firestore
// Check collections: fcmTokens, notifications
```

### Test Specific Functions
```bash
cd functions
npm run serve  # Start local emulator
```

## 💰 Cost Considerations

### Firebase Pricing (Spark Plan - Free)
- ✅ Cloud Firestore: 1GB storage, 50K reads/day, 20K writes/day
- ✅ Cloud Functions: 125K invocations/month, 40K GB-seconds
- ❌ Cloud Scheduler: NOT included (requires Blaze plan)

### Firebase Pricing (Blaze Plan - Pay as you go)
- Cloud Functions: $0.40 per million invocations (first 2M free)
- Cloud Scheduler: $0.10 per job/month (first 3 free)
- FCM: FREE (unlimited)
- Email costs depend on service (SendGrid has free tier: 100/day)

**Estimated monthly cost for 1000 active users:**
- Cloud Functions: ~$0 (within free tier)
- Cloud Scheduler: $0 (3 jobs free, we use 1)
- SendGrid: $0 (within free tier)
- **Total: $0 - $5/month**

## 🚀 Next Steps (Optional Enhancements)

1. **Notification Sound/Vibration**
   - Add custom notification sounds
   - Configure vibration patterns

2. **Rich Notifications**
   - Add images to notifications
   - Add action buttons (e.g., "View Match", "Share")

3. **Notification Grouping**
   - Group multiple notifications from same match
   - Collapse old notifications

4. **User Notification History**
   - Already implemented! Users can view past notifications in `/notifications`

5. **Admin Notification Dashboard**
   - See notification delivery stats
   - Resend failed notifications
   - Send manual notifications

6. **iOS/Android Apps**
   - Use same Cloud Functions
   - Integrate FCM in native apps

## 📚 Documentation

- **Firebase Cloud Messaging:** https://firebase.google.com/docs/cloud-messaging
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **Cloud Scheduler:** https://cloud.google.com/scheduler/docs
- **Notification Architecture:** See `/src/notifications/README.md`

## ✅ Verification Checklist

Before going live, verify:

- [ ] VAPID key added to `.env`
- [ ] Service worker updated with real Firebase config
- [ ] Email service configured (Gmail or SendGrid)
- [ ] Cloud Functions deployed successfully
- [ ] Firestore rules deployed
- [ ] Cloud Scheduler API enabled (if using Blaze plan)
- [ ] Test notification received successfully
- [ ] Test email received successfully
- [ ] User can enable/disable notifications in Settings
- [ ] User can view notification history in Inbox

## 🆘 Troubleshooting

### "VAPID key not configured" Error
- Ensure `VITE_FIREBASE_VAPID_KEY` is in your `.env` file
- Restart dev server after adding environment variables

### No Notifications Received
- Check browser permission (should be "Allow")
- Check user settings (Team Notifications should be ON)
- Check Cloud Function logs for errors
- Verify FCM token is saved in Firestore

### Emails Not Sending
- Check Firebase Functions config: `firebase functions:config:get`
- Verify email credentials are correct
- Check spam folder
- Review Cloud Function logs

### Cloud Functions Not Deploying
- Ensure you're on Node.js 22 (check: `node --version`)
- Run `npm install` in `/functions` directory
- Check for syntax errors in `functions/index.js`

---

**Congratulations!** 🎉 Your notification system is now fully implemented. Users will receive real-time updates about their favorite teams' matches and news!
