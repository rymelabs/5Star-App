// Comprehensive Admin Access Diagnostic
// Paste this in browser console when logged in

(async () => {
  console.log('🔍 COMPREHENSIVE ADMIN DIAGNOSTIC');
  console.log('==================================\n');

  try {
    // Step 1: Check Firebase Auth
    console.log('1️⃣ Checking Firebase Auth...');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('❌ No user logged in to Firebase');
      return;
    }

    console.log('✅ Logged in as:', currentUser.email);
    console.log('🆔 UID:', currentUser.uid);

    // Step 2: Check Firestore User Document
    console.log('\n2️⃣ Checking Firestore User Document...');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const db = getFirestore();

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('❌ User document does not exist in Firestore!');
      console.log('   This is likely the root cause.');
      console.log('   Your account may not have been properly created.');
      return;
    }

    const userData = userDoc.data();
    console.log('✅ User document found');
    console.log('📄 Data:', {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: userData.createdAt
    });

    // Step 3: Check Role Value
    console.log('\n3️⃣ Analyzing Role...');
    const role = userData.role;

    if (!role) {
      console.error('❌ No role field in user document!');
      console.log('   Role is undefined/null');
      console.log('\n📝 FIX: Add role field with value "admin" in Firebase Console');
      return;
    }

    console.log('🔖 Role value:', `"${role}"`);
    console.log('🔖 Role type:', typeof role);

    const validRoles = ['admin', 'super-admin'];
    const isValidRole = validRoles.includes(role);

    if (isValidRole) {
      console.log('✅ Role is valid for admin access');
    } else {
      console.error('❌ Role is NOT valid for admin access');
      console.log('   Valid roles:', validRoles.join(', '));
      console.log('   Your role:', `"${role}"`);
      console.log('\n📝 FIX: Change role to "admin" or "super-admin" in Firebase Console');
      return;
    }

    // Step 4: Test Firestore Permissions
    console.log('\n4️⃣ Testing Firestore Permissions...');

    // Test 1: Can read users collection
    try {
      const testUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      console.log('✅ Can read own user document');
    } catch (error) {
      console.error('❌ Cannot read own user document:', error.message);
    }

    // Test 2: Can read adminActivity collection
    try {
      const { collection, query, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const adminQuery = query(collection(db, 'adminActivity'), limit(1));
      const adminSnapshot = await getDocs(adminQuery);
      console.log('✅ Can read adminActivity collection');
      console.log('   Found', adminSnapshot.size, 'recent activities');
    } catch (error) {
      console.error('❌ Cannot read adminActivity collection:', error.message);
      console.log('   This is the permission error you\'re seeing!');

      if (error.message.includes('permission-denied')) {
        console.log('\n🔍 POSSIBLE CAUSES:');
        console.log('   1. Role field is not exactly "admin" or "super-admin"');
        console.log('   2. Firestore rules not deployed (just deployed them)');
        console.log('   3. Firebase project mismatch');
        console.log('   4. Browser cache issue');

        console.log('\n🛠️  IMMEDIATE FIXES TO TRY:');
        console.log('   1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)');
        console.log('   2. Clear localStorage: localStorage.clear()');
        console.log('   3. Log out and back in');
        console.log('   4. Check Firebase Console role field');
      }
    }

    // Step 5: Check React App State
    console.log('\n5️⃣ Checking React App State...');

    // Try to access the React app's auth context
    const reactUser = window.__REACT_APP_AUTH_USER__ || null;
    if (reactUser) {
      console.log('✅ React auth state found');
      console.log('   isAdmin:', reactUser.isAdmin);
      console.log('   role:', reactUser.role);
    } else {
      console.log('⚠️  Cannot access React auth state from console');
      console.log('   This is normal - the app manages its own state');
    }

    // Step 6: Summary
    console.log('\n📊 SUMMARY:');
    if (isValidRole) {
      console.log('✅ Your role is valid for admin access');
      console.log('✅ Firestore rules should allow access');
      console.log('⚠️  If still getting permission errors, try:');
      console.log('   - Hard refresh the page');
      console.log('   - Clear browser cache');
      console.log('   - Log out and back in');
    } else {
      console.log('❌ Your role needs to be fixed');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }

  console.log('\n==================================');
  console.log('Diagnostic complete!');
})();
