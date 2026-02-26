# 🚀 Phase 2 Deployment Checklist

## Before You Start
- [ ] Read `PHASE2_COMPLETE.md` (overview)
- [ ] Read `PHASE2_SETUP_GUIDE.md` (detailed instructions)
- [ ] Have Firebase Console open
- [ ] Have code editor open
- [ ] Terminal ready

---

## 📋 Configuration Steps (15-20 minutes)

### Step 1: Get VAPID Key (2 min)
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select your project: `YOUR_PROJECT_ID`
- [ ] Click gear icon → **Project Settings**
- [ ] Go to **Cloud Messaging** tab
- [ ] Scroll to "Web Push certificates"
- [ ] Click **"Generate key pair"** (if no key exists)
- [ ] Copy the VAPID key

### Step 2: Add VAPID Key to .env (1 min)
- [ ] Open `.env` file in project root
- [ ] Add this line:
  ```
  VITE_FIREBASE_VAPID_KEY=paste_your_vapid_key_here
  ```
- [ ] Save file
- [ ] **Restart dev server** if running

### Step 3: Update Service Worker (2 min)
- [ ] Open `public/firebase-messaging-sw.js`
- [ ] Find lines 8-14 (firebase.initializeApp)
- [ ] Replace placeholder values with your actual Firebase config:
  ```javascript
  firebase.initializeApp({
    apiKey: "YOUR_API_KEY",           // From .env VITE_FIREBASE_API_KEY
    authDomain: "YOUR_AUTH_DOMAIN",   // From .env VITE_FIREBASE_AUTH_DOMAIN
    projectId: "YOUR_PROJECT_ID",     // From .env VITE_FIREBASE_PROJECT_ID
    storageBucket: "YOUR_BUCKET",     // From .env VITE_FIREBASE_STORAGE_BUCKET
    messagingSenderId: "YOUR_ID",     // From .env VITE_FIREBASE_MESSAGING_SENDER_ID
    appId: "YOUR_APP_ID"              // From .env VITE_FIREBASE_APP_ID
  });
  ```
- [ ] Save file

### Step 4A: Email Setup - Gmail (Quick Test) (3 min)
**Choose this for quick testing**

- [ ] Go to your Google Account → Security
- [ ] Enable 2-Factor Authentication (if not already)
- [ ] Go to "App Passwords"
- [ ] Generate new app password for "Mail"
- [ ] Copy the 16-character password

- [ ] Open terminal in project root
- [ ] Run these commands:
  ```bash
  cd functions
  firebase functions:config:set email.user="your-gmail@gmail.com"
  firebase functions:config:set email.password="your-16-char-app-password"
  firebase functions:config:set email.from="5Star App <noreply@5starapp.com>"
  firebase functions:config:set app.url="http://localhost:5173"
  ```
- [ ] Verify config: `firebase functions:config:get`

### Step 4B: Email Setup - SendGrid (Production) (5 min)
**Choose this for production deployment**

