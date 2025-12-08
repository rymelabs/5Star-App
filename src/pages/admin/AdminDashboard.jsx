import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFootball } from '../../context/FootballContext';
import { useNews } from '../../context/NewsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRecycleBin } from '../../context/RecycleBinContext';
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
  Inbox,
  RotateCcw
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
  const { recycleBinItems } = useRecycleBin();
  const teams = ownedTeams;
  const fixtures = ownedFixtures;
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const pageMotionProps = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
    transition: { duration: 0.3, ease: 'easeOut' },
  };

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
      <motion.div {...pageMotionProps} className="p-4 text-center">
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
      </motion.div>
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
    ...(user?.isSuperAdmin ? [{
      title: t('pages.admin.leaguesManagement'),
      description: t('pages.admin.leaguesManagementDesc'),
      icon: Trophy,
      path: '/admin/leagues',
      color: 'text-green-400',
    }] : []),
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
      count: '-',
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
    ...(user?.isSuperAdmin ? [{
      title: t('pages.admin.notificationsManagement'),
      description: t('pages.admin.notificationsManagementDesc'),
      icon: Bell,
      path: '/admin/notifications',
      color: 'text-cyan-400',
      count: '-',
    }] : []),
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
    {
      title: 'Recycle Bin',
      description: 'View and restore deleted items',
      icon: RotateCcw,
      path: '/admin/recycle-bin',
      color: 'text-gray-400',
      count: recycleBinItems.length || 0,
    },
  ];



  return (
    <motion.div {...pageMotionProps} className="relative min-h-screen">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20 border-b border-white/5">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="ml-2">
            <h1 className="text-lg font-bold tracking-tight text-white">{t('navigation.adminDashboard')}</h1>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 space-y-8">
        {/* Welcome Section */}
        <div className="px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-purple/20 to-blue-600/20 border border-white/10 p-1">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
            <div className="relative p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-purple flex items-center justify-center shadow-lg shadow-brand-purple/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  {t('pages.admin.welcomeBack').replace('{name}', user.name)}
                </h2>
                <p className="text-sm text-white/60">
                  {t('pages.admin.whatsHappening')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <div className={`w-8 h-8 rounded-full ${stat.bgColor} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 px-4">
          <div className="flex items-center gap-2 text-brand-purple px-2">
            <Activity className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-[0.15em]">{t('pages.admin.quickActions')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4 text-left hover:bg-white/10 transition-all group"
              >
                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{action.title}</h3>
                <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Management Sections */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-brand-purple px-6">
            <Settings className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-[0.15em]">{t('pages.admin.management')}</h2>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/5 divide-y divide-white/5 rounded-2xl overflow-hidden">
            {managementSections.filter(Boolean).map((section, index) => (
              <button
                key={index}
                onClick={() => navigate(section.path)}
                className="w-full px-6 py-4 flex items-center justify-between group hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <section.icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white/90 transition-colors">{section.title}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {section.count !== '-' && (
                    <span className="px-2 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white/60">
                      {section.count}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-white/20 -rotate-90 group-hover:text-white/60 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3 pb-8">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-brand-purple">
              <Eye className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em]">{t('pages.admin.recentActivity')}</h2>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/5 divide-y divide-white/5 rounded-2xl overflow-hidden">
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
                    if (!date) return '';
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
                    <div key={activity.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                           </div>
                           <div>
                              <p className="text-sm font-medium text-white">
                                {actionText} {activity.type}: {activity.itemName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-white/40">
                                  {timeAgo(activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt))} • {t('pages.admin.by')} {activity.userName}
                                </span>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {recentActivities.length >= 4 && (
                  <button
                    onClick={showAllActivities ? handleShowLess : handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 text-xs font-bold text-brand-purple hover:text-brand-purple-light hover:bg-white/5 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {showAllActivities ? (
                          <>
                            {t('common.showLess')} <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            {t('common.loadMore')} <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-white/40">{t('pages.admin.noRecentActivity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
