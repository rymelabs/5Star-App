// Quick Firestore Role Check
// Paste this in browser console to check your exact role value

(async () => {
  console.log('🔍 Firestore Role Diagnostic');
  console.log('============================\n');

  try {
    // Get current user
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('👤 User:', user.email);
    console.log('🆔 UID:', user.uid);

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      console.error('❌ User document not found in Firestore!');
      console.log('   This is the problem - your user document doesn\'t exist');
      return;
    }

    const userData = userDoc.data();
    console.log('\n📄 Firestore User Data:');
    console.log('   Email:', userData.email);
    console.log('   Name:', userData.name);
    console.log('   Role:', userData.role);
    console.log('   Created:', userData.createdAt);

    // Check role
    const role = userData.role;
    if (role === 'admin' || role === 'super-admin') {
      console.log('\n✅ Role is valid for admin access:', role);
      console.log('   You should have admin permissions');
      console.log('\n🔄 Try refreshing the page or clearing cache:');
      console.log('   localStorage.clear(); location.reload(true);');
    } else {
      console.log('\n❌ Role is NOT valid for admin access:', role);
      console.log('   Expected: "admin" or "super-admin"');
      console.log('   Actual:', role);
      console.log('\n📝 Fix: Go to Firebase Console and update the role field');
    }

    // Test adminActivity collection access
    console.log('\n🔍 Testing adminActivity collection access...');
    try {
      const { collection, query, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const adminActivityQuery = query(collection(db, 'adminActivity'), limit(1));
      const snapshot = await getDocs(adminActivityQuery);
      console.log('✅ Successfully accessed adminActivity collection');
      console.log('   Found', snapshot.size, 'documents');
    } catch (accessError) {
      console.error('❌ Cannot access adminActivity collection:', accessError.message);
      console.log('   This confirms the permission issue');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n============================');
})();
