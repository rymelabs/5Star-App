import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Newspaper, TrendingUp, LayoutDashboard, Settings, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const mainNavItems = [
    { icon: Home, label: t('navigation.latest'), path: '/' },
    { icon: Calendar, label: t('navigation.fixtures'), path: '/fixtures' },
    { icon: Users, label: t('navigation.teams'), path: '/teams' },
    { icon: Newspaper, label: t('navigation.news'), path: '/news' },
    { icon: TrendingUp, label: t('stats.title'), path: '/stats' },
  ];

  const userNavItems = [
    { icon: LayoutDashboard, label: t('navigation.dashboard'), path: '/profile' },
    { icon: Settings, label: t('navigation.settings'), path: '/settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      
      {/* Desktop Sidebar - Hidden on mobile, visible on tablet/desktop (md+) screens */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-16 bottom-0 w-64 bg-dark-800 border-r border-dark-700 z-30">
        <div className="flex-1 overflow-y-auto py-6 hide-scrollbar">
          {/* Main Navigation */}
          <nav className="px-3 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section - Dashboard & Settings */}
          <div className="px-3 mt-6 mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
              {t('navigation.myAccount')}
            </div>
          </div>
          <nav className="px-3 space-y-1">
            {userNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Admin Section - if user is admin */}
          {user?.role === 'admin' && (
            <>
              <div className="px-3 mt-6 mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
                  {t('navigation.adminPanel')}
                </div>
              </div>
              <nav className="px-3 space-y-1">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-accent-600 text-white'
                      : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">{t('navigation.adminDashboard')}</span>
                </button>
              </nav>
            </>
          )}
        </div>

        {/* User Profile Section at Bottom */}
        <div className="border-t border-dark-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t('common.logout')}</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content - Add left padding on tablet/desktop to account for sidebar */}
      <main className="flex-1 overflow-y-auto bg-black pt-16 pb-24 md:pl-64 md:pb-6 hide-scrollbar">
        {children}
      </main>
      
      {/* Bottom Navigation - Hidden on tablet/desktop */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Layout;