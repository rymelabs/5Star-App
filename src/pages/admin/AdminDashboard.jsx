import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFootball } from '../../context/FootballContext';
import { useNews } from '../../context/NewsContext';
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
  Instagram
} from 'lucide-react';
import AdminTeams from './AdminTeams';
import AdminFixtures from './AdminFixtures';
import AdminNews from './AdminNews';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, fixtures, leagueTable } = useFootball();
  const { articles } = useNews();
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch recent activities
  useEffect(() => {
    // Only fetch activities if user is admin
    if (!user || user.role !== 'admin') return;

    const unsubscribe = adminActivityCollection.onSnapshot(10, (activities) => {
      setRecentActivities(activities);
    });

    return () => unsubscribe();
  }, [user]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Teams',
      value: teams.length,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/10',
    },
    {
      title: 'Active Fixtures',
      value: fixtures.filter(f => f.status !== 'completed').length,
      icon: Calendar,
      color: 'text-accent-400',
      bgColor: 'bg-accent-600/10',
    },
    {
      title: 'Published News',
      value: articles.length,
      icon: Newspaper,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/10',
    },
    {
      title: 'League Positions',
      value: leagueTable.length,
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/10',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Team',
      description: 'Create a new team profile',
      icon: Users,
      color: 'text-blue-400',
      onClick: () => navigate('/admin/teams'),
    },
    {
      title: 'Schedule Fixture',
      description: 'Add a new match fixture',
      icon: Calendar,
      color: 'text-accent-400',
      onClick: () => navigate('/admin/fixtures'),
    },
    {
      title: 'Write Article',
      description: 'Publish a news article',
      icon: Newspaper,
      color: 'text-purple-400',
      onClick: () => navigate('/admin/news'),
    },
    {
      title: 'New Season',
      description: 'Create a tournament season',
      icon: Trophy,
      color: 'text-primary-400',
      onClick: () => navigate('/admin/seasons/create'),
    },
  ];

  const managementSections = [
    {
      title: 'Seasons Management',
      description: 'Create and manage tournament seasons',
      icon: Trophy,
      path: '/admin/seasons',
      color: 'text-primary-400',
      count: '-',
    },
    {
      title: 'Teams Management',
      description: 'Manage team profiles, logos, and information',
      icon: Users,
      path: '/admin/teams',
      color: 'text-blue-400',
      count: teams.length,
    },
    {
      title: 'Fixtures Management',
      description: 'Schedule matches, update scores, and live events',
      icon: Calendar,
      path: '/admin/fixtures',
      color: 'text-accent-400',
      count: fixtures.length,
    },
    {
      title: 'News Management',
      description: 'Create, edit, and publish news articles',
      icon: Newspaper,
      path: '/admin/news',
      color: 'text-purple-400',
      count: articles.length,
    },
    {
      title: 'League Settings',
      description: 'Configure qualification and relegation positions',
      icon: Settings,
      path: '/admin/league-settings',
      color: 'text-yellow-400',
      count: '-',
    },
    {
      title: 'Instagram Settings',
      description: 'Configure Instagram feed and social media integration',
      icon: Instagram,
      path: '/admin/instagram',
      color: 'text-pink-400',
      count: '-',
    },
  ];

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="ml-2">
            <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Manage your sports app content</p>
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
              <h2 className="text-xl font-semibold text-white mb-1">
                Welcome back, {user.name}!
              </h2>
              <p className="text-gray-400">
                Here's what's happening with your sports app today.
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
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
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

        {/* Management Sections */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Content Management</h3>
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
                      <div className="text-xs text-gray-500">items</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
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
                if (activity.action === 'add') actionText = 'Added';
                else if (activity.action === 'update') actionText = 'Updated';
                else if (activity.action === 'delete') actionText = 'Deleted';
                else actionText = activity.action;

                // Format time ago
                const timeAgo = (date) => {
                  const seconds = Math.floor((new Date() - date) / 1000);
                  if (seconds < 60) return 'just now';
                  const minutes = Math.floor(seconds / 60);
                  if (minutes < 60) return `${minutes}m ago`;
                  const hours = Math.floor(minutes / 60);
                  if (hours < 24) return `${hours}h ago`;
                  const days = Math.floor(hours / 24);
                  if (days < 7) return `${days}d ago`;
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
                          {timeAgo(activity.createdAt)} • by {activity.userName}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card p-8 text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;