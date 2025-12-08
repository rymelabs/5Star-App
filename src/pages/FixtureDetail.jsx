import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle, Heart, User, Shield, Target, Bell, BellOff, Info, ChevronRight, Clock } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { fixturesCollection } from '../firebase/firestore';
import { isFixtureLive } from '../utils/helpers';
import { addFixtureToCalendar } from '../utils/calendar';
import NewTeamAvatar from '../components/NewTeamAvatar';

const FixtureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fixtures } = useFootball();
  const { getCommentsForItem, addComment, subscribeToComments, comments } = useNews();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const [fixture, setFixture] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [hasCalendarReminder, setHasCalendarReminder] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [lineupView, setLineupView] = useState('pitch');
  const [scrolled, setScrolled] = useState(false);
  const [userPrediction, setUserPrediction] = useState(null);
  const [predictions, setPredictions] = useState({ home: 0, draw: 0, away: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const foundFixture = fixtures.find(f => f.id === id);
    setFixture(foundFixture);
    
    if (foundFixture) {
      setLikes(foundFixture.likes || 0);
      setIsLiked(foundFixture.likedBy?.includes(user?.uid) || false);
      
      // Load predictions
      const fixtureVotes = foundFixture.predictions || { home: 0, draw: 0, away: 0 };
      setPredictions(fixtureVotes);
      setUserPrediction(foundFixture.userPredictions?.[user?.uid] || null);
      
      const savedReminders = localStorage.getItem('calendarReminders');
      if (savedReminders) {
        try {
          const reminders = JSON.parse(savedReminders);
          setHasCalendarReminder(reminders.includes(id));
        } catch (error) {
          console.error('Error parsing calendar reminders:', error);
        }
      }
    }
  }, [id, fixtures, user]);

  useEffect(() => {
    if (id) {
      getCommentsForItem('fixture', id);
      const unsubscribe = subscribeToComments('fixture', id);
      return () => unsubscribe();
    }
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsCommenting(true);
      await addComment('fixture', id, {
        content: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous'
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handlePrediction = async (prediction) => {
    if (!user) {
      showError('Please sign in to make predictions');
      return;
    }

    try {
      const previousPrediction = userPrediction;
      setUserPrediction(prediction);

      // Optimistic update
      setPredictions(prev => {
        const updated = { ...prev };
        if (previousPrediction) updated[previousPrediction]--;
        updated[prediction]++;
        return updated;
      });

      await fixturesCollection.updatePrediction(id, user.uid, prediction);
      showSuccess(`You predicted: ${prediction === 'home' ? fixture.homeTeam?.name : prediction === 'away' ? fixture.awayTeam?.name : 'Draw'}`);
    } catch (error) {
      console.error('Error saving prediction:', error);
      showError('Failed to save prediction');
      setUserPrediction(userPrediction);
    }
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousLikes = likes;
    
    try {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      const result = await fixturesCollection.toggleLike(id, user.uid);
      setLikes(result.likes);
      setIsLiked(result.isLiked);
    } catch (error) {
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      console.error('Error liking fixture:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!fixture) return;
    
    try {
      const success = await addFixtureToCalendar(fixture);
      
      if (success) {
        const savedReminders = localStorage.getItem('calendarReminders');
        let reminders = [];
        if (savedReminders) {
          try {
            reminders = JSON.parse(savedReminders);
          } catch (error) {
            console.error('Error parsing calendar reminders:', error);
          }
        }
        if (!reminders.includes(id)) {
          reminders.push(id);
          localStorage.setItem('calendarReminders', JSON.stringify(reminders));
          setHasCalendarReminder(true);
        }
        showSuccess(t('pages.fixtureDetail.addedToCalendar'), t('pages.fixtureDetail.addedToCalendarDesc'));
      } else {
        showError(t('pages.fixtureDetail.failedToAdd'), t('pages.fixtureDetail.failedToAddDesc'));
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      showError(t('common.error'), t('pages.fixtureDetail.calendarError'));
    }
  };

  useEffect(() => {
    console.log('FixtureDetail: Redesign Loaded', { id, fixture });
  }, [id, fixture]);

  if (!fixture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
          <p className="text-xs text-gray-600 mt-2">v2.0 Redesign</p>
        </div>
      </div>
    );
  }

  const fixtureComments = comments[`fixture_${id}`] || [];
  const isLiveMatch = isFixtureLive(fixture);
  const isCompleted = fixture.status === 'completed';
  const showPenalties = isCompleted && fixture.penaltyHomeScore !== undefined && fixture.penaltyHomeScore !== null && fixture.penaltyAwayScore !== undefined && fixture.penaltyAwayScore !== null;

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-2.5 px-3 text-[11px] font-medium transition-all relative ${
        activeTab === id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      {activeTab === id && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-accent-green shadow-[0_0_14px_rgba(109,40,217,0.45)]" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative pt-8 pb-8 overflow-hidden rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/15 via-app/60 to-app pointer-events-none rounded-t-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-brand-purple/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative w-full px-4 sm:px-8">
          {/* Back Button and Actions */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleAddToCalendar}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
                  hasCalendarReminder
                    ? 'bg-brand-purple text-white shadow-[0_0_18px_rgba(109,40,217,0.45)]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {hasCalendarReminder ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLike}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
                  isLiked
                    ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-8">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md border ${
              isLiveMatch 
                ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : isCompleted 
                  ? 'bg-white/5 border-white/10 text-gray-400' 
                  : 'bg-brand-purple/20 border-brand-purple/30 text-brand-purple'
            }`}>
              {isLiveMatch ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {t('match.live')} • {fixture.minute}'
                </span>
              ) : isCompleted ? (
                t('match.ft')
              ) : (
                new Date(fixture.dateTime).toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })
              )}
            </div>
          </div>

          {/* Teams & Score */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-5">
            {/* Home Team */}
            <div className="flex-1 min-w-0 flex flex-col items-center gap-2 sm:gap-3 group cursor-pointer"
                 onClick={() => fixture.homeTeam?.id && navigate(`/teams/${fixture.homeTeam.id}`)}>
              <div className="relative">
                <div className="absolute inset-0 bg-brand-purple/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <NewTeamAvatar 
                  team={fixture.homeTeam}
                  size={64} 
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl ring-2 ring-white/5 group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white text-center leading-tight group-hover:text-brand-purple transition-colors whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">
                {fixture.homeTeam?.name}
              </h2>
            </div>

            {/* Score Display */}
            <div className="flex flex-col items-center justify-center px-3 min-w-[120px] sm:min-w-[180px]">
              {isLiveMatch || isCompleted ? (
                <div className="flex items-center justify-center gap-4 sm:gap-8 relative">
                  {/* Glow Effect behind score */}
                  <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full -z-10" />
                  
                  <span className="fixture-detail-score">
                    {fixture.homeScore}
                  </span>
                  <span className="fixture-detail-divider">:</span>
                  <span className="fixture-detail-score">
                    {fixture.awayScore}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md shadow-inner">
                  <span className="text-xl sm:text-2xl font-bold text-gray-500 tracking-widest">VS</span>
                </div>
              )}

              {showPenalties && (
                <div className="mt-2 text-xs text-purple-200 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                  {t('match.penalties') || 'Penalties'}: {fixture.penaltyHomeScore}-{fixture.penaltyAwayScore}
                </div>
              )}
            </div>

            {/* Away Team */}
              <div className="flex-1 min-w-0 flex flex-col items-center gap-2 sm:gap-3 group cursor-pointer"
                 onClick={() => fixture.awayTeam?.id && navigate(`/teams/${fixture.awayTeam.id}`)}>
              <div className="relative">
                <div className="absolute inset-0 bg-accent-green/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <NewTeamAvatar 
                  team={fixture.awayTeam}
                  size={64} 
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl ring-2 ring-white/5 group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white text-center leading-tight group-hover:text-accent-green transition-colors whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">
                {fixture.awayTeam?.name}
              </h2>
            </div>
          </div>

          {/* Venue Info */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
            {fixture.venue && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{fixture.venue}</span>
              </div>
            )}
            {fixture.league && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Users className="w-3.5 h-3.5" />
                <span>{fixture.league}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-16 z-40 px-4 sm:px-8 mt-4">
        <div className="bg-app/80 backdrop-blur-xl border border-white/5 rounded-full overflow-hidden shadow-lg">
          <div className="flex items-center">
            <TabButton id="summary" label={t('pages.fixtureDetail.matchDetails')} icon={Info} />
            <TabButton id="lineups" label={t('pages.fixtureDetail.lineup')} icon={Users} />
            <TabButton id="stats" label={t('pages.fixtureDetail.stats')} icon={Target} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full px-4 sm:px-8 py-6">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fade-in">
            {/* Prediction Card */}
            {!isCompleted && !isLiveMatch && (
              <div className="bg-gradient-to-br from-brand-purple/20 to-app border border-brand-purple/30 rounded-2xl p-4 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/20 blur-[50px] rounded-full pointer-events-none" />
                <h3 className="text-white font-bold mb-2 relative z-10">{t('match.whoWillWin')}</h3>
                {userPrediction && (
                  <p className="text-xs text-gray-400 mb-3 relative z-10">Total votes: {predictions.home + predictions.draw + predictions.away}</p>
                )}
                <div className="flex gap-2 relative z-10">
                  <button 
                    onClick={() => handlePrediction('home')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all border text-[11px] font-medium group relative overflow-hidden min-h-[36px] ${
                      userPrediction === 'home' 
                        ? 'bg-brand-purple border-brand-purple text-white' 
                        : 'bg-white/5 hover:bg-brand-purple/50 border-white/10 text-white'
                    }`}
                  >
                    <span className="group-hover:scale-105 inline-block transition-transform relative z-10">{fixture.homeTeam?.name}</span>
                    {userPrediction && (
                      <div className="text-[8px] text-white/50 mt-0.5 font-medium relative z-10">{predictions.home} votes</div>
                    )}
                  </button>
                  <button 
                    onClick={() => handlePrediction('draw')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all border text-[11px] font-medium relative overflow-hidden min-h-[36px] ${
                      userPrediction === 'draw' 
                        ? 'bg-white/20 border-white/30 text-white' 
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                    }`}
                  >
                    <span className="relative z-10">{t('match.draw')}</span>
                    {userPrediction && (
                      <div className="text-[8px] text-white/50 mt-0.5 font-medium relative z-10">{predictions.draw} votes</div>
                    )}
                  </button>
                  <button 
                    onClick={() => handlePrediction('away')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all border text-[11px] font-medium group relative overflow-hidden min-h-[36px] ${
                      userPrediction === 'away' 
                        ? 'bg-accent-green border-accent-green text-white' 
                        : 'bg-white/5 hover:bg-accent-green/50 border-white/10 text-white'
                    }`}
                  >
                    <span className="group-hover:scale-105 inline-block transition-transform relative z-10">{fixture.awayTeam?.name}</span>
                    {userPrediction && (
                      <div className="text-[8px] text-white/50 mt-0.5 font-medium relative z-10">{predictions.away} votes</div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Match Info Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{t('match.date')}</div>
                  <div className="text-sm font-medium text-white">
                    {new Date(fixture.dateTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{t('match.time')}</div>
                  <div className="text-sm font-medium text-white">
                    {new Date(fixture.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {fixture.venue && (
                <div className="col-span-2 bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{t('match.venue')}</div>
                    <div className="text-sm font-medium text-white">{fixture.venue}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            {fixture.events && fixture.events.length > 0 ? (
              <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-brand-purple before:via-accent-green before:to-transparent">
                {fixture.events
                  .sort((a, b) => a.minute - b.minute)
                  .map((event) => {
                    const isHome = event.team === fixture.homeTeam?.id;
                    const team = isHome ? fixture.homeTeam : fixture.awayTeam;
                    const player = team?.players?.find(p => p.id === event.playerId);
                    
                    return (
                      <div key={event.id} className="relative">
                        <div className={`absolute -left-[29px] w-7 h-7 rounded-full border-4 border-app flex items-center justify-center z-10 ${
                          event.type === 'goal' ? 'bg-green-500' :
                          event.type === 'red_card' ? 'bg-red-500' :
                          event.type === 'yellow_card' ? 'bg-yellow-400' : 'bg-gray-600'
                        }`}>
                          {event.type === 'goal' && <Target className="w-3 h-3 text-white" />}
                        </div>
                        
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-brand-purple font-bold text-lg">{event.minute}'</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{event.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <NewTeamAvatar team={team} size={28} className="w-7 h-7 rounded-full" />
                            <div>
                              <div className="text-white font-medium">{player?.name || 'Unknown Player'}</div>
                              <div className="text-xs text-gray-400">{team?.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{t('pages.fixtureDetail.noEvents')}</p>
              </div>
            )}
          </div>
        )}

        {/* LINEUPS TAB */}
        {activeTab === 'lineups' && (
          <div className="space-y-6 animate-fade-in">
            {/* View Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1">
                <button 
                  onClick={() => setLineupView('pitch')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    lineupView === 'pitch' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Pitch
                </button>
                <button 
                  onClick={() => setLineupView('list')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    lineupView === 'list' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {lineupView === 'pitch' ? (
              <div className="relative w-full aspect-[2/3] bg-[#1a4f2c] rounded-2xl border-4 border-[#236339] overflow-hidden shadow-2xl mx-auto max-w-md">
                {/* Pitch Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_10%]" />
                
                {/* Pitch Markings */}
                <div className="absolute inset-0 border-2 border-white/20 m-4 rounded-lg">
                  {/* Center Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full" />
                  {/* Penalty Areas */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-24 border-x border-b border-white/20" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-24 border-x border-t border-white/20" />
                </div>

                {/* Teams Layer */}
                <div className="absolute inset-0 py-6 px-4 flex justify-between bg-black/20 backdrop-blur-[1px]">
                  {/* Home Team (Left) */}
                  <div className="flex-1 flex flex-col items-start gap-2 overflow-y-auto no-scrollbar">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20 w-full sticky top-0">
                        <NewTeamAvatar team={fixture.homeTeam} size={20} className="w-5 h-5 rounded-full" />
                        <span className="text-white font-bold text-xs uppercase tracking-wider truncate max-w-[100px]">{fixture.homeTeam?.name}</span>
                    </div>
                    {fixture.homeLineup?.map(id => {
                        const player = fixture.homeTeam?.players?.find(p => p.id === id);
                        if (!player) return null;
                        return (
                            <div key={id} className="flex items-center gap-2 w-full group">
                                <div className="w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center text-[10px] font-bold shadow-sm border border-white/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                    {player.jerseyNumber}
                                </div>
                                <span className="text-[11px] font-medium text-white drop-shadow-md truncate">{player.name}</span>
                                {player.isCaptain && <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                            </div>
                        );
                    })}
                  </div>

                  {/* Away Team (Right) */}
                  <div className="flex-1 flex flex-col items-end gap-2 overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-end gap-2 mb-2 pb-2 border-b border-white/20 w-full sticky top-0">
                        <span className="text-white font-bold text-xs uppercase tracking-wider truncate max-w-[100px] text-right">{fixture.awayTeam?.name}</span>
                        <NewTeamAvatar team={fixture.awayTeam} size={20} className="w-5 h-5 rounded-full" />
                    </div>
                    {fixture.awayLineup?.map(id => {
                        const player = fixture.awayTeam?.players?.find(p => p.id === id);
                        if (!player) return null;
                        return (
                            <div key={id} className="flex items-center justify-end gap-2 w-full group">
                                {player.isCaptain && <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                <span className="text-[11px] font-medium text-white drop-shadow-md truncate text-right">{player.name}</span>
                                <div className="w-6 h-6 rounded-full bg-accent-green text-white flex items-center justify-center text-[10px] font-bold shadow-sm border border-white/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                    {player.jerseyNumber}
                                </div>
                            </div>
                        );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { team: fixture.homeTeam, lineup: fixture.homeLineup, label: 'Home' },
                  { team: fixture.awayTeam, lineup: fixture.awayLineup, label: 'Away' }
                ].map(({ team, lineup, label }) => (
                  <div key={label} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                      <NewTeamAvatar team={team} size={32} className="w-8 h-8 rounded-full" />
                      <div>
                        <h3 className="text-white font-bold">{team?.name}</h3>
                        <p className="text-xs text-gray-400">{lineup?.length || 0} Players</p>
                      </div>
                    </div>
                    <div className="p-2">
                      {lineup && lineup.length > 0 ? (
                        <div className="space-y-1">
                          {lineup.map((playerId) => {
                            const player = team?.players?.find(p => p.id === playerId);
                            if (!player) return null;
                            return (
                              <div key={playerId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-white group-hover:bg-brand-purple transition-colors">
                                  {player.jerseyNumber || '-'}
                                </div>
                                <div className="flex-1">
                                  <div className="text-gray-200 text-sm font-medium flex items-center gap-2">
                                    {player.name}
                                    {player.isCaptain && <Shield className="w-3 h-3 text-yellow-400" />}
                                  </div>
                                  <div className="text-xs text-gray-500">{player.position}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          {t('pages.fixtureDetail.noLineup')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            {fixture.stats ? (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-8">
                {Object.entries(fixture.stats).map(([stat, values]) => {
                  const total = values.home + values.away;
                  const homePercent = total ? (values.home / total) * 100 : 50;
                  
                  return (
                    <div key={stat} className="space-y-3">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white w-12">{values.home}</span>
                        <span className="text-gray-400 uppercase text-xs tracking-widest flex-1 text-center">{stat}</span>
                        <span className="text-white w-12 text-right">{values.away}</span>
                      </div>
                      <div className="h-3 bg-dark-800 rounded-full overflow-hidden flex relative shadow-inner">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-app z-10" />
                        <div 
                          className="h-full bg-gradient-to-r from-brand-purple/50 to-brand-purple transition-all duration-1000" 
                          style={{ width: `${homePercent}%` }}
                        />
                        <div 
                          className="h-full bg-gradient-to-l from-accent-green/50 to-accent-green transition-all duration-1000 ml-auto" 
                          style={{ width: `${100 - homePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{t('pages.fixtureDetail.noStats')}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Comments Section at Bottom */}
      <div className="w-full px-4 sm:px-8 py-8 border-t border-white/5">
        <div className="flex items-end gap-2 mb-6">
          <h3 className="text-base font-semibold tracking-wide text-gray-300 uppercase">
            {t('pages.fixtureDetail.matchDiscussion')}
          </h3>
          <span className="text-xs text-gray-500">{fixtureComments.length} {t('pages.fixtureDetail.comments')}</span>
        </div>

        {user ? (
          <form onSubmit={handleAddComment} className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-accent-green flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('pages.fixtureDetail.addComment')}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              disabled={isCommenting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isCommenting}
              className="text-brand-purple font-semibold text-sm tracking-wide disabled:opacity-30"
            >
              {t('pages.fixtureDetail.post')}
            </button>
          </form>
        ) : (
          <div className="border-b border-white/10 pb-4 mb-6 text-sm text-gray-400 text-center">
            <button onClick={() => navigate('/login')} className="text-brand-purple font-semibold mr-1">
              {t('pages.fixtureDetail.logIn')}
            </button>
            {t('pages.fixtureDetail.toComment')}
          </div>
        )}

        <div className="space-y-5">
          {fixtureComments.length > 0 ? (
            fixtureComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1 pb-4 border-b border-white/5">
                  <p className="text-sm text-gray-200 leading-relaxed">
                    <span className="font-semibold text-white mr-2">{comment.userName}</span>
                    {comment.content}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-[11px] uppercase tracking-wide text-gray-500">
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    <button type="button" className="hover:text-white">Reply</button>
                    <button type="button" className="flex items-center gap-1 hover:text-brand-purple">
                      <Heart className="w-3.5 h-3.5" />
                      <span>0</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">
              {t('pages.fixtureDetail.noCommentsYet')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixtureDetail;
