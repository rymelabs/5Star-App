# 🔒 Firestore Security Rules Update Required

## Issue
You're getting a "Missing or insufficient permissions" error when trying to save settings because the Firestore security rules don't allow writes to the `userSettings` collection.

## Solution
You need to deploy the updated Firestore security rules to your Firebase project.

---

## 📋 Step-by-Step Instructions

### Option 1: Deploy via Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Update the Rules**
   - You'll see the current rules in the editor
   - Add this new section after the `users` collection rules:

```javascript
// User Settings collection - Each user can only read/write their own settings
match /userSettings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

4. **Publish the Rules**
   - Click the "Publish" button at the top right
   - Wait for confirmation that rules are published

---

### Option 2: Deploy via Firebase CLI (Recommended for developers)

1. **Install Firebase CLI** (if not already installed)
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Firebase in your project** (if not already done)
```bash
cd "/Users/mac/Desktop/5Star App"
firebase init firestore
```
   - Select your Firebase project
   - Accept default file locations (firestore.rules, firestore.indexes.json)

4. **Copy the updated rules**
   - The rules are already updated in `src/firebase/firestore.rules`
   - Copy them to the root `firestore.rules` file:
```bash
cp src/firebase/firestore.rules firestore.rules
```

5. **Deploy the rules**
```bash
firebase deploy --only firestore:rules
```

6. **Confirm deployment**
   - You should see: "✔ Deploy complete!"

---

## 🔐 What the New Rule Does

```javascript
match /userSettings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

This rule ensures:
- ✅ **Authenticated users** can read and write ONLY their own settings
- ✅ **Security**: Users cannot access other users' settings
- ✅ **Privacy**: Each user's settings are isolated
- ❌ **Anonymous/Guest users** cannot write to Firestore (they use localStorage instead)

---

## 🧪 Testing After Deployment

1. **Open your app**: http://localhost:5188
2. **Sign in** with your account (not as guest)
3. **Go to Settings**: Click profile icon → Settings
4. **Toggle any setting**: Dark mode, notifications, etc.
5. **Check console**: You should see:
   ```
   💾 Saving settings to Firestore for user: [your-user-id]
   ✅ Settings saved to Firestore
   ```
6. **Refresh the page**: Settings should persist
7. **Try on another device/browser**: Log in and your settings should sync!

---

## 🐛 Troubleshooting

### Still getting permission errors?

1. **Check if rules are deployed**
   - Go to Firebase Console → Firestore → Rules tab
   - Verify the `userSettings` rule is there

2. **Check authentication**
   - Make sure you're logged in (not browsing as guest)
   - Check console: `console.log(user)` should show a non-anonymous user

3. **Check Firestore is enabled**
   - Firebase Console → Firestore Database
   - Make sure it's in "Production mode" or "Test mode"

4. **Clear cache and retry**
   ```bash
   # Stop the dev server (Ctrl+C)
   npm run dev
   ```

### Rules deployment fails?

- Make sure you're logged into the correct Firebase account
- Verify project ID matches your Firebase project
- Check that you have owner/editor permissions on the Firebase project

---

## 📝 Complete Rules File Reference

Your complete `firestore.rules` file should look like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    
    // User Settings collection - Each user can only read/write their own settings
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Teams collection
    match /teams/{teamId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Fixtures collection
    match /fixtures/{fixtureId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Articles collection
    match /articles/{articleId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Comments collection
    match /comments/{commentId} {
      allow read: if true; // Public read access
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // League table collection
    match /leagueTable/{teamId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## ✅ Success Indicators

Once deployed correctly, you should see:
- ✅ No more permission errors in console
- ✅ Green checkmark toast: "Push Notifications enabled"
- ✅ Settings persist after page refresh
- ✅ Settings sync across devices when logged in
- ✅ Console log: "✅ Settings saved to Firestore"

---

## 🆘 Need Help?

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your Firebase project ID in `.env`
3. Make sure Firestore is properly initialized
4. Try logging out and logging back in

The app will automatically fall back to localStorage if Firestore continues to fail, so your settings won't be lost!
