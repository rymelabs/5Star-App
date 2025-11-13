// Admin Diagnostic Tool
// Open browser console and paste this script to check your admin status

console.log('🔍 Admin Diagnostic Tool');
console.log('========================\n');

// Check if user is logged in
const checkAuth = () => {
  // Try to get auth from window (React context might expose it)
  const authState = localStorage.getItem('authUser');
  
  if (authState) {
    try {
      const parsed = JSON.parse(authState);
      console.log('✅ Found auth state in localStorage:');
      console.log('   Email:', parsed.email || 'N/A');
      console.log('   UID:', parsed.uid || 'N/A');
      console.log('   Role:', parsed.role || 'N/A');
      console.log('   isAdmin:', parsed.isAdmin || false);
      console.log('   isSuperAdmin:', parsed.isSuperAdmin || false);
      
      if (parsed.role === 'admin' || parsed.role === 'super-admin') {
        console.log('\n✅ You have admin privileges!');
      } else {
        console.log('\n❌ You DO NOT have admin privileges');
        console.log('   Current role:', parsed.role || 'user');
        console.log('\n📝 To fix this:');
        console.log('   1. Go to Firebase Console');
        console.log('   2. Navigate to Firestore Database');
        console.log('   3. Find your user document in the "users" collection');
        console.log('   4. Update the "role" field to "admin" or "super-admin"');
        console.log('   5. Refresh this page');
      }
    } catch (e) {
      console.error('❌ Error parsing auth state:', e);
    }
  } else {
    console.log('❌ No auth state found in localStorage');
    console.log('   You might not be logged in or using a different auth storage method');
  }
};

// Check Firebase auth directly
const checkFirebaseAuth = async () => {
  try {
    const { getAuth } = await import('firebase/auth');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log('\n🔥 Firebase Auth Status:');
      console.log('   Logged in as:', currentUser.email);
      console.log('   UID:', currentUser.uid);
      
      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('\n📄 Firestore User Document:');
        console.log('   Name:', userData.name || 'N/A');
        console.log('   Email:', userData.email || 'N/A');
        console.log('   Role:', userData.role || 'user');
        console.log('   Profile Completed:', userData.profileCompleted || false);
        console.log('   Created At:', userData.createdAt || 'N/A');
        
        if (userData.role === 'admin' || userData.role === 'super-admin') {
          console.log('\n✅ ✅ ✅ You SHOULD have admin access! ✅ ✅ ✅');
          console.log('   If you\'re still seeing "Admin Dashboard not available":');
          console.log('   1. Try refreshing the page (Ctrl/Cmd + R)');
          console.log('   2. Try logging out and back in');
          console.log('   3. Clear browser cache and localStorage');
        } else {
          console.log('\n❌ ❌ ❌ No admin access - Role is:', userData.role || 'user');
          console.log('\n📝 Fix Steps:');
          console.log('   1. Go to: https://console.firebase.google.com');
          console.log('   2. Select your project');
          console.log('   3. Go to Firestore Database');
          console.log('   4. Navigate to: users/' + currentUser.uid);
          console.log('   5. Edit the "role" field to "admin" or "super-admin"');
          console.log('   6. Come back here and reload the page');
        }
      } else {
        console.log('\n❌ No user document found in Firestore!');
        console.log('   Your account might be incomplete.');
        console.log('   Try logging out and back in to create the document.');
      }
    } else {
      console.log('\n❌ No user currently logged in to Firebase');
    }
  } catch (error) {
    console.error('\n❌ Error checking Firebase:', error);
    console.log('   Firebase might not be loaded yet. Try again in a few seconds.');
  }
};

// Run checks
console.log('Running diagnostics...\n');
checkAuth();

// Try Firebase check after a delay (to ensure Firebase is loaded)
setTimeout(() => {
  checkFirebaseAuth().catch(err => {
    console.log('\n⚠️  Could not check Firebase directly');
    console.log('   This is normal if Firebase modules are not accessible from console');
  });
}, 1000);

console.log('\n========================');
console.log('Diagnostic complete!');
console.log('Check the output above for your admin status.');
