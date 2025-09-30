import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Latest from './pages/Latest';
import LatestSimple from './pages/LatestSimple';
import Fixtures from './pages/Fixtures';
import FixtureDetail from './pages/FixtureDetail';
import News from './pages/News';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeams from './pages/admin/AdminTeams';
import AdminFixtures from './pages/admin/AdminFixtures';
import AdminNews from './pages/admin/AdminNews';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

// Auth Route Component (redirect if already authenticated)
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/auth/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/auth/register" element={
        <AuthRoute>
          <Register />
        </AuthRoute>
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <ErrorBoundary>
            <Latest />
          </ErrorBoundary>
        } />
        <Route path="fixtures" element={<Fixtures />} />
        <Route path="fixtures/:id" element={<FixtureDetail />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<ArticleDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/teams" element={<AdminTeams />} />
        <Route path="admin/fixtures" element={<AdminFixtures />} />
        <Route path="admin/news" element={<AdminNews />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppContent;