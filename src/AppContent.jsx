import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Latest from './pages/Latest';
import Fixtures from './pages/Fixtures';
import FixtureDetail from './pages/FixtureDetail';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AuthLanding from './pages/AuthLanding';
import EmailAuth from './pages/EmailAuth';
import ProfileSetup from './pages/ProfileSetup';

// Admin components with lazy loading to avoid import errors
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').catch(() => ({ default: () => <div>Admin Dashboard not available</div> })));
const AdminTeams = React.lazy(() => import('./pages/admin/AdminTeams').catch(() => ({ default: () => <div>Admin Teams not available</div> })));
const AdminFixtures = React.lazy(() => import('./pages/admin/AdminFixtures').catch(() => ({ default: () => <div>Admin Fixtures not available</div> })));
const AdminNews = React.lazy(() => import('./pages/admin/AdminNews').catch(() => ({ default: () => <div>Admin News not available</div> })));

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
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('🔍 AppContent - Current user state:', user ? `Logged in as ${user.email}` : 'Not logged in');

  // If not authenticated, show auth pages
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthLanding />} />
        <Route path="/email-auth" element={<EmailAuth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // If authenticated, show main app
  return (
    <Layout>
      <React.Suspense fallback={
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Latest />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/fixture/:id" element={<FixtureDetail />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsArticle />} />
          
          {/* Profile setup for new users */}
          <Route path="/profile-setup" element={<ProfileSetup />} />
          
          {/* Profile page - not available for anonymous users */}
          {!user.isAnonymous && (
            <Route path="/profile" element={<Profile />} />
          )}
          
          {/* Admin Routes - Only accessible to admins */}
          {user.role === 'admin' && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/teams" element={<AdminTeams />} />
              <Route path="/admin/fixtures" element={<AdminFixtures />} />
              <Route path="/admin/news" element={<AdminNews />} />
            </>
          )}
          
          {/* Redirect auth pages if already logged in */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/email-auth" element={<Navigate to="/" replace />} />
          <Route path="/phone-auth" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          
          {/* Anonymous users trying to access restricted pages */}
          {user.isAnonymous && (
            <Route path="/profile" element={<Navigate to="/auth" replace />} />
          )}
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </Layout>
  );
};

export default AppContent;