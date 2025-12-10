import React from 'react';
import { getFirebaseConfigStatus } from '../utils/firebaseCheck';

const FirebaseStatus = () => {
  const config = getFirebaseConfigStatus();
  
  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed top-20 right-4 bg-dark-900 border border-dark-700 rounded-lg p-4 text-xs z-50">
      <h3 className="font-bold text-primary-500 mb-2">Firebase Config Status</h3>
      {Object.entries(config).map(([key, status]) => (
        <div key={key} className="flex justify-between">
          <span className="text-gray-400">{key}:</span>
          <span className={status.includes('✅') ? 'text-accent-400' : 'text-red-400'}>
            {status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FirebaseStatus;
