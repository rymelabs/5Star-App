import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Latest from './pages/Latest';
import Fixtures from './pages/Fixtures';
import FixtureDetail from './pages/FixtureDetail';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import PlayerDetail from './pages/PlayerDetail';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import AuthLanding from './pages/AuthLanding';
import EmailAuth from './pages/EmailAuth';
import ProfileSetup from './pages/ProfileSetup';
import NotificationInbox from './pages/NotificationInbox';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import TermsConditions from './pages/TermsConditions';
import Licenses from './pages/Licenses';

// Admin components with lazy loading to avoid import errors
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').catch(() => ({ default: () => <div>Admin Dashboard not available</div> })));
const AdminTeams = React.lazy(() => import('./pages/admin/AdminTeams').catch(() => ({ default: () => <div>Admin Teams not available</div> })));
const EditTeam = React.lazy(() => import('./pages/admin/EditTeam').catch(() => ({ default: () => <div>Edit Team not available</div> })));
const AdminFixtures = React.lazy(() => import('./pages/admin/AdminFixtures').catch(() => ({ default: () => <div>Admin Fixtures not available</div> })));
const AdminNews = React.lazy(() => import('./pages/admin/AdminNews').catch(() => ({ default: () => <div>Admin News not available</div> })));
const AdminLeagueSettings = React.lazy(() => import('./pages/admin/AdminLeagueSettings').catch(() => ({ default: () => <div>Admin League Settings not available</div> })));
const AdminLeagues = React.lazy(() => import('./pages/admin/AdminLeagues').catch(() => ({ default: () => <div>Admin Leagues not available</div> })));
const CreateLeague = React.lazy(() => import('./pages/admin/CreateLeague').catch(() => ({ default: () => <div>Create League not available</div> })));
const EditLeague = React.lazy(() => import('./pages/admin/EditLeague').catch(() => ({ default: () => <div>Edit League not available</div> })));
const AdminSeasons = React.lazy(() => import('./pages/admin/AdminSeasons').catch(() => ({ default: () => <div>Admin Seasons not available</div> })));
const CreateSeason = React.lazy(() => import('./pages/admin/CreateSeason').catch(() => ({ default: () => <div>Create Season not available</div> })));
const EditSeason = React.lazy(() => import('./pages/admin/EditSeason').catch(() => ({ default: () => <div>Edit Season not available</div> })));
const SeasonDetail = React.lazy(() => import('./pages/admin/SeasonDetail').catch(() => ({ default: () => <div>Season Detail not available</div> })));
const InstagramSettings = React.lazy(() => import('./pages/admin/InstagramSettings').catch(() => ({ default: () => <div>Instagram Settings not available</div> })));
const AdvancedSettings = React.lazy(() => import('./pages/admin/AdvancedSettings').catch(() => ({ default: () => <div>Advanced Settings not available</div> })));
const AdminNotifications = React.lazy(() => import('./pages/admin/AdminNotifications').catch(() => ({ default: () => <div>Admin Notifications not available</div> })));

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
  // Add error handling for context
  let user, loading;
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
  } catch (error) {
    console.error('❌ Error accessing AuthContext:', error);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-xl mb-4">⚠️ Authentication Error</div>
          <p className="text-gray-400 mb-4">
            Unable to access authentication context. Please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

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
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/licenses" element={<Licenses />} />
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
          <Route path="/fixtures/:id" element={<FixtureDetail />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/teams/:teamId/players/:id" element={<PlayerDetail />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsArticle />} />
          <Route path="/stats" element={<Stats />} />
          
          {/* About page - accessible to all users */}
          <Route path="/about" element={<About />} />
          
          {/* Legal pages - accessible to all users */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/licenses" element={<Licenses />} />
          
          {/* Profile setup for new users */}
          <Route path="/profile-setup" element={<ProfileSetup />} />
          
          {/* Profile page - not available for anonymous users */}
          {!user.isAnonymous && (
            <Route path="/profile" element={<Profile />} />
          )}
          
          {/* Settings page - not available for anonymous users */}
          {!user.isAnonymous && (
            <>
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<NotificationInbox />} />
            </>
          )}
          
          {/* Admin Routes - Only accessible to admins */}
          {user.role === 'admin' && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/teams" element={<AdminTeams />} />
              <Route path="/admin/teams/edit/:teamId" element={<EditTeam />} />
              <Route path="/admin/fixtures" element={<AdminFixtures />} />
              <Route path="/admin/news" element={<AdminNews />} />
              <Route path="/admin/league-settings" element={<AdminLeagueSettings />} />
              <Route path="/admin/leagues" element={<AdminLeagues />} />
              <Route path="/admin/leagues/create" element={<CreateLeague />} />
              <Route path="/admin/leagues/edit/:id" element={<EditLeague />} />
              <Route path="/admin/seasons" element={<AdminSeasons />} />
              <Route path="/admin/seasons/create" element={<CreateSeason />} />
              <Route path="/admin/seasons/:seasonId/edit" element={<EditSeason />} />
              <Route path="/admin/seasons/:seasonId" element={<SeasonDetail />} />
              <Route path="/admin/instagram" element={<InstagramSettings />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/advanced-settings" element={<AdvancedSettings />} />
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
            <>
              <Route path="/profile" element={<Navigate to="/auth" replace />} />
              <Route path="/settings" element={<Navigate to="/auth" replace />} />
            </>
          )}
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </Layout>
  );
};

export default AppContent;