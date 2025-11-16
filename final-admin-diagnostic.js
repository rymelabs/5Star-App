// Final Admin Access Diagnostic Script
// Run this in your browser console while logged in as admin

console.log('🔍 Final Admin Access Diagnostic');
console.log('================================');

// Check Firebase Auth
import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js').then(() => {
  const auth = firebase.auth();
  const user = auth.currentUser;

  if (!user) {
    console.error('❌ No user logged in');
    return;
  }

  console.log('✅ User logged in:', user.email);
  console.log('📧 UID:', user.uid);

  // Check Firestore user document
  import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js').then(() => {
    const db = firebase.firestore();

    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        console.log('👤 User data:', userData);
        console.log('🔑 Role:', userData.role);

        if (userData.role === 'admin' || userData.role === 'super-admin') {
          console.log('✅ User has admin role');

          // Test admin collections access
          const collections = ['adminActivity', 'teams', 'fixtures', 'articles', 'seasons', 'settings'];

          collections.forEach(collection => {
            db.collection(collection).limit(1).get().then(snapshot => {
              console.log(`✅ Can read ${collection} collection`);
            }).catch(error => {
              console.error(`❌ Cannot read ${collection}:`, error.message);
            });
          });

          // Test write access to adminActivity
          db.collection('adminActivity').add({
            type: 'diagnostic_test',
            timestamp: new Date(),
            userId: user.uid,
            message: 'Admin access diagnostic test'
          }).then(() => {
            console.log('✅ Can write to adminActivity collection');
          }).catch(error => {
            console.error('❌ Cannot write to adminActivity:', error.message);
          });

        } else {
          console.error('❌ User does not have admin role');
        }
      } else {
        console.error('❌ User document not found');
      }
    }).catch(error => {
      console.error('❌ Error fetching user document:', error.message);
    });
  });
}).catch(error => {
  console.error('❌ Error importing Firebase modules:', error);
});

console.log('⏳ Running diagnostics... Check results above.');