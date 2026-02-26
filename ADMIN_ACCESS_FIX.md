# Admin Dashboard Access Issue - Solution

## Problem
You're logged in but seeing "Admin Dashboard not available" when trying to access `/admin`.

## Root Cause
Your user account in Firestore doesn't have the `role` field set to `'admin'` or `'super-admin'`.

## Solution

### Option 1: Manual Fix via Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on "Data" tab

3. **Find Your User Document**
   - Click on the `users` collection
   - Find your user document (search by your email or UID)

4. **Update the Role Field**
   - Click on your user document
   - Look for the `role` field
   - If it exists, click to edit it
   - If it doesn't exist, click "Add field"

5. **Set the Role Value**
   ```
   Field: role
   Type: string
   Value: admin        (for regular admin)
   OR
   Value: super-admin  (for super admin with full access)
   ```

6. **Save and Test**
   - Click "Update" or "Save"
   - Go back to your app
   - Refresh the page (Ctrl/Cmd + R)
   - Try accessing `/admin` again

### Option 2: Using Firestore Rules (For Development Only)

If you want to quickly test, you can temporarily modify your Firestore rules to allow role updates:

**⚠️ WARNING: This is for development only! Never use in production!**

```javascript
// In firestore.rules, temporarily add:
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

Then create this test script:

```javascript
// test-admin-setup.js
import { getFirebaseDb } from './src/firebase/config.js';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const setAdminRole = async () => {
  const auth = getAuth();
  const db = getFirebaseDb();
  
  if (!auth.currentUser) {
    console.error('No user logged in!');
    return;
  }
  
  const userRef = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(userRef, {
    role: 'super-admin'
  });
  
  console.log('✅ Admin role set successfully!');
  console.log('Please refresh your app.');
};

setAdminRole();
```

### Verification

After updating the role, check the browser console for:
```
🔍 AuthContext current state: {
  user: 'your-email@example.com (admin)',  // or (super-admin)
  loading: false,
  error: null
}
```

## Role Differences

- **`user`** (default): Regular user, no admin access
- **`admin`**: Can access admin dashboard and manage content
- **`super-admin`**: Full admin access + can see all admin activities (not just their own)

## Still Having Issues?

1. **Clear browser cache and local storage**
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

2. **Check Firestore rules**
   - Make sure the `users` collection is readable
   - Rule: `allow read: if request.auth != null;`

3. **Check browser console for errors**
   - Look for Firebase authentication errors
   - Look for Firestore permission errors

4. **Verify Firebase connection**
   - Check that `.env` file has correct Firebase credentials
   - Ensure Firestore is initialized properly

## Current Setup

Based on your code:
- Admin routes are at `/admin/*`
- Admin dashboard is the main entry point at `/admin`
- Role checking happens in `AuthContext.jsx` (normalizeUser function)
- Admin check: `user.isAdmin` (which is `role === 'admin' || role === 'super-admin'`)
