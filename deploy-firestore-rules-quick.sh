#!/bin/bash

# Quick Firestore Rules Deployment Script
# This script deploys the updated firestore.rules to fix comment permissions

echo "🔥 Deploying Firestore Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase."
    echo ""
    echo "Please login first:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo "📄 Deploying rules from: src/firebase/firestore.rules"
echo ""

# Deploy only Firestore rules
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "You can now:"
    echo "  ✓ Add comments on articles"
    echo "  ✓ Like articles (when implemented)"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Please check the error above."
    echo ""
    exit 1
fi