- [ ] Sign up at [SendGrid.com](https://sendgrid.com)
- [ ] Verify your domain (or use single sender)
- [ ] Create API key (Settings → API Keys)
- [ ] Copy API key

- [ ] Open terminal in project root
- [ ] Run these commands:
  ```bash
  cd functions
  npm install @sendgrid/mail
  firebase functions:config:set sendgrid.api_key="your-sendgrid-api-key"
  firebase functions:config:set email.from="5Star App <noreply@yourdomain.com>"
  firebase functions:config:set app.url="https://yourdomain.com"
  ```

- [ ] Update `functions/index.js`:
  - Add at top: `const sgMail = require('@sendgrid/mail');`
  - Add after imports: `sgMail.setApiKey(process.env.SENDGRID_API_KEY);`
  - Replace `emailTransporter.sendMail()` with `sgMail.send()`

### Step 5: Deploy Cloud Functions (2 min)
- [ ] Open terminal in project root
- [ ] Run: `firebase deploy --only functions`
- [ ] Wait for deployment (may take 2-3 minutes)
- [ ] Look for "✔ Deploy complete!" message
- [ ] Note the deployed functions:
  - ✔ onFixtureCreated
  - ✔ onFixtureUpdated
  - ✔ onArticleCreated
  - ✔ notifyUpcomingMatches

### Step 6: Enable Cloud Scheduler (Optional - for 24h reminders)
**Note: Requires Blaze (pay-as-you-go) plan**

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Select your Firebase project
- [ ] Search for "Cloud Scheduler API"
- [ ] Click "Enable"
- [ ] The scheduled function will run automatically every hour

**Skip this if on free plan** - all other notifications will still work!

---

## ✅ Testing (10 min)

### Test 1: Enable Notifications
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Sign in as a user (not admin)
- [ ] Go to **Settings**
- [ ] Click **"Enable Notifications"** button
- [ ] Modal should appear
- [ ] Click **"Enable Notifications"** in modal
- [ ] Browser should ask for permission
- [ ] Click **"Allow"**
- [ ] Button should change to "Enabled" ✅
- [ ] Check Firebase Console → Firestore → `fcmTokens` collection
- [ ] Your token should appear there ✅

### Test 2: Follow a Team
- [ ] Go to **Teams** page
- [ ] Click on any team
- [ ] Click **"Follow"** button
- [ ] Check Firebase Console → Firestore → `teams` → that team
- [ ] Your user ID should be in `followers` array ✅

### Test 3: Push Notification
- [ ] Open a second browser tab
- [ ] Sign in as **admin**
- [ ] Go to **Admin → Fixtures**
- [ ] Click **"Add New Fixture"**
- [ ] Create a fixture with the team you followed
- [ ] Click **"Save"**
- [ ] Go back to first tab (user account)
- [ ] You should see a notification! 🎉
- [ ] Check **Settings → Inbox** - notification should appear there
- [ ] Check your email - should receive email too

### Test 4: Live Match Notification
- [ ] As admin, find the fixture you created
- [ ] Click **"Edit"**
- [ ] Change status to **"Live"**
- [ ] Update the fixture
- [ ] User should get "🔴 LIVE NOW!" notification

### Test 5: Score Update
- [ ] As admin, edit the live fixture
- [ ] Change home or away score
- [ ] Save
- [ ] User should get "⚽ GOAL!" notification

### Test 6: Match Finished
- [ ] As admin, edit the fixture
- [ ] Change status to **"Finished"**
- [ ] Save
- [ ] User should get "⚽ Full Time" notification with final score

### Test 7: Notification Inbox
- [ ] As user, go to **Settings**
- [ ] Click **"Inbox"** link next to Notifications
- [ ] Should see all notifications
- [ ] Unread count badge should be visible
- [ ] Click a notification - should mark as read
- [ ] Click **"Mark all read"** - all should be marked
- [ ] Delete a notification - should disappear

---

## 🔍 Verification Checklist

### Firebase Console Checks
- [ ] Firestore → `fcmTokens` collection exists and has entries
- [ ] Firestore → `notifications` collection exists and has entries
- [ ] Functions → All 4 functions deployed successfully
- [ ] Functions → Logs show no errors

### App Checks
- [ ] No console errors in browser
- [ ] Settings page shows notification section
- [ ] Notification inbox accessible
- [ ] Notifications appear in real-time
- [ ] Email notifications arrive (check spam folder too)
- [ ] User preferences respected (test disabling a notification type)

---

## 🐛 Troubleshooting

### Issue: "VAPID key not configured"
**Solution:**
- [ ] Check `.env` has `VITE_FIREBASE_VAPID_KEY`
- [ ] Restart dev server: `Ctrl+C` then `npm run dev`
- [ ] Clear browser cache and reload

### Issue: No notification received
**Solution:**
- [ ] Check browser permission (Settings → Site Settings → Notifications)
- [ ] Check user notification settings are ON
- [ ] Check Firebase Console → `fcmTokens` - token exists?
- [ ] Check Cloud Functions deployed: `firebase deploy --only functions`
- [ ] Check function logs: `firebase functions:log`

### Issue: Email not received
**Solution:**
- [ ] Check spam folder
- [ ] Verify email config: `firebase functions:config:get`
- [ ] For Gmail: Use app password, not regular password
- [ ] For SendGrid: Verify domain/sender
- [ ] Check function logs for email errors

### Issue: Function deployment failed
**Solution:**
- [ ] Check Node.js version: `node --version` (should be 22.x)
- [ ] Run `npm install` in `/functions` directory
- [ ] Check `functions/index.js` for syntax errors
- [ ] Try deploying again: `firebase deploy --only functions`

### Issue: Notification inbox empty
**Solution:**
- [ ] Check Firestore → `notifications` collection has documents
- [ ] Check user ID matches notification `userId` field
- [ ] Check browser console for errors
- [ ] Try creating a new notification (create fixture as admin)

---

## 📊 Success Criteria

You know it's working when:
- ✅ User can enable notifications with one click
- ✅ Browser asks for permission and user grants it
- ✅ FCM token appears in Firestore `fcmTokens` collection
- ✅ Creating a fixture triggers a notification within 5 seconds
- ✅ Notification appears as browser push notification
- ✅ Email arrives in inbox within 1 minute
- ✅ Notification appears in user's inbox page
- ✅ Clicking notification navigates to fixture
- ✅ User can mark notifications as read
- ✅ User can delete notifications
- ✅ Unread count updates in real-time

---

## 🎓 Next Steps After Testing

### If Everything Works:
- [ ] Update `app.url` in Firebase config to production URL
- [ ] Update service worker with production Firebase config
- [ ] Consider upgrading to Blaze plan for Cloud Scheduler
- [ ] Set up SendGrid for production emails
- [ ] Deploy to production: `firebase deploy`
- [ ] Monitor function logs for errors
- [ ] Track notification metrics

### If Issues Persist:
- [ ] Review `PHASE2_SETUP_GUIDE.md` troubleshooting section
- [ ] Check all configuration steps completed
- [ ] Review Cloud Function logs: `firebase functions:log`
- [ ] Check Firebase Console for any error messages
- [ ] Verify all environment variables set correctly

---

## 📞 Support Resources

- **Setup Guide:** `PHASE2_SETUP_GUIDE.md`
- **Quick Reference:** `PHASE2_QUICK_REFERENCE.md`
- **Complete Overview:** `PHASE2_COMPLETE.md`
- **Architecture:** `src/notifications/README.md`

- **Firebase Docs:** https://firebase.google.com/docs
- **FCM Web Docs:** https://firebase.google.com/docs/cloud-messaging/js/client
- **Cloud Functions:** https://firebase.google.com/docs/functions

---

## ✨ Final Notes

**Time Required:** 15-20 minutes for configuration + 10 minutes for testing

**Difficulty Level:** Moderate (copy-paste config, run commands)

**What You'll Have:** A fully functional, production-ready notification system that sends real-time push notifications and emails to users when their followed teams have matches, scores, and news updates.

**Cost:** $0-5/month for most use cases (1000 users)

---

**Ready? Let's go! 🚀**

Check off each item as you complete it. If you get stuck, refer to the detailed guides.

Good luck! 🍀
