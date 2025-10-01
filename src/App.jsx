import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import AppContent from './AppContent';
import FirebaseStatus from './components/FirebaseStatus';

function App() {
  return (
    <AppProvider>
      <Router>
        <FirebaseStatus />
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
