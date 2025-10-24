import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFootball } from '../../context/FootballContext';
import { useNews } from '../../context/NewsContext';
import { useLanguage } from '../../context/LanguageContext';
import { adminActivityCollection } from '../../firebase/firestore';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Calendar, 
  Newspaper, 
  Trophy, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity,
  Instagram,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Database,
  Bell,
  Inbox
} from 'lucide-react';
import AdminTeams from './AdminTeams';
import AdminFixtures from './AdminFixtures';
import AdminNews from './AdminNews';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ownedTeams, ownedFixtures, leagueTable } = useFootball();
  const { articles } = useNews();
  const { t } = useLanguage();
  const teams = ownedTeams;
  const fixtures = ownedFixtures;
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Fetch recent activities
  useEffect(() => {
    // Only fetch activities if user is admin
    if (!user || !user.isAdmin) return;

    const unsubscribe = adminActivityCollection.onSnapshot(4, (activities) => {
      const filtered = user.isSuperAdmin
        ? activities
        : activities.filter(activity => activity.userId === user.uid);
      setRecentActivities(filtered);
    });

    return () => unsubscribe();
  }, [user]);

  // Load more activities
  const handleLoadMore = async () => {
    if (loadingMore) return;
    
    try {
      setLoadingMore(true);
      // Fetch all activities (up to 50)
      const allActivities = await adminActivityCollection.getRecent(50);
      const filtered = user?.isSuperAdmin
        ? allActivities
        : allActivities.filter(activity => activity.userId === user?.uid);
      setRecentActivities(filtered);
      setShowAllActivities(true);
    } catch (error) {
      console.error('Error loading more activities:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Show less activities
  const handleShowLess = () => {
    setRecentActivities(prev => prev.slice(0, 4));
    setShowAllActivities(false);
  };

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="p-4 text-center">
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t('pages.admin.accessDenied')}</h2>
          <p className="text-gray-400 mb-6">{t('pages.admin.accessDeniedDesc')}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            {t('pages.admin.goHome')}
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: t('pages.admin.totalTeams'),
      value: ownedTeams.length,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/10',
    },
    {
      title: t('pages.admin.activeFixtures'),
      value: ownedFixtures.filter(f => f.status !== 'completed').length,
      icon: Calendar,
      color: 'text-accent-400',
      bgColor: 'bg-accent-600/10',
    },
    {
      title: t('pages.admin.publishedNews'),
      value: articles.length,
      icon: Newspaper,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/10',
    },
    {
      title: t('pages.admin.leaguePositions'),
      value: leagueTable.length,
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/10',
    },
  ];

  const quickActions = [
    {
      title: t('pages.admin.addNewTeam'),
      description: t('pages.admin.addNewTeamDesc'),
      icon: Users,
      color: 'text-blue-400',
      onClick: () => navigate('/admin/teams'),
    },
    {
      title: t('pages.admin.scheduleFixture'),
      description: t('pages.admin.scheduleFixtureDesc'),
      icon: Calendar,
      color: 'text-accent-400',
      onClick: () => navigate('/admin/fixtures'),
    },
    {
      title: t('pages.admin.writeArticle'),
      description: t('pages.admin.writeArticleDesc'),
      icon: Newspaper,
      color: 'text-purple-400',
      onClick: () => navigate('/admin/news'),
    },
    {
      title: t('pages.admin.viewSubmissions'),
      description: t('pages.admin.viewSubmissionsDesc') || 'Review team submissions',
      icon: Inbox,
      color: 'text-green-400',
      onClick: () => navigate('/admin/submissions'),
    },
    {
      title: t('pages.admin.newSeason'),
      description: t('pages.admin.newSeasonDesc'),
      icon: Trophy,
      color: 'text-primary-400',
      onClick: () => navigate('/admin/seasons/create'),
    },
    {
      title: t('pages.admin.fullStats') || 'Full Stats',
      description: t('pages.admin.fullStatsDesc') || 'View site engagement and analytics',
      icon: BarChart3,
      color: 'text-cyan-400',
      onClick: () => navigate('/admin/stats'),
    },
  ];

  const managementSections = [
    {
      title: t('pages.admin.seasonsManagement'),
      description: t('pages.admin.seasonsManagementDesc'),
      icon: Trophy,
      path: '/admin/seasons',
      color: 'text-primary-400',
      count: '-',
    },
    {
      title: t('pages.admin.leaguesManagement'),
      description: t('pages.admin.leaguesManagementDesc'),
      icon: Trophy,
      path: '/admin/leagues',
      color: 'text-green-400',
      count: '-',
    },
    {
      title: t('pages.admin.teamsManagement'),
      description: t('pages.admin.teamsManagementDesc'),
      icon: Users,
      path: '/admin/teams',
      color: 'text-blue-400',
      count: teams.length,
    },
    {
      title: t('pages.admin.submissionsManagement'),
      description: t('pages.admin.submissionsManagementDesc') || 'Manage incoming team submissions',
      icon: Inbox,
      path: '/admin/submissions',
      color: 'text-green-400',
      count: '-'
    },
    {
      title: t('pages.admin.fixturesManagement'),
      description: t('pages.admin.fixturesManagementDesc'),
      icon: Calendar,
      path: '/admin/fixtures',
      color: 'text-accent-400',
      count: fixtures.length,
    },
    {
      title: t('pages.admin.newsManagement'),
      description: t('pages.admin.newsManagementDesc'),
      icon: Newspaper,
      path: '/admin/news',
      color: 'text-purple-400',
      count: articles.length,
    },
    {
      title: t('pages.admin.notificationsManagement'),
      description: t('pages.admin.notificationsManagementDesc'),
      icon: Bell,
      path: '/admin/notifications',
      color: 'text-cyan-400',
      count: '-',
    },
    {
      title: t('pages.admin.leagueSettings'),
      description: t('pages.admin.leagueSettingsDesc'),
      icon: Settings,
      path: '/admin/league-settings',
      color: 'text-yellow-400',
      count: '-',
    },
    {
      title: t('pages.admin.instagramSettings'),
      description: t('pages.admin.instagramSettingsDesc'),
      icon: Instagram,
      path: '/admin/instagram',
      color: 'text-pink-400',
      count: '-',
    },
    {
      title: t('pages.admin.advancedSettings'),
      description: t('pages.admin.advancedSettingsDesc'),
      icon: Database,
      path: '/admin/advanced-settings',
      color: 'text-red-400',
      count: '-',
    },
  ];



  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="ml-2">
            <h1 className="admin-header">{t('navigation.adminDashboard')}</h1>
            <p className="text-sm text-gray-400">{t('pages.admin.manageContent')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Welcome Section */}
        <div className="card p-6 mb-8 bg-gradient-to-r from-primary-600/10 to-accent-600/10 border-primary-600/20">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mr-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                {t('pages.admin.welcomeBack').replace('{name}', user.name)}
              </h2>
              <p className="text-gray-400">
                {t('pages.admin.whatsHappening')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-lg font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.admin.quickActions')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className="card p-4 text-left hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-start">
                    <Icon className={`w-6 h-6 ${action.color} mr-3 mt-1`} />
                    <div>
                      <h4 className="font-medium text-white mb-1">{action.title}</h4>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Modal */}
        {showStats && (
          <StatsModal onClose={() => setShowStats(false)} />
        )}

        {/* Management Sections */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.admin.contentManagement')}</h3>
          <div className="space-y-4">
            {managementSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.title}
                  onClick={() => navigate(section.path)}
                  className="w-full card p-4 text-left hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <Icon className={`w-6 h-6 ${section.color} mr-3 mt-1`} />
                      <div>
                        <h4 className="font-medium text-white mb-1">{section.title}</h4>
                        <p className="text-sm text-gray-400">{section.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{section.count}</div>
                      <div className="text-xs text-gray-500">{t('pages.admin.items')}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.admin.recentActivity')}</h3>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              <>
                {recentActivities.map((activity) => {
                  // Determine icon and color based on activity type
                  let Icon, bgColor;
                  switch (activity.type) {
                    case 'team':
                      Icon = Users;
                      bgColor = 'bg-blue-600';
                      break;
                    case 'fixture':
                      Icon = Calendar;
                      bgColor = 'bg-accent-600';
                      break;
                    case 'news':
                    case 'article':
                      Icon = Newspaper;
                      bgColor = 'bg-purple-600';
                      break;
                    default:
                      Icon = Activity;
                      bgColor = 'bg-gray-600';
                  }

                  // Format action text
                  let actionText = '';
                  if (activity.action === 'add') actionText = t('pages.admin.added');
                  else if (activity.action === 'update') actionText = t('pages.admin.updated');
                  else if (activity.action === 'delete') actionText = t('pages.admin.deleted');
                  else actionText = activity.action;

                  // Format time ago
                  const timeAgo = (date) => {
                    const seconds = Math.floor((new Date() - date) / 1000);
                    if (seconds < 60) return t('pages.admin.justNow');
                    const minutes = Math.floor(seconds / 60);
                    if (minutes < 60) return t('pages.admin.minutesAgo').replace('{minutes}', minutes);
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) return t('pages.admin.hoursAgo').replace('{hours}', hours);
                    const days = Math.floor(hours / 24);
                    if (days < 7) return t('pages.admin.daysAgo').replace('{days}', days);
                    return date.toLocaleDateString();
                  };

                  return (
                    <div key={activity.id} className="card p-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {actionText} {activity.type}: {activity.itemName}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {timeAgo(activity.createdAt)} • {t('pages.admin.by')} {activity.userName}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* See More / See Less Button */}
                {recentActivities.length >= 4 && (
                  <button
                    onClick={showAllActivities ? handleShowLess : handleLoadMore}
                    disabled={loadingMore}
                    className="w-full card p-3 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        {t('common.loading')}
                      </>
                    ) : showAllActivities ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        {t('pages.admin.seeLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t('pages.admin.seeMore')}
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="card p-8 text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('pages.admin.noRecentActivity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
