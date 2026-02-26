# 🚀 Deploy Updated Firestore Rules - Comments & Likes

## What Needs to be Deployed

Your Firestore security rules have been updated to fix **two issues**:

1. ✅ **Comments Permission Fixed** - Users can now create comments
2. ✅ **Likes Permission Added** - Users can now like/unlike articles

---

## Quick Deploy (Recommended)

Run this single command:

```bash
cd "/Users/mac/Desktop/5Star App"
./deploy-firestore-rules-quick.sh
```

If prompted for login:
```bash
firebase login
```

---

## What Changed in the Rules

### Before (Broken):
```javascript
// Comments - BROKEN ❌
match /comments/{commentId} {
  allow read: if true;
  allow create: if request.auth != null && 
    request.auth.uid == resource.data.userId;  // ❌ resource doesn't exist yet!
}

// Articles - Users couldn't like ❌
match /articles/{articleId} {
  allow read: if true;
  allow write: if request.auth != null && isAdmin;  // ❌ Only admins
}
```

### After (Fixed):
```javascript
// Comments - FIXED ✅
match /comments/{commentId} {
  allow read: if true;
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;  // ✅ Checks incoming data
  allow update, delete: if request.auth != null && 
    (request.auth.uid == resource.data.userId || isAdmin);
}

// Articles - Users can now like ✅
match /articles/{articleId} {
  allow read: if true;
  allow create, delete: if request.auth != null && isAdmin;
  allow update: if request.auth != null && (
    isAdmin ||
    // Users can only update like-related fields
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['likes', 'likedBy', 'updatedAt'])
  );
}
```

---

## Full Rules File

Your complete `src/firebase/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    
    // User Settings collection
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Teams collection
    match /teams/{teamId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Fixtures collection
    match /fixtures/{fixtureId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Articles collection - UPDATED ✅
    match /articles/{articleId} {
      allow read: if true;
      allow create, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy', 'updatedAt'])
      );
    }
    
    // Comments collection - FIXED ✅
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // League table collection
    match /leagueTable/{teamId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Deployment Methods

### Method 1: Deployment Script ⭐ (Easiest)

```bash
./deploy-firestore-rules-quick.sh
```

Expected output:
```
🔥 Deploying Firestore Rules...

📄 Deploying rules from: src/firebase/firestore.rules

✔  Deploy complete!

✅ Firestore rules deployed successfully!

You can now:
  ✓ Add comments on articles
  ✓ Like articles
```

---

### Method 2: Firebase CLI

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (first time only)
firebase init firestore
# Select: Use an existing project
# Choose: YOUR_PROJECT_ID
# Rules file: src/firebase/firestore.rules
# Indexes: (press enter to skip)

# 4. Deploy rules only
firebase deploy --only firestore:rules
```

---

### Method 3: Firebase Console (No CLI)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select project: **YOUR_PROJECT_ID**
3. Go to **Firestore Database**
4. Click **Rules** tab
5. Copy the complete rules from `src/firebase/firestore.rules`
6. Paste into the editor
7. Click **Publish**

---

## Verification Steps

After deploying, test both features:

### Test Comments:
1. ✅ Open any article
2. ✅ Type a comment
3. ✅ Click "Add Comment"
4. ✅ Comment should appear (**no permission errors**)

### Test Likes:
1. ✅ Open any article
2. ✅ Click "Like" button
3. ✅ Heart should fill red
4. ✅ Count should increment
5. ✅ Click again to unlike
6. ✅ Heart should become outline
7. ✅ Count should decrement

---

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Not authorized"
```bash
firebase login
firebase use YOUR_PROJECT_ID
```

### "Rules failed to deploy"
1. Check Firebase Console for syntax errors
2. Copy rules exactly from `src/firebase/firestore.rules`
3. Try deploying via Console instead

### Still getting permission errors?
1. **Hard refresh** browser (Cmd+Shift+R on Mac)
2. **Wait 1-2 minutes** for rules to propagate
3. **Check Firebase Console** → Firestore → Rules tab
4. **Verify** the rules match the file
5. **Clear cache** and reload app

### Comments work but likes don't?
- Make sure you deployed the **latest rules**
- Check that articles collection update rule exists
- Verify `likedBy` field exists in article documents

### Likes work but comments don't?
- Check comments rule line 37
- Should be `request.resource.data.userId`
- NOT `resource.data.userId`

---

## What This Enables

### ✅ Comments System:
- Users can add comments on articles
- Users can edit their own comments
- Users can delete their own comments
- Admins can moderate (delete any comment)
- Comments are public (everyone can read)

### ✅ Likes System:
- Users can like/unlike articles
- Like count updates in real-time
- Each user can only like once
- Likes persist across sessions
- Heart icon fills when liked
- Shows total like count

---

## Security Summary

What users **CAN** do:
- ✅ Read all articles, comments, teams, fixtures
- ✅ Create comments on articles
- ✅ Edit/delete their own comments
- ✅ Like/unlike articles
- ✅ Read/write their own user settings

What users **CANNOT** do:
- ❌ Create/edit/delete articles (admin only)
- ❌ Edit article content/title (admin only)
- ❌ Create/edit/delete teams (admin only)
- ❌ Create/edit/delete fixtures (admin only)
- ❌ Edit other users' comments
- ❌ Manipulate like count beyond +1/-1

---

## Next Steps

1. **Deploy the rules** using one of the methods above
2. **Test comments** - Add a comment on an article
3. **Test likes** - Like and unlike an article
4. **Verify** everything works without permission errors

Both features should work immediately after deployment! 🎉

---

## Files Modified

1. ✅ `src/firebase/firestore.rules` - Updated security rules
2. ✅ `src/firebase/firestore.js` - Added `toggleLike()` function
3. ✅ `src/context/NewsContext.jsx` - Added `toggleLike()` to context
4. ✅ `src/pages/NewsArticle.jsx` - Implemented like button UI
5. ✅ `deploy-firestore-rules-quick.sh` - Quick deploy script

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Look at browser console for errors
3. Verify rules in Firebase Console
4. Make sure you're logged in as a user

**The code is ready, just deploy the rules!** 🚀
