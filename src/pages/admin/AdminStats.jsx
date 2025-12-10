import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { RefreshCw, BellRing, MessageCircle, Users, Activity } from 'lucide-react';
import { teamsCollection, usersCollection, adminActivityCollection, newsCollection } from '../../firebase/firestore';
import { analyticsService } from '../../firebase/analytics';
import { useLanguage } from '../../context/LanguageContext';
import AdminPageLayout from '../../components/AdminPageLayout';

const AdminStats = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [viewsData, setViewsData] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [notificationsEnabledCount, setNotificationsEnabledCount] = useState(0);
  const [teamFollowers, setTeamFollowers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const mountedRef = useRef(true);

  const isPermissionError = (error) => error?.code === 'permission-denied';

  const loadStats = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setErrorMessage(null);

    const loadFromAnalytics = async () => {
      const recent = await analyticsService.listRecentDaily(30);
      if (!recent || recent.length === 0 || !mountedRef.current) return false;
      const views = recent.map(r => ({ date: r.date, views: r.views || 0 })).reverse();
      const latest = recent[0];
      setViewsData(views.length ? views : [{ date: new Date().toISOString().slice(0, 10), views: 0 }]);
      setNotificationsEnabledCount(latest.notificationsEnabled || 0);
      setTeamFollowers((latest.topTeams || []).map(t => ({ name: t.name, followers: t.followers || 0 })));
      setCommentsCount(latest.totalComments || 0);
      return true;
    };

    const loadFromCollections = async () => {
      const activities = await adminActivityCollection.getRecent?.(100) || [];
      const buckets = {};
      activities.forEach(a => {
        const d = new Date(a.createdAt?.toDate?.() || a.createdAt || Date.now());
        const key = d.toISOString().slice(0, 10);
        buckets[key] = (buckets[key] || 0) + (a.views || 0) + (a.type === 'news' && a.action === 'view' ? 1 : 0);
      });
      const views = Object.keys(buckets).sort().map(k => ({ date: k, views: buckets[k] }));

      let notifCount = 0;
      try {
        const users = await (usersCollection.getAll ? usersCollection.getAll() : []);
        notifCount = users.filter(u => u?.settings?.notifications?.teamFollowing || u?.notifications?.teamFollowing).length;
      } catch (error) {
      }

      let teams = [];
      try {
        teams = await (teamsCollection.getAll?.() || []);
      } catch (error) {
      }

      let comments = 0;
      try {
        const articles = await (newsCollection.getAll?.() || []);
        comments = articles.reduce((sum, article) => sum + (article.commentsCount || 0), 0);
      } catch (error) {
      }

      if (!mountedRef.current) return;
      setViewsData(views.length ? views : [{ date: new Date().toISOString().slice(0, 10), views: 0 }]);
      setNotificationsEnabledCount(notifCount);
      setTeamFollowers(teams.map(t => ({ name: t.name, followers: t.followerCount || (t.followers?.length) || 0 })).slice(0, 10));
      setCommentsCount(comments);
    };

    try {
      const analyticsLoaded = await loadFromAnalytics();
      if (!analyticsLoaded) {
        await loadFromCollections();
      }
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(
          isPermissionError(error)
            ? 'Analytics data is unavailable for your account. Showing limited stats.'
            : error?.message || 'Unable to load analytics right now.'
        );
        setViewsData([]);
        setTeamFollowers([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadStats();
    return () => {
      mountedRef.current = false;
    };
  }, [loadStats]);

  return (
    <AdminPageLayout
      title={t('pages.admin.fullStats') || 'Full Stats'}
      subtitle="INTELLIGENCE"
      description={t('pages.admin.fullStatsDesc') || 'Site engagement, growth, and team interest all in one place.'}
      onBack={() => navigate('/admin')}
      actions={[]}
      stats={[]}
    >
      {loading ? (
        <div className="card p-4 text-sm text-white/70">{t('common.loading') || 'Loading data...'}</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase text-white/50">Analytics snapshot</p>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/15 text-[10px] uppercase text-white/70 hover:text-white hover:border-white/40 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{loading ? (t('common.loading') || 'Loading') : 'Refresh'}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="card border border-yellow-500/30 bg-yellow-500/10 text-yellow-100 p-2 text-[10px] leading-tight">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 mb-2.5">
            <div className="card p-1.5 overflow-hidden">
              <p className="text-[7px] uppercase text-white/45 truncate">Notifications</p>
              <p className="text-sm font-semibold text-white">{notificationsEnabledCount}</p>
              <p className="text-[8px] text-white/60 truncate">Team followers</p>
            </div>
            <div className="card p-1.5 overflow-hidden">
              <p className="text-[7px] uppercase text-white/45 truncate">Comments</p>
              <p className="text-sm font-semibold text-white">{commentsCount}</p>
              <p className="text-[8px] text-white/60 truncate">News threads</p>
            </div>
            <div className="card p-1.5 overflow-hidden">
              <p className="text-[7px] uppercase text-white/45 truncate">Tracked Teams</p>
              <p className="text-sm font-semibold text-white">{teamFollowers.length}</p>
              <p className="text-[8px] text-white/60 truncate">with followers</p>
            </div>
            <div className="card p-1.5 overflow-hidden">
              <p className="text-[7px] uppercase text-white/45 truncate">Data Points</p>
              <p className="text-sm font-semibold text-white">{viewsData.length}</p>
              <p className="text-[8px] text-white/60 truncate">Days tracked</p>
            </div>
          </div>

          <div className="card p-1.5 mb-2.5 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] uppercase text-white/60 truncate">{t('pages.admin.viewsOverTime') || 'Views over time'}</p>
              <span className="text-[8px] text-white/40 whitespace-nowrap">Last {viewsData.length} days</span>
            </div>
            <div style={{ width: '100%', height: 170 }}>
              <ResponsiveContainer>
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 8 }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 8 }} />
                  <Tooltip cursor={{ stroke: '#475569' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#fff', fontSize: 8 }} />
                  <Line type="monotone" dataKey="views" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-1.5 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] uppercase text-white/60 truncate">Top teams by followers</p>
              <span className="text-[8px] text-white/40 whitespace-nowrap">Top {teamFollowers.length || 0}</span>
            </div>
            <div style={{ width: '100%', height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={teamFollowers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 8 }} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 8 }} width={85} />
                  <Tooltip cursor={{ fill: 'rgba(15,23,42,0.6)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: '#fff' }} />
                  <Bar dataKey="followers" fill="#34d399" radius={[2, 2, 2, 2]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </AdminPageLayout>
  );
};

export default AdminStats;
