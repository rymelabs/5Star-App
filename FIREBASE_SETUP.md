# 🔥 Firebase Setup Guide for 5Star Soccer App

## 📋 Prerequisites
- Node.js installed
- Firebase account
- Firebase CLI installed (`npm install -g firebase-tools`)

## 🚀 Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create New Project**: Click "Add project"
3. **Project Name**: `5star-soccer-app`
4. **Enable Analytics**: Optional
5. **Create Project**

## ⚙️ Step 2: Configure Firebase Services

### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Add authorized domains for production

### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select your preferred location

### Storage (Optional for images)
1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**

## 🔧 Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** → **Web** (</> icon)
4. App nickname: `5Star Soccer App`
5. Copy the configuration object

## 📝 Step 4: Set Environment Variables

Create `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id_here
```

## 🛡️ Step 5: Deploy Firestore Security Rules

```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

## 🗄️ Step 6: Initialize Sample Data

1. Update `firebase-init.js` with your Firebase config
2. Run: `npm run firebase:init`

## 📱 Step 7: Create Admin User

1. Register a new user through the app
2. Go to Firestore Console
3. Find the user document in `users` collection
4. Change the `role` field to `'admin'`

## 🌐 Step 8: Deploy to Firebase Hosting

```bash
firebase init hosting
# Choose dist as public directory
# Configure as SPA: Yes
# Don't overwrite index.html

npm run build
firebase deploy
```

## 🔐 Production Security

### Firestore Rules
The provided rules ensure:
- ✅ Public read access to teams, fixtures, articles
- ✅ Admin-only write access to core data
- ✅ User authentication required for comments
- ✅ Users can only edit their own comments

### Environment Variables for Production
Set these in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables

## 🎯 Testing Firebase Integration

1. **Start Development Server**: `npm run dev`
2. **Register New User**: Should create user in Firestore
3. **Add Team (Admin)**: Should save to Firestore
4. **Real-time Updates**: Multiple tabs should sync automatically

## 📊 Firestore Collections Structure

```
📁 users/
  └── {userId}
    ├── name: string
    ├── email: string
    ├── role: 'user' | 'admin'
    └── createdAt: timestamp

📁 teams/
  └── {teamId}
    ├── name: string
    ├── logo: string
    ├── stadium: string
    ├── founded: string
    └── manager: string

📁 fixtures/
  └── {fixtureId}
    ├── homeTeam: string
    ├── awayTeam: string
    ├── dateTime: timestamp
    ├── status: 'upcoming' | 'live' | 'completed'
    ├── homeScore: number
    └── awayScore: number

📁 articles/
  └── {articleId}
    ├── title: string
    ├── excerpt: string
    ├── content: string
    ├── author: string
    ├── category: string
    └── publishedAt: timestamp

📁 comments/
  └── {commentId}
    ├── content: string
    ├── userId: string
    ├── userName: string
    ├── itemType: 'fixture' | 'article'
    ├── itemId: string
    └── createdAt: timestamp
```

## 🚀 Go Live Checklist

- [ ] Firebase project created
- [ ] Environment variables set
- [ ] Firestore security rules deployed
- [ ] Sample data initialized
- [ ] Admin user created
- [ ] App deployed to hosting
- [ ] Domain configured (if custom)
- [ ] Analytics enabled (optional)

Your 5Star Soccer App is now live with Firebase! 🎉