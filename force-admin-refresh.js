// Force Admin Refresh Tool
// Paste this in your browser console while logged in

(async () => {
  console.log('🔄 Force Admin Refresh Tool');
  console.log('============================\n');

  try {
    // Step 1: Check if Firebase is available
    const firebase = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    console.log('✅ Firebase modules loaded');

    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('❌ No user logged in!');
      console.log('   Please log in first, then run this script again.');
      return;
    }

    console.log('👤 Current user:', currentUser.email);
    console.log('🆔 UID:', currentUser.uid);

    // Step 2: Fetch user document from Firestore
    console.log('\n🔍 Fetching user data from Firestore...');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('❌ User document not found in Firestore!');
      console.log('   Path checked: users/' + currentUser.uid);
      console.log('\n📝 This might be the problem. Try:');
      console.log('   1. Log out completely');
      console.log('   2. Log back in');
      console.log('   3. This should create the user document');
      return;
    }

    const userData = userDoc.data();
    console.log('✅ User document found!');
    console.log('\n📄 Current Firestore Data:');
    console.log('   Email:', userData.email || 'N/A');
    console.log('   Name:', userData.name || 'N/A');
    console.log('   Role:', userData.role || 'NOT SET');
    console.log('   Auth Provider:', userData.authProvider || 'N/A');
    console.log('   Profile Completed:', userData.profileCompleted || false);
    console.log('   Created:', userData.createdAt || 'N/A');

    // Step 3: Check if admin
    const isAdmin = userData.role === 'admin' || userData.role === 'super-admin';
    
    if (isAdmin) {
      console.log('\n✅ ✅ ✅ YOU HAVE ADMIN PRIVILEGES! ✅ ✅ ✅');
      console.log('   Role:', userData.role);
      console.log('\n🔄 Now forcing a page refresh to apply changes...');
      
      // Clear any cached auth data
      console.log('   1. Clearing localStorage cache...');
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('firebase') || key.includes('auth') || key.includes('user')
      );
      keysToRemove.forEach(key => {
        console.log('      Removing:', key);
        localStorage.removeItem(key);
      });
      
      console.log('   2. Forcing page reload in 3 seconds...');
      console.log('   3. After reload, navigate to /admin\n');
      
      setTimeout(() => {
        window.location.reload(true);
      }, 3000);
    } else {
      console.log('\n❌ ❌ ❌ NO ADMIN ACCESS ❌ ❌ ❌');
      console.log('   Current role:', userData.role || '(not set)');
      console.log('\n📝 FIX THIS NOW:');
      console.log('   1. Open Firebase Console: https://console.firebase.google.com');
      console.log('   2. Go to: Firestore Database → users → ' + currentUser.uid);
      console.log('   3. Edit the "role" field to: "admin" or "super-admin"');
      console.log('   4. Make sure it\'s a STRING field, not something else');
      console.log('   5. Save the changes');
      console.log('   6. Come back here and run this script again');
      console.log('\n🔗 Direct link (if your console allows):');
      console.log('   https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/data/users/' + currentUser.uid);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Could not load Firebase from CDN.');
    console.log('   Trying alternative method...\n');
    
    // Alternative: Check localStorage
    console.log('🔍 Checking localStorage for cached user data...');
    const allKeys = Object.keys(localStorage);
    const firebaseKeys = allKeys.filter(key => key.includes('firebase'));
    
    if (firebaseKeys.length > 0) {
      console.log('Found Firebase keys in localStorage:');
      firebaseKeys.forEach(key => {
        console.log('\n📦', key);
        try {
          const value = localStorage.getItem(key);
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            console.log('   Content preview:', JSON.stringify(parsed).substring(0, 200) + '...');
          }
        } catch (e) {
          console.log('   (Cannot parse - raw string)');
        }
      });
    }
    
    console.log('\n💡 ALTERNATIVE FIX:');
    console.log('   1. Log out of your app completely');
    console.log('   2. Close the browser (to clear session)');
    console.log('   3. Reopen and log back in');
    console.log('   4. This forces a fresh fetch from Firestore');
  }

  console.log('\n============================');
  console.log('Tool complete!');
})();
