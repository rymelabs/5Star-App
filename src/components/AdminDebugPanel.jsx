import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirebaseDb } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Admin Debug Panel
 * Add this component temporarily to your app to debug admin access issues
 * 
 * Usage:
 * 1. Import this component in your App.jsx or any page
 * 2. Add <AdminDebugPanel /> somewhere visible (top of page)
 * 3. Check the output
 * 4. Remove after debugging
 */
const AdminDebugPanel = () => {
  const { user, loading } = useAuth();
  const [firestoreData, setFirestoreData] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const checkFirestore = async () => {
    if (!user?.uid) {
      setError('No user UID available');
      return;
    }

    try {
      setChecking(true);
      setError(null);
      const db = getFirebaseDb();
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setFirestoreData(userDoc.data());
      } else {
        setError('User document not found in Firestore!');
      }
    } catch (err) {
      setError('Error fetching from Firestore: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      checkFirestore();
    }
  }, [user?.uid]);

  const forceRefresh = () => {
    // Clear any cached data
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.toLowerCase().includes('auth') || 
      key.toLowerCase().includes('user') ||
      key.toLowerCase().includes('firebase')
    );
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-[9999] bg-yellow-900 text-yellow-100 p-4 rounded-lg shadow-lg max-w-md">
        <h3 className="font-bold text-sm mb-2">🔍 Admin Debug Panel</h3>
        <p className="text-xs">Loading auth state...</p>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg max-w-md border-2 border-yellow-500">
      <h3 className="font-bold text-sm mb-3 text-yellow-400">🔍 Admin Debug Panel</h3>
      
      {/* Current Auth State */}
      <div className="mb-3 text-xs">
        <h4 className="font-semibold text-white mb-1">📱 React Auth Context:</h4>
        <div className="bg-gray-800 p-2 rounded font-mono">
          <div>Email: <span className="text-blue-400">{user?.email || 'N/A'}</span></div>
          <div>UID: <span className="text-blue-400">{user?.uid || 'N/A'}</span></div>
          <div>Role: <span className="text-yellow-400">{user?.role || 'NOT SET'}</span></div>
          <div>isAdmin: <span className={user?.isAdmin ? 'text-green-400' : 'text-red-400'}>
            {user?.isAdmin ? 'TRUE ✅' : 'FALSE ❌'}
          </span></div>
          <div>isSuperAdmin: <span className={user?.isSuperAdmin ? 'text-green-400' : 'text-gray-400'}>
            {user?.isSuperAdmin ? 'TRUE' : 'FALSE'}
          </span></div>
        </div>
      </div>

      {/* Firestore State */}
      <div className="mb-3 text-xs">
        <h4 className="font-semibold text-white mb-1 flex items-center justify-between">
          <span>🔥 Firestore Document:</span>
          <button 
            onClick={checkFirestore}
            disabled={checking}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Refresh'}
          </button>
        </h4>
        {error ? (
          <div className="bg-red-900 text-red-100 p-2 rounded">
            ⚠️ {error}
          </div>
        ) : firestoreData ? (
          <div className="bg-gray-800 p-2 rounded font-mono">
            <div>Email: <span className="text-blue-400">{firestoreData.email || 'N/A'}</span></div>
            <div>Name: <span className="text-blue-400">{firestoreData.name || 'N/A'}</span></div>
            <div>Role: <span className="text-yellow-400">{firestoreData.role || 'NOT SET'}</span></div>
            <div className="text-gray-400 text-[10px] mt-1">
              Created: {firestoreData.createdAt || 'N/A'}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-2 rounded text-gray-400">
            Loading...
          </div>
        )}
      </div>

      {/* Diagnosis */}
      <div className="mb-3 text-xs">
        <h4 className="font-semibold text-white mb-1">💡 Diagnosis:</h4>
        <div className="bg-gray-800 p-2 rounded">
          {!user ? (
            <div className="text-red-400">❌ Not logged in</div>
          ) : !firestoreData ? (
            <div className="text-yellow-400">⏳ Checking Firestore...</div>
          ) : firestoreData.role === 'admin' || firestoreData.role === 'super-admin' ? (
            user?.isAdmin ? (
              <div className="text-green-400">✅ All good! You should have access.</div>
            ) : (
              <div className="text-red-400">
                ⚠️ Role is "{firestoreData.role}" in Firestore but isAdmin is FALSE in React!
                <br />This means the auth state needs to be refreshed.
              </div>
            )
          ) : (
            <div className="text-red-400">
              ❌ Role in Firestore: "{firestoreData.role || 'not set'}"
              <br />Needs to be "admin" or "super-admin"
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {firestoreData && (firestoreData.role === 'admin' || firestoreData.role === 'super-admin') && !user?.isAdmin && (
          <button
            onClick={forceRefresh}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold"
          >
            🔄 Force Refresh (Clear Cache & Reload)
          </button>
        )}
        
        {user?.uid && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold text-center"
          >
            🔗 Open in Firebase Console
          </a>
        )}
        
        <button
          onClick={() => {
              k.includes('auth') || k.includes('user') || k.includes('firebase')
            ));
            alert('Debug info logged to console (F12)');
          }}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs"
        >
          📋 Log Full Debug Info
        </button>
      </div>

      <div className="mt-3 text-[10px] text-gray-400 text-center">
        Remove this component after debugging
      </div>
    </div>
  );
};

export default AdminDebugPanel;
