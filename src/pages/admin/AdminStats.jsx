import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { X, ArrowLeft } from 'lucide-react';
import { teamsCollection, usersCollection, adminActivityCollection, newsCollection } from '../../firebase/firestore';
import { analyticsService } from '../../firebase/analytics';
import { useLanguage } from '../../context/LanguageContext';

const AdminStats = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [viewsData, setViewsData] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [notificationsEnabledCount, setNotificationsEnabledCount] = useState(0);
  const [teamFollowers, setTeamFollowers] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // First try reading pre-aggregated daily analytics
        const recent = await analyticsService.listRecentDaily(30);
        if (recent && recent.length) {
          // Map aggregated docs into viewsData and metrics
          const views = recent.map(r => ({ date: r.date, views: r.views || 0 })).reverse();
          const latest = recent[0];
          if (!mounted) return;
          setViewsData(views.length ? views : [ { date: new Date().toISOString().slice(0,10), views: 0 } ]);
          setNotificationsEnabledCount(latest.notificationsEnabled || 0);
          setTeamFollowers((latest.topTeams || []).map(t => ({ name: t.name, followers: t.followers || 0 })));
          setCommentsCount(latest.totalComments || 0);
          return;
        }

        // Fallback: compute client-side if no aggregated docs exist
        const activities = await adminActivityCollection.getRecent?.(100) || [];
        const buckets = {};
        activities.forEach(a => {
          const d = new Date(a.createdAt?.toDate?.() || a.createdAt || Date.now());
          const key = d.toISOString().slice(0,10);
          buckets[key] = (buckets[key] || 0) + (a.views || 0) + (a.type === 'news' && a.action === 'view' ? 1 : 0);
        });
        const views = Object.keys(buckets).sort().map(k => ({ date: k, views: buckets[k] }));

        let notifCount = 0;
        try {
          const users = await (usersCollection.getAll ? usersCollection.getAll() : []);
          notifCount = users.filter(u => u?.settings?.notifications?.teamFollowing || u?.notifications?.teamFollowing).length;
        } catch (e) { console.warn('users fetch failed', e); }

        let teams = [];
        try { teams = await teamsCollection.getAll?.() || []; } catch (e) { console.warn('teams fetch failed', e); }

        let comments = 0;
        try {
          const articles = await newsCollection.getAll?.() || [];
          comments = articles.reduce((s, a) => s + (a.commentsCount || 0), 0);
        } catch (e) { console.warn('articles fetch failed', e); }

        if (!mounted) return;
        setViewsData(views.length ? views : [ { date: new Date().toISOString().slice(0,10), views: 0 } ]);
        setNotificationsEnabledCount(notifCount);
        setTeamFollowers(teams.map(t => ({ name: t.name, followers: t.followerCount || (t.followers && t.followers.length) || 0 })).slice(0,10));
        setCommentsCount(comments);
      } catch (err) {
        console.error('Error loading stats page', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="pb-6">
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="ml-2">
            <h1 className="admin-header">{t('pages.admin.fullStats') || 'Full Stats'}</h1>
            <p className="text-sm text-gray-400">{t('pages.admin.fullStatsDesc') || 'Site engagement and analytics'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="card p-6">{t('common.loading')}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-sm text-gray-400">{t('pages.admin.notificationsManagement')}</div>
                <div className="text-2xl font-bold text-white">{notificationsEnabledCount}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-400">{t('pages.admin.totalComments') || 'Total comments'}</div>
                <div className="text-2xl font-bold text-white">{commentsCount}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-400">Top tracked teams</div>
                <div className="text-2xl font-bold text-white">{teamFollowers.length}</div>
              </div>
            </div>

            <div className="card p-4 mb-6">
              <div className="text-sm text-gray-400 mb-2">{t('pages.admin.viewsOverTime') || 'Views over time'}</div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#60a5fa" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-sm text-gray-400 mb-2">Top teams by followers</div>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={teamFollowers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="followers" fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
