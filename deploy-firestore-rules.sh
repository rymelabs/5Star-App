#!/bin/bash

# 🚀 Quick Firestore Rules Deployment Script
# This script deploys the updated Firestore security rules to Firebase

echo "🔥 Firebase Firestore Rules Deployment"
echo "======================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase"
    echo ""
    echo "Please login with:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Firebase"
echo ""

# Copy rules from src to root
echo "📋 Copying Firestore rules..."
if [ -f "src/firebase/firestore.rules" ]; then
    cp src/firebase/firestore.rules firestore.rules
    echo "✅ Rules copied successfully"
else
    echo "❌ Could not find src/firebase/firestore.rules"
    exit 1
fi

echo ""

# Show the current project
echo "📦 Current Firebase project:"
firebase use

echo ""

# Ask for confirmation
read -p "Deploy Firestore rules to this project? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying Firestore rules..."
    firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Firestore rules deployed successfully!"
        echo ""
        echo "🎉 Your app should now be able to save settings to Firestore."
        echo ""
        echo "Next steps:"
        echo "  1. Refresh your app in the browser"
        echo "  2. Sign in (not as guest)"
        echo "  3. Go to Settings and toggle any option"
        echo "  4. Check console for: '✅ Settings saved to Firestore'"
    else
        echo ""
        echo "❌ Deployment failed. Please check the error above."
    fi
else
    echo ""
    echo "❌ Deployment cancelled"
fi
