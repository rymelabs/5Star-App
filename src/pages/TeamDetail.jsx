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
import { formatDate } from '../utils/dateUtils';

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
    if (!user) {
      showError('Sign In Required', 'Please sign in to follow teams');
      navigate('/auth');
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

    const now = new Date();
    
    const recent = allTeamFixtures
      .filter(f => f.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const upcoming = allTeamFixtures
      .filter(f => f.status === 'scheduled' || f.status === 'upcoming')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
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
            className="text-primary-400 hover:text-primary-300"
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
    <div className="min-h-screen bg-dark-900 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-dark-800 to-dark-900 border-b border-dark-700">
        <div className="p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-3 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-start gap-6">
            {/* Team Logo */}
            <TeamAvatar name={team.name} logo={team.logo} size={80} className="p-2.5" />

            {/* Team Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-1.5">{team.name}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {team.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{team.city}</span>
                  </div>
                )}
                {team.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Founded {team.founded}</span>
                  </div>
                )}
                {team.stadium && (
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>{team.stadium}</span>
                  </div>
                )}
              </div>

              {team.manager && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{t('pages.teamDetail.manager')}:</span>
                  <span className="text-white font-medium">{team.manager}</span>
                </div>
              )}

              {/* Follow Button & Follower Count */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isFollowing
                      ? 'bg-dark-700 text-white hover:bg-dark-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
                
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-white font-semibold">{team.followerCount || 0}</span>
                  <span className="text-gray-400">{(team.followerCount || 0) !== 1 ? t('pages.teamDetail.followers') : t('pages.teamDetail.follower')}</span>
                </div>

                {isFollowing && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary-500/10 border border-primary-500/20 rounded-md text-xs text-primary-400">
                    <Bell className="w-3 h-3" />
                    <span className="text-[10px]">{t('pages.teamDetail.notificationsOn')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {team && (
              <div className="hidden md:flex">
                <div className="bg-dark-800/80 border border-dark-700 rounded-2xl p-4 min-w-[260px] shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">{t('pages.teamDetail.seasonStats')}</p>
                      <p className="text-2xl font-bold text-white">
                        {winDrawLoss.total}
                        <span className="text-sm font-normal text-gray-500 ml-1">{t('pages.teamDetail.played')}</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-primary-500/10 text-primary-300">
                      <Target className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[{
                      label: t('pages.teamDetail.wins'),
                      value: winDrawLoss.wins,
                      accent: 'text-green-400'
                    }, {
                      label: t('pages.teamDetail.draws'),
                      value: winDrawLoss.draws,
                      accent: 'text-yellow-400'
                    }, {
                      label: t('pages.teamDetail.losses'),
                      value: winDrawLoss.losses,
                      accent: 'text-red-400'
                    }].map((item) => (
                      <div key={item.label} className="text-center bg-dark-900/60 rounded-lg p-3 border border-dark-700">
                        <div className={`text-xl font-bold ${item.accent}`}>{item.value}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wide">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Team Description */}
            {team.description && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-3">{t('pages.teamDetail.about')}</h2>
                <p className="text-gray-400 leading-relaxed">{team.description}</p>
              </div>
            )}

            {/* Season Statistics */}
            {teamStats && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4">{t('pages.teamDetail.seasonStats')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-white">{teamStats.played}</div>
                    <div className="text-sm text-gray-400">{t('pages.teamDetail.played')}</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{teamStats.points}</div>
                    <div className="text-sm text-gray-400">{t('pages.teamDetail.points')}</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{teamStats.goalsFor}</div>
                    <div className="text-sm text-gray-400">Goals For</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{teamStats.goalsAgainst}</div>
                    <div className="text-sm text-gray-400">Goals Against</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className={`text-2xl font-bold ${teamStats.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {teamStats.goalDifference >= 0 ? '+' : ''}{teamStats.goalDifference}
                    </div>
                    <div className="text-sm text-gray-400">Goal Diff</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{teamStats.cleanSheets}</div>
                    <div className="text-sm text-gray-400">Clean Sheets</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{teamStats.won}</div>
                    <div className="text-sm text-gray-400">Won</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{teamStats.drawn}</div>
                    <div className="text-sm text-gray-400">Drawn</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Scorers */}
            {topScorers.length > 0 && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Top Scorers
                </h2>
                <div className="space-y-3">
                  {topScorers.map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => navigate(`/teams/${team.id}/players/${player.id}`)}
                      className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors w-full"
                    >
                      <span className="text-gray-400 font-semibold w-6">{index + 1}</span>
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.position || 'Player'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-400">{player.goals}</div>
                        <div className="text-xs text-gray-400">goals</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Form */}
            {teamFixtures.recent.length > 0 && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4">{t('pages.teamDetail.recentMatches')}</h2>
                <div className="space-y-3">
                  {teamFixtures.recent.map(fixture => {
                    const isHome = fixture.homeTeam?.id === team.id;
                    const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
                    const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;
                    const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
                    const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
                    const resultColor = result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-yellow-500';

                    return (
                      <div
                        key={fixture.id}
                        onClick={() => navigate(`/fixtures/${fixture.id}`)}
                        className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                      >
                        <div className={`w-8 h-8 ${resultColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {result}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-white font-medium">
                            {!isHome && opponent?.logo && (
                              <img src={opponent.logo} alt="" className="w-5 h-5" />
                            )}
                            <span>{isHome ? 'vs' : '@'} {opponent?.name || 'TBD'}</span>
                          </div>
                          <div className="text-sm text-gray-400">{fixture.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {teamScore} - {opponentScore}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {/* Upcoming Matches */}
            {teamFixtures.upcoming.length > 0 && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4">{t('pages.teamDetail.upcomingMatches')}</h2>
                <div className="space-y-3">
                  {teamFixtures.upcoming.map(fixture => {
                    const isHome = fixture.homeTeam?.id === team.id;
                    const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;

                    return (
                      <div
                        key={fixture.id}
                        onClick={() => navigate(`/fixtures/${fixture.id}`)}
                        className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-5 h-5 text-primary-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-white font-medium">
                            {opponent?.logo && (
                              <img src={opponent.logo} alt="" className="w-5 h-5" />
                            )}
                            <span>{isHome ? 'vs' : '@'} {opponent?.name || 'TBD'}</span>
                          </div>
                          <div className="text-sm text-gray-400">{fixture.competition}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">{fixture.date}</div>
                          <div className="text-xs text-gray-400">{fixture.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Results */}
            {teamFixtures.recent.length > 0 && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4">{t('pages.teamDetail.recentResults')}</h2>
                <div className="space-y-3">
                  {teamFixtures.recent.map(fixture => {
                    const isHome = fixture.homeTeam?.id === team.id;
                    const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
                    const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;
                    const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;

                    return (
                      <div
                        key={fixture.id}
                        onClick={() => navigate(`/fixtures/${fixture.id}`)}
                        className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                      >
                        {opponent?.logo && (
                          <img src={opponent.logo} alt="" className="w-10 h-10" />
                        )}
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {isHome ? 'vs' : '@'} {opponent?.name || 'TBD'}
                          </div>
                          <div className="text-sm text-gray-400">{fixture.competition} • {fixture.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">
                            {teamScore} - {opponentScore}
                          </div>
                        </div>
                      </div>
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
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4">{t('pages.teamDetail.players')}</h2>
                <div className="grid gap-3">
                  {team.players.map(player => (
                    <button
                      key={player.id}
                      onClick={() => navigate(`/teams/${team.id}/players/${player.id}`)}
                      className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors w-full text-left"
                    >
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">
                          {player.position || 'Player'}
                          {player.isGoalkeeper && ' • Goalkeeper'}
                        </div>
                      </div>
                      {player.nationality && (
                        <div className="text-sm text-gray-400">{player.nationality}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center">
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
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Top Scorers
                </h2>
                <div className="space-y-3">
                  {topScorers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg"
                    >
                      <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.position || 'Player'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{player.goals}</div>
                        <div className="text-xs text-gray-400">goals</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disciplinary */}
            {disciplinaryRecords.length > 0 && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Discipline
                </h2>
                <div className="space-y-3">
                  {disciplinaryRecords.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg"
                    >
                      <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.position || 'Player'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {player.yellowCards > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-5 bg-yellow-400 rounded-sm"></div>
                            <span className="text-white font-medium">{player.yellowCards}</span>
                          </div>
                        )}
                        {player.redCards > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-5 bg-red-500 rounded-sm"></div>
                            <span className="text-white font-medium">{player.redCards}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
                  <div
                    key={article.id}
                    onClick={() => navigate(`/news/${article.id}`)}
                    className="bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-primary-600 transition-all cursor-pointer"
                  >
                    <div className="flex gap-4 p-4">
                      {article.image && (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          {article.publishedAt ? formatDate(article.publishedAt?.toDate ? article.publishedAt.toDate() : article.publishedAt) : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center">
                <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t('pages.teamDetail.noNewsArticles')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
