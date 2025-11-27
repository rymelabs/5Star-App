import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
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
import SubmitTeam from './pages/SubmitTeam';

// Admin components with lazy loading to avoid import errors
const withLazyErrorLogging = (label, importer) => React.lazy(async () => {
  try {
    return await importer();
  } catch (error) {
    console.error(`❌ Failed to load ${label}:`, error);
    return { default: () => <div>{`${label} not available`}</div> };
  }
});

const AdminDashboard = withLazyErrorLogging('Admin Dashboard', () => import('./pages/admin/AdminDashboard'));
const AdminTeams = withLazyErrorLogging('Admin Teams', () => import('./pages/admin/AdminTeams'));
const EditTeam = withLazyErrorLogging('Edit Team', () => import('./pages/admin/EditTeam'));
const AdminFixtures = withLazyErrorLogging('Admin Fixtures', () => import('./pages/admin/AdminFixtures'));
const AdminNews = withLazyErrorLogging('Admin News', () => import('./pages/admin/AdminNews'));
const EditNews = withLazyErrorLogging('Edit News', () => import('./pages/admin/EditNews'));
const AdminLeagueSettings = withLazyErrorLogging('Admin League Settings', () => import('./pages/admin/AdminLeagueSettings'));
const AdminLeagues = withLazyErrorLogging('Admin Leagues', () => import('./pages/admin/AdminLeagues'));
const CreateLeague = withLazyErrorLogging('Create League', () => import('./pages/admin/CreateLeague'));
const EditLeague = withLazyErrorLogging('Edit League', () => import('./pages/admin/EditLeague'));
const AdminSeasons = withLazyErrorLogging('Admin Seasons', () => import('./pages/admin/AdminSeasons'));
const CreateSeason = withLazyErrorLogging('Create Season', () => import('./pages/admin/CreateSeason'));
const EditSeason = withLazyErrorLogging('Edit Season', () => import('./pages/admin/EditSeason'));
const SeasonDetail = withLazyErrorLogging('Season Detail', () => import('./pages/admin/SeasonDetail'));
const InstagramSettings = withLazyErrorLogging('Instagram Settings', () => import('./pages/admin/InstagramSettings'));
const AdvancedSettings = withLazyErrorLogging('Advanced Settings', () => import('./pages/admin/AdvancedSettings'));
const AdminNotifications = withLazyErrorLogging('Admin Notifications', () => import('./pages/admin/AdminNotifications'));
const BulkTeamUploadPage = withLazyErrorLogging('Bulk Upload page', () => import('./pages/admin/BulkTeamUploadPage'));
const AdminSubmissions = withLazyErrorLogging('Admin Submissions', () => import('./pages/admin/AdminSubmissions'));
const AdminStats = withLazyErrorLogging('Admin Stats', () => import('./pages/admin/AdminStats'));
const RecycleBin = withLazyErrorLogging('Recycle Bin', () => import('./pages/admin/RecycleBin'));

const AppContent = () => {
  // Add error handling for context
  let user, loading, isAuthenticated;
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
    isAuthenticated = auth.isAuthenticated;
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
    return <LoadingScreen message="Loading" />;
  }

  console.log('🔍 AppContent - Current user state:', user ? `Logged in as ${user.email}` : 'Not logged in');

  const location = useLocation();

  const requireAuthElement = (element) => (
    isAuthenticated
      ? element
      : <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />
  );

  const requireAdminElement = (element) => (
    user?.isAdmin
      ? element
      : <Navigate to="/" replace />
  );

  return (
    <Layout>
      <React.Suspense fallback={
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      }>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
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
            <Route path="/submit-team" element={<SubmitTeam />} />
            
            {/* Legal pages - accessible to all users */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/licenses" element={<Licenses />} />
            
            {/* Profile + settings flows require authentication */}
            <Route path="/profile-setup" element={requireAuthElement(<ProfileSetup />)} />
            <Route path="/profile" element={requireAuthElement(<Profile />)} />
            <Route path="/settings" element={requireAuthElement(<Settings />)} />
            <Route path="/notifications" element={requireAuthElement(<NotificationInbox />)} />
            
            {/* Admin Routes - Only accessible to admins */}
            <Route path="/admin" element={requireAdminElement(<AdminDashboard />)} />
            <Route path="/admin/dashboard" element={requireAdminElement(<AdminDashboard />)} />
            <Route path="/admin/teams" element={requireAdminElement(<AdminTeams />)} />
            <Route path="/admin/teams/upload" element={requireAdminElement(<BulkTeamUploadPage />)} />
            <Route path="/admin/submissions" element={requireAdminElement(<AdminSubmissions />)} />
            <Route path="/admin/teams/edit/:teamId" element={requireAdminElement(<EditTeam />)} />
            <Route path="/admin/fixtures" element={requireAdminElement(<AdminFixtures />)} />
            <Route path="/admin/news" element={requireAdminElement(<AdminNews />)} />
            <Route path="/admin/news/edit/:id" element={requireAdminElement(<EditNews />)} />
            <Route path="/admin/league-settings" element={requireAdminElement(<AdminLeagueSettings />)} />
            <Route path="/admin/leagues" element={requireAdminElement(<AdminLeagues />)} />
            <Route path="/admin/leagues/create" element={requireAdminElement(<CreateLeague />)} />
            <Route path="/admin/leagues/edit/:id" element={requireAdminElement(<EditLeague />)} />
            <Route path="/admin/seasons" element={requireAdminElement(<AdminSeasons />)} />
            <Route path="/admin/seasons/create" element={requireAdminElement(<CreateSeason />)} />
            <Route path="/admin/seasons/:seasonId/edit" element={requireAdminElement(<EditSeason />)} />
            <Route path="/admin/seasons/:seasonId" element={requireAdminElement(<SeasonDetail />)} />
            <Route path="/admin/instagram" element={requireAdminElement(<InstagramSettings />)} />
            <Route path="/admin/notifications" element={requireAdminElement(<AdminNotifications />)} />
            <Route path="/admin/stats" element={requireAdminElement(<AdminStats />)} />
            <Route path="/admin/advanced-settings" element={requireAdminElement(<AdvancedSettings />)} />
            <Route path="/admin/recycle-bin" element={requireAdminElement(<RecycleBin />)} />
            
            {/* Auth surfaces */}
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthLanding />} />
            <Route path="/email-auth" element={isAuthenticated ? <Navigate to="/" replace /> : <EmailAuth />} />
            <Route path="/phone-auth" element={<Navigate to="/auth" replace />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </React.Suspense>
    </Layout>
  );
};

export default AppContent;
