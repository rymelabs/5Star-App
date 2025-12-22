import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
import ConsentBanner from './components/ConsentBanner';
import usePageTracking from './hooks/usePageTracking';
import { initAnalytics, getConsentStatus } from './utils/analytics';

// Lazy loading wrapper with error handling
const withLazyErrorLogging = (label, importer) => React.lazy(async () => {
  try {
    return await importer();
  } catch (error) {
    return { default: () => <div>{`${label} not available`}</div> };
  }
});

// ============================================================================
// LAZY-LOADED USER PAGES (Critical for performance)
// ============================================================================
const Latest = React.lazy(() => import('./pages/Latest'));
const Fixtures = React.lazy(() => import('./pages/Fixtures'));
const FixtureDetail = React.lazy(() => import('./pages/FixtureDetail'));
const Teams = React.lazy(() => import('./pages/Teams'));
const TeamDetail = React.lazy(() => import('./pages/TeamDetail'));
const PlayerDetail = React.lazy(() => import('./pages/PlayerDetail'));
const News = React.lazy(() => import('./pages/News'));
const NewsArticle = React.lazy(() => import('./pages/NewsArticle'));
const Stats = React.lazy(() => import('./pages/Stats'));
const CompetitionDetail = React.lazy(() => import('./pages/CompetitionDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NotificationInbox = React.lazy(() => import('./pages/NotificationInbox'));

// Auth pages
const AuthLanding = React.lazy(() => import('./pages/AuthLanding'));
const EmailAuth = React.lazy(() => import('./pages/EmailAuth'));
const ProfileSetup = React.lazy(() => import('./pages/ProfileSetup'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

// Static/Legal pages
const About = React.lazy(() => import('./pages/About'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const TermsConditions = React.lazy(() => import('./pages/TermsConditions'));
const Licenses = React.lazy(() => import('./pages/Licenses'));
const SubmitTeam = React.lazy(() => import('./pages/SubmitTeam'));

// ============================================================================
// LAZY-LOADED ADMIN PAGES
// ============================================================================

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
const MigrateLogos = withLazyErrorLogging('Migrate Logos', () => import('./pages/admin/MigrateLogos'));

const AppContent = () => {
  const location = useLocation();
  
  // Initialize analytics if user has already consented
  useEffect(() => {
    if (getConsentStatus() === 'granted') {
      const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (measurementId) {
        initAnalytics(measurementId);
      }
    }
  }, []);

  // Track page views
  usePageTracking();
  
  // Add error handling for context
  let user, loading, isAuthenticated;
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
    isAuthenticated = auth.isAuthenticated;
  } catch (error) {
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


  const standaloneRoutes = ['/auth', '/email-auth', '/phone-auth', '/login', '/register'];
  const isStandalone = standaloneRoutes.some((path) => location.pathname.startsWith(path));

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

  const requireSuperAdminElement = (element) => (
    user?.isSuperAdmin
      ? element
      : <Navigate to="/" replace />
  );

  const routedContent = (
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
          <Route path="/competitions/:type/:id" element={<CompetitionDetail />} />
          
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
          <Route path="/notifications" element={<NotificationInbox />} />
          
          {/* Admin Routes - Only accessible to admins */}
          <Route path="/admin" element={requireAdminElement(<AdminDashboard />)} />
          <Route path="/admin/dashboard" element={requireAdminElement(<AdminDashboard />)} />
          <Route path="/admin/teams" element={requireAdminElement(<AdminTeams />)} />
          <Route path="/admin/teams/upload" element={requireAdminElement(<BulkTeamUploadPage />)} />
          <Route path="/admin/teams/migrate-logos" element={requireAdminElement(<MigrateLogos />)} />
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
          <Route path="/admin/notifications" element={requireSuperAdminElement(<AdminNotifications />)} />
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
  );

  if (isStandalone) {
    return (
      <>
        {routedContent}
        <ConsentBanner />
      </>
    );
  }

  return (
    <>
      <Layout>{routedContent}</Layout>
      <ConsentBanner />
    </>
  );
};

export default AppContent;
