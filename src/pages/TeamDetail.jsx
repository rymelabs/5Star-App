import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFootball } from '../context/FootballContext';
import { teamsCollection } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNews } from '../context/NewsContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  Target,
  AlertCircle,
  Newspaper,
  TrendingUp,
  User,
  UserPlus,
  UserMinus,
  Bell
} from 'lucide-react';
import TeamAvatar from '../components/TeamAvatar';
import AuthPromptModal from '../components/AuthPromptModal';
import useAuthGate from '../hooks/useAuthGate';
import { formatDate, formatTime } from '../utils/dateUtils';
import SurfaceCard from '../components/ui/SurfaceCard';
import BackButton from '../components/ui/BackButton';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, fixtures, followTeam, unfollowTeam } = useFootball();
  const { articles } = useNews();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { requireAuth, authPromptProps } = useAuthGate({
    title: 'Sign in to follow teams',
    message: 'Follow this club to get match reminders, breaking news, and synced preferences across your devices.',
    confirmText: 'Sign in to follow',
    cancelText: 'Maybe later'
  });

  // Find the team with fallbacks (id, teamId, name slug, numeric id) in-memory
  const inMemoryTeam = useMemo(() => {
    if (!teams || teams.length === 0) return undefined;
    // direct id match
    let found = teams.find(t => t.id === id);
    if (found) return found;

    // teamId field fallback
    found = teams.find(t => t.teamId === id || String(t.teamId) === id);
    if (found) return found;

    // numeric id fallback
    found = teams.find(t => String(t.id) === String(Number(id)));
    if (found) return found;

    // name slug fallback (name lowercased, spaces -> hyphens)
    const slug = String(id).toLowerCase().replace(/[-_\s]+/g, ' ').trim();
    found = teams.find(t => (t.name || '').toLowerCase().replace(/[-_\s]+/g, ' ').trim() === slug);
    if (found) return found;

    return undefined;
  }, [teams, id]);

  // If team isn't available in-memory, fetch from Firestore as a fallback
  const [remoteTeam, setRemoteTeam] = React.useState(null);
  useEffect(() => {
    let mounted = true;
    const fetchTeam = async () => {
      if (inMemoryTeam) {
        setRemoteTeam(null);
        return;
      }

      try {
        const fetched = await teamsCollection.getById(id);
        if (mounted) {
          if (!fetched) {
            console.warn('TeamDetail: teamsCollection.getById returned null for id:', id);
            setRemoteTeam(null);
          } else {
            // normalize id to doc id
            setRemoteTeam({ ...fetched, id: fetched.id });
          }
        }
      } catch (err) {
        console.error('TeamDetail: error fetching team by id fallback:', err);
        setRemoteTeam(null);
      }
    };

    fetchTeam();
    return () => { mounted = false; };
  }, [inMemoryTeam, id]);

  const team = inMemoryTeam || remoteTeam;

  // Check if user is following this team
  useEffect(() => {
    if (team && user) {
      const followers = team.followers || [];
      setIsFollowing(followers.includes(user.uid));
    }
  }, [team, user]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!requireAuth()) {
      return;
    }

    if (!user) {
      showError('Please try again', 'Your account is still loading. Please retry in a moment.');
      return;
    }

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await unfollowTeam(team.id);
        setIsFollowing(false);
        showSuccess('Unfollowed', `You unfollowed ${team.name}`);
      } else {
        await followTeam(team.id);
        setIsFollowing(true);
        showSuccess('Following', `You're now following ${team.name}! You'll receive notifications about their matches and news.`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showError('Error', error.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Get team fixtures
  const teamFixtures = useMemo(() => {
    if (!team) return { recent: [], upcoming: [] };

    const allTeamFixtures = fixtures.filter(fixture => 
      fixture.homeTeam?.id === team.id || fixture.awayTeam?.id === team.id
    );

    const recent = allTeamFixtures
      .filter(f => f.status === 'completed')
      .sort((a, b) => new Date(b.dateTime || b.date) - new Date(a.dateTime || a.date))
      .slice(0, 5);

    const upcoming = allTeamFixtures
      .filter(f => f.status === 'scheduled' || f.status === 'upcoming')
      .sort((a, b) => new Date(a.dateTime || a.date) - new Date(b.dateTime || b.date))
      .slice(0, 5);

    return { recent, upcoming };
  }, [team, fixtures]);

  // Get team statistics from fixtures
  const teamStats = useMemo(() => {
    if (!team) return null;

    const completedFixtures = fixtures.filter(fixture => {
      if (fixture.status !== 'completed') return false;
      return fixture.homeTeam?.id === team.id || fixture.awayTeam?.id === team.id;
    });

    let played = completedFixtures.length;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;

    completedFixtures.forEach(fixture => {
      const isHome = fixture.homeTeam?.id === team.id;
      const teamScore = isHome ? parseInt(fixture.homeScore) || 0 : parseInt(fixture.awayScore) || 0;
      const opponentScore = isHome ? parseInt(fixture.awayScore) || 0 : parseInt(fixture.homeScore) || 0;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (opponentScore === 0) cleanSheets++;

      if (teamScore > opponentScore) won++;
      else if (teamScore < opponentScore) lost++;
      else drawn++;
    });

    const points = (won * 3) + drawn;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      cleanSheets,
      points
    };
  }, [team, fixtures]);

  const winDrawLoss = useMemo(() => {
    const source = team?.stats || {};
    const wins = Number(source.wins ?? source.won ?? teamStats?.won ?? 0) || 0;
    const draws = Number(source.draws ?? source.drawn ?? teamStats?.drawn ?? 0) || 0;
    const losses = Number(source.losses ?? source.lost ?? teamStats?.lost ?? 0) || 0;

    return {
      wins,
      draws,
      losses,
      total: wins + draws + losses
    };
  }, [team, teamStats]);

  // Get top scorers from this team
  const topScorers = useMemo(() => {
    if (!team || !team.players) return [];

    const scorerMap = new Map();

    fixtures.forEach(fixture => {
      if (!fixture.events || fixture.status !== 'completed') return;

      fixture.events.forEach(event => {
        if (event.type === 'goal') {
          const isTeamHome = fixture.homeTeam?.id === team.id;
          const isTeamAway = fixture.awayTeam?.id === team.id;

          if ((isTeamHome && event.team === fixture.homeTeam?.id) ||
              (isTeamAway && event.team === fixture.awayTeam?.id)) {
            
            const player = team.players.find(p => p.id === event.playerId);
            if (player) {
              const key = player.id;
              if (!scorerMap.has(key)) {
                scorerMap.set(key, {
                  ...player,
                  goals: 0
                });
              }
              scorerMap.get(key).goals++;
            }
          }
        }
      });
    });

    return Array.from(scorerMap.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [team, fixtures]);

  // Get disciplinary records for this team
  const disciplinaryRecords = useMemo(() => {
    if (!team || !team.players) return [];

    const cardMap = new Map();

    fixtures.forEach(fixture => {
      if (!fixture.events || fixture.status !== 'completed') return;

      fixture.events.forEach(event => {
        if (event.type === 'yellow_card' || event.type === 'red_card') {
          const isTeamHome = fixture.homeTeam?.id === team.id;
          const isTeamAway = fixture.awayTeam?.id === team.id;

          if ((isTeamHome && event.team === fixture.homeTeam?.id) ||
              (isTeamAway && event.team === fixture.awayTeam?.id)) {
            
            const player = team.players.find(p => p.id === event.playerId);
            if (player) {
              const key = player.id;
              if (!cardMap.has(key)) {
                cardMap.set(key, {
                  ...player,
                  yellowCards: 0,
                  redCards: 0
                });
              }
              if (event.type === 'yellow_card') {
                cardMap.get(key).yellowCards++;
              } else {
                cardMap.get(key).redCards++;
              }
            }
          }
        }
      });
    });

    return Array.from(cardMap.values())
      .sort((a, b) => (b.redCards * 3 + b.yellowCards) - (a.redCards * 3 + a.yellowCards))
      .slice(0, 5);
  }, [team, fixtures]);

  // Get related news articles
  const relatedNews = useMemo(() => {
    if (!team) return [];

    const teamName = team.name.toLowerCase();
    const managerName = team.manager?.toLowerCase() || '';
    const playerNames = (team.players || []).map(p => p.name.toLowerCase());

    return articles.filter(article => {
      const title = article.title?.toLowerCase() || '';
      const content = article.content?.toLowerCase() || '';
      const excerpt = article.excerpt?.toLowerCase() || '';
      const searchText = `${title} ${content} ${excerpt}`;

      // Check if team name, manager name, or any player name appears in the article
      if (searchText.includes(teamName)) return true;
      if (managerName && searchText.includes(managerName)) return true;
      return playerNames.some(name => searchText.includes(name));
    }).slice(0, 6);
  }, [team, articles]);

  if (!team) {
    return (
      <div className="min-h-screen bg-dark-900 p-6">
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">{t('pages.teamDetail.teamNotFound')}</h2>
          <p className="text-gray-400 mb-6">{t('pages.teamDetail.teamNotFoundMessage')}</p>
          <button
            onClick={() => navigate('/')}
            className="text-brand-purple hover:text-brand-purple/80"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'squad', label: 'Squad', icon: Users },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'news', label: 'News', icon: Newspaper }
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative overflow-hidden bg-elevated border-b border-white/5 rounded-3xl">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/10 to-transparent opacity-50" />
        
        <div className="relative px-4 sm:px-6 py-6 sm:py-8">
          <BackButton className="mb-6" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Team Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-brand-purple/20 blur-2xl rounded-full" />
              <TeamAvatar name={team.name} logo={team.logo} size={80} className="relative z-10 ring-4 ring-dark-900 shadow-2xl" />
            </div>

            {/* Team Info */}
            <div className="flex-1 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="page-header mb-2">{team.name}</h1>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-400">
                    {team.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{team.city}</span>
                      </div>
                    )}
                    {team.founded && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Founded {team.founded}</span>
                      </div>
                    )}
                    {team.stadium && (
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-gray-500" />
                        <span>{team.stadium}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow Button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`
                    flex items-center justify-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 w-full sm:w-auto
                    ${isFollowing
                      ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                      : 'bg-brand-purple text-white hover:bg-brand-purple/90 shadow-[0_0_20px_rgba(109,40,217,0.4)] hover:shadow-[0_0_25px_rgba(109,40,217,0.6)]'
                    }
                  `}
                >
                  {followLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Follow Team</span>
                    </>
                  )}
                </button>
              </div>

              {team.manager && (
                <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm bg-white/5 self-start inline-flex px-2.5 py-1 rounded-lg border border-white/5">
                  <User className="w-3.5 h-3.5 text-brand-purple" />
                  <span className="text-gray-400">{t('pages.teamDetail.manager')}:</span>
                  <span className="text-white font-bold">{team.manager}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto px-4 sm:px-6 gap-4 scrollbar-hide border-t border-white/5 bg-black/20 backdrop-blur-sm">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap
                  ${isActive 
                    ? 'border-brand-purple text-white' 
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }
                `}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-purple' : 'text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-0 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 sm:px-0">
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center gap-0.5 border-white/5 bg-elevated/50 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Matches</span>
                  <span className="text-xl font-bold text-white">{teamStats?.played || 0}</span>
                </SurfaceCard>
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center gap-0.5 border-white/5 bg-elevated/50 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Won</span>
                  <span className="text-xl font-bold text-green-400">{teamStats?.won || 0}</span>
                </SurfaceCard>
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center gap-0.5 border-white/5 bg-elevated/50 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Goals</span>
                  <span className="text-xl font-bold text-brand-purple">{teamStats?.goalsFor || 0}</span>
                </SurfaceCard>
                <SurfaceCard className="p-3 flex flex-col items-center justify-center text-center gap-0.5 border-white/5 bg-elevated/50 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Points</span>
                  <span className="text-xl font-bold text-white">{teamStats?.points || 0}</span>
                </SurfaceCard>
              </div>

              {/* Recent Form */}
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-purple" />
                  Recent Form
                </h3>
                <div className="flex items-center gap-1.5">
                  {teamFixtures.recent.map((fixture) => {
                    const isHome = fixture.homeTeam?.id === team.id;
                    const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
                    const oppScore = isHome ? fixture.awayScore : fixture.homeScore;
                    const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
                    const colorClass = result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-gray-500';
                    
                    return (
                      <div 
                        key={fixture.id}
                        className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-dark-900`}
                        title={`${result} vs ${isHome ? fixture.awayTeam?.name : fixture.homeTeam?.name}`}
                      >
                        {result}
                      </div>
                    );
                  })}
                  {teamFixtures.recent.length === 0 && (
                    <span className="text-gray-500 text-sm italic">No recent matches played</span>
                  )}
                </div>
              </div>

              {/* Upcoming Matches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 sm:px-0">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-purple" />
                    Upcoming Matches
                  </h3>
                  <button 
                    onClick={() => setActiveTab('fixtures')}
                    className="text-sm text-brand-purple hover:text-brand-purple/80 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3 px-0 sm:px-0">
                  {teamFixtures.upcoming.length > 0 ? (
                    teamFixtures.upcoming.map(fixture => (
                      <SurfaceCard 
                        key={fixture.id}
                        className="p-3 flex items-center justify-between group hover:bg-white/[0.04] transition-colors border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl"
                        onClick={() => navigate(`/fixtures/${fixture.id}`)}
                        interactive
                      >
                        <div className="flex flex-col items-center w-10">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(fixture.dateTime || fixture.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-bold text-white">{new Date(fixture.dateTime || fixture.date).getDate()}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex-1 ml-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm font-semibold text-white group-hover:text-brand-purple transition-colors">
                              {fixture.homeTeam?.id === team.id ? fixture.awayTeam?.name : fixture.homeTeam?.name}
                            </span>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                              {fixture.homeTeam?.id === team.id ? 'Home' : 'Away'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {fixture.venue || 'TBD'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-mono font-medium text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            {formatTime(fixture.dateTime || fixture.date)}
                          </span>
                        </div>
                      </SurfaceCard>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-white/[0.02] rounded-xl border border-white/5 mx-4 sm:mx-0">
                      No upcoming matches scheduled
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Top Scorers & News */}
            <div className="space-y-6">
              {/* Top Scorers */}
              <SurfaceCard className="p-0 overflow-hidden border-white/5 mx-4 sm:mx-0 rounded-2xl">
                <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-purple" />
                    Top Scorers
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {topScorers.length > 0 ? (
                    topScorers.map((scorer, idx) => (
                      <div key={scorer.id} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`
                            w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold
                            ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                              idx === 1 ? 'bg-gray-400/20 text-gray-400' : 
                              idx === 2 ? 'bg-orange-500/20 text-orange-500' : 'text-gray-600'}
                          `}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{scorer.name}</p>
                            <p className="text-xs text-gray-500">{scorer.position || 'Player'}</p>
                          </div>
                        </div>
                        <span className="text-base font-bold text-brand-purple">{scorer.goals}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No goals recorded yet
                    </div>
                  )}
                </div>
              </SurfaceCard>

              {/* Latest News */}
              {relatedNews.length > 0 && (
                <div className="space-y-4 px-4 sm:px-0">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-brand-purple" />
                    Latest News
                  </h3>
                  <div className="space-y-2.5">
                    {relatedNews.map(article => (
                      <SurfaceCard 
                        key={article.id}
                        className="p-2.5 flex gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer border-white/5 rounded-2xl"
                        onClick={() => navigate(`/news/${article.id}`)}
                      >
                        {article.image && (
                          <img 
                            src={article.image} 
                            alt={article.title} 
                            className="w-16 h-16 object-cover rounded-lg bg-dark-800"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white line-clamp-2 mb-0.5 group-hover:text-brand-purple transition-colors">
                            {article.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatDate(article.publishedAt)}
                          </span>
                        </div>
                      </SurfaceCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {/* Upcoming Matches */}
            {teamFixtures.upcoming.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white px-4 sm:px-0 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-purple" />
                  {t('pages.teamDetail.upcomingMatches')}
                </h2>
                <div className="space-y-3">
                  {teamFixtures.upcoming.map(fixture => {
                    const isHome = fixture.homeTeam?.id === team.id;
                    const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;

                    return (
                      <SurfaceCard
                        key={fixture.id}
                        onClick={() => navigate(`/fixtures/${fixture.id}`)}
                        className="flex items-center gap-3 p-3 hover:bg-white/[0.04] transition-colors cursor-pointer border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl"
                        interactive
                      >
                        <div className="flex flex-col items-center w-10">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(fixture.dateTime || fixture.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-bold text-white">{new Date(fixture.dateTime || fixture.date).getDate()}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex-1 ml-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm font-semibold text-white group-hover:text-brand-purple transition-colors">
                              {opponent?.name || 'TBD'}
                            </span>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                              {isHome ? 'Home' : 'Away'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {fixture.venue || 'TBD'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-mono font-medium text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            {formatTime(fixture.dateTime || fixture.date)}
                          </span>
                        </div>
                      </SurfaceCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Results */}
            {teamFixtures.recent.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white px-4 sm:px-0 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-purple" />
                  {t('pages.teamDetail.recentResults')}
                </h2>
                <div className="space-y-3">
                  {teamFixtures.recent.map(fixture => {
                    const isHome = fixture.homeTeam?.id === team.id;
                    const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
                    const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;
                    const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
                    const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
                    const resultColor = result === 'W' ? 'text-green-400' : result === 'L' ? 'text-red-400' : 'text-gray-400';

                    return (
                      <SurfaceCard
                        key={fixture.id}
                        onClick={() => navigate(`/fixtures/${fixture.id}`)}
                        className="flex items-center gap-3 p-3 hover:bg-white/[0.04] transition-colors cursor-pointer border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl"
                        interactive
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base bg-white/5 ${resultColor}`}>
                          {result}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
                            {opponent?.logo && (
                              <img src={opponent.logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <span>{isHome ? 'vs' : '@'} {opponent?.name || 'TBD'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{fixture.competition} • {fixture.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white font-mono tracking-tight">
                            {teamScore} - {opponentScore}
                          </div>
                        </div>
                      </SurfaceCard>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Squad Tab */}
        {activeTab === 'squad' && (
          <div className="space-y-6">
            {team.players && team.players.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white px-4 sm:px-0 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-purple" />
                  {t('pages.teamDetail.players')}
                </h2>
                <div className="grid gap-2.5">
                  {team.players.map(player => (
                    <SurfaceCard
                      key={player.id}
                      onClick={() => navigate(`/teams/${team.id}/players/${player.id}`)}
                      className="flex items-center gap-3 p-3 hover:bg-white/[0.04] transition-colors w-full text-left border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl group"
                      interactive
                    >
                      <div className="w-10 h-10 bg-brand-purple/10 rounded-full flex items-center justify-center text-brand-purple font-semibold group-hover:bg-brand-purple group-hover:text-white transition-colors">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-base group-hover:text-brand-purple transition-colors">{player.name}</div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {player.position || 'Player'}
                          {player.isGoalkeeper && ' • Goalkeeper'}
                        </div>
                      </div>
                      {player.nationality && (
                        <div className="text-xs font-medium text-gray-500 bg-white/5 px-2.5 py-0.5 rounded-full">
                          {player.nationality}
                        </div>
                      )}
                    </SurfaceCard>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] rounded-xl p-12 border border-white/5 text-center mx-4 sm:mx-0">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t('pages.teamDetail.noPlayersRegistered')}</p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Top Scorers */}
            {topScorers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white px-4 sm:px-0 flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-purple" />
                  Top Scorers
                </h2>
                <div className="space-y-3">
                  {topScorers.map((player, index) => (
                    <SurfaceCard
                      key={player.id}
                      className="flex items-center gap-4 p-4 border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl"
                    >
                      <span className="text-lg font-bold text-gray-500 w-8 text-center">{index + 1}</span>
                      <div className="w-10 h-10 bg-brand-purple/10 rounded-full flex items-center justify-center text-brand-purple font-bold">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.position || 'Player'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-brand-purple">{player.goals}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">goals</div>
                      </div>
                    </SurfaceCard>
                  ))}
                </div>
              </div>
            )}

            {/* Disciplinary */}
            {disciplinaryRecords.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white px-4 sm:px-0 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Discipline
                </h2>
                <div className="space-y-3">
                  {disciplinaryRecords.map((player, index) => (
                    <SurfaceCard
                      key={player.id}
                      className="flex items-center gap-4 p-4 border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl"
                    >
                      <span className="text-lg font-bold text-gray-500 w-8 text-center">{index + 1}</span>
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white font-bold">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.position || 'Player'}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {player.yellowCards > 0 && (
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-8 bg-yellow-400 rounded shadow-lg mb-1"></div>
                            <span className="text-white font-bold">{player.yellowCards}</span>
                          </div>
                        )}
                        {player.redCards > 0 && (
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-8 bg-red-500 rounded shadow-lg mb-1"></div>
                            <span className="text-white font-bold">{player.redCards}</span>
                          </div>
                        )}
                      </div>
                    </SurfaceCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            {relatedNews.length > 0 ? (
              <div className="grid gap-4">
                {relatedNews.map(article => (
                  <SurfaceCard
                    key={article.id}
                    onClick={() => navigate(`/news/${article.id}`)}
                    className="flex gap-4 p-4 hover:bg-white/[0.04] transition-colors cursor-pointer border-x-0 sm:border-x border-white/5 rounded-none sm:rounded-xl group"
                    interactive
                  >
                    {article.image && (
                      <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-brand-purple transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 font-medium">
                        {article.publishedAt ? formatDate(article.publishedAt?.toDate ? article.publishedAt.toDate() : article.publishedAt) : ''}
                      </div>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] rounded-xl p-12 border border-white/5 text-center mx-4 sm:mx-0">
                <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t('pages.teamDetail.noNewsArticles')}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <AuthPromptModal
          {...authPromptProps}
          benefits={[
            'Receive alerts before this team kicks off',
            'Unlock calendar reminders and news notifications',
            'Sync followed clubs anywhere you sign in'
          ]}
        />
    </div>
  );
};

export default TeamDetail;
