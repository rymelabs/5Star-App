import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle, Heart, User, Shield, Target, Bell, BellOff } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { fixturesCollection } from '../firebase/firestore';
import { isFixtureLive } from '../utils/helpers';
import { addFixtureToCalendar } from '../utils/calendar';
import TeamAvatar from '../components/TeamAvatar';

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

  useEffect(() => {
    const foundFixture = fixtures.find(f => f.id === id);
    setFixture(foundFixture);
    
    // Initialize likes from fixture data
    if (foundFixture) {
      setLikes(foundFixture.likes || 0);
      setIsLiked(foundFixture.likedBy?.includes(user?.uid) || false);
      
      // Check if calendar reminder exists in localStorage
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
      // Load comments
      getCommentsForItem('fixture', id);
      // Subscribe to real-time comments
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

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousLikes = likes;
    
    try {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      
      // Call backend
      const result = await fixturesCollection.toggleLike(id, user.uid);
      
      // Update with actual values from backend
      setLikes(result.likes);
      setIsLiked(result.isLiked);
    } catch (error) {
      // Revert on error
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
        // Save reminder in localStorage
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
        
        showSuccess(
          t('pages.fixtureDetail.addedToCalendar'),
          t('pages.fixtureDetail.addedToCalendarDesc')
        );
      } else {
        showError(
          t('pages.fixtureDetail.failedToAdd'),
          t('pages.fixtureDetail.failedToAddDesc')
        );
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      showError(
        t('common.error'),
        t('pages.fixtureDetail.calendarError')
      );
    }
  };

  if (!fixture) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">{t('pages.fixtureDetail.fixtureNotFound')}</div>
        <button onClick={() => navigate('/fixtures')} className="btn-primary">
          {t('pages.fixtureDetail.backToFixtures')}
        </button>
      </div>
    );
  }

  const fixtureComments = comments[`fixture_${id}`] || [];
  const isLiveMatch = isFixtureLive(fixture);
  const isCompleted = fixture.status === 'completed';

  return (
    <div className="p-6 pb-24">
      {/* Header with Back Button and Calendar Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </button>
        
        {/* Add to Calendar Button */}
        <button
          onClick={handleAddToCalendar}
          className={`p-2 rounded-full transition-all ${
            hasCalendarReminder
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
          }`}
          title={hasCalendarReminder ? t('pages.fixtureDetail.addedToCalendarTitle') : t('pages.fixtureDetail.addToCalendarTitle')}
        >
          {hasCalendarReminder ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="fixture-detail-layout">
        <div className="fixture-detail-main">
      {/* Match Header */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
        {/* Status Badge */}
        <div className="flex justify-center mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isLiveMatch ? 'bg-red-500 text-white' :
            isCompleted ? 'bg-accent-500 text-white' :
            'bg-gray-600 text-gray-300'
          }`}>
            {isLiveMatch ? (
              <span className="animate-live-pulse font-bold">● {t('match.live')}</span>
            ) : isCompleted ? (
              t('match.ft')
            ) : (
              t('match.upcoming')
            )}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-6">
          {/* Home Team - Clickable */}
          <button
            onClick={() => fixture.homeTeam?.id && navigate(`/teams/${fixture.homeTeam.id}`)}
            className="text-center flex-1 hover:opacity-80 transition-opacity cursor-pointer"
            disabled={!fixture.homeTeam?.id}
          >
            <TeamAvatar name={fixture.homeTeam?.name} logo={fixture.homeTeam?.logo} size={64} className="rounded-full mx-auto mb-2" />
            <h2 className="font-semibold text-white">{fixture.homeTeam?.name || t('pages.fixtureDetail.homeTeam')}</h2>
          </button>

          <div className="text-center px-8">
            {isLiveMatch || isCompleted ? (
              <div className="fixture-score text-white">
                {fixture.homeScore} - {fixture.awayScore}
              </div>
            ) : (
              <div className="fixture-score-vs text-gray-400">VS</div>
            )}
            <div className="text-sm text-gray-400 mt-1">
              {isLiveMatch && `${fixture.minute || 0}'`}
            </div>
          </div>

          {/* Away Team - Clickable */}
          <button
            onClick={() => fixture.awayTeam?.id && navigate(`/teams/${fixture.awayTeam.id}`)}
            className="text-center flex-1 hover:opacity-80 transition-opacity cursor-pointer"
            disabled={!fixture.awayTeam?.id}
          >
            <TeamAvatar name={fixture.awayTeam?.name} logo={fixture.awayTeam?.logo} size={64} className="rounded-full mx-auto mb-2" />
            <h2 className="font-semibold text-white">{fixture.awayTeam?.name || t('pages.fixtureDetail.awayTeam')}</h2>
          </button>
        </div>

        {/* Match Info */}
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(fixture.dateTime).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          {fixture.venue && (
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              {fixture.venue}
            </div>
          )}
          {fixture.league && (
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              {fixture.league}
            </div>
          )}
        </div>
      </div>

      {/* Team Lineups */}
      {(fixture.homeLineup?.length > 0 || fixture.awayLineup?.length > 0) && (
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('pages.fixtureDetail.startingLineups')}
          </h3>
          
          {/* Debug Info - Remove after testing */}
          {(!fixture.homeTeam?.players && !fixture.awayTeam?.players) && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
              ⚠️ Team player data not loaded. Teams: {fixture.homeTeam?.name} (players: {fixture.homeTeam?.players?.length || 0}), {fixture.awayTeam?.name} (players: {fixture.awayTeam?.players?.length || 0})
            </div>
          )}
          
          {/* Side by Side Layout - Always 2 columns */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Home Team Lineup */}
            <div className="min-w-0">
              <h4 className="font-medium text-white mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <span className="truncate">{fixture.homeTeam?.name}</span>
                <span className="text-xs text-gray-400">({fixture.homeLineup?.length || 0})</span>
              </h4>
              {fixture.homeLineup && fixture.homeLineup.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {fixture.homeLineup.map((playerId) => {
                    const player = fixture.homeTeam?.players?.find(p => p.id === playerId);
                    if (!player) return null;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => fixture.homeTeam?.id && navigate(`/teams/${fixture.homeTeam.id}/players/${player.id}`)}
                        className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg min-w-0 text-left w-full hover:bg-dark-700 transition-colors"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {player.jerseyNumber || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                            <span className="truncate">{player.name}</span>
                            {player.isCaptain && (
                              <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" title={t('pages.fixtureDetail.captain')} />
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400 truncate">{player.position}</div>
                        </div>
                      </button>
                    );
                  })}  
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 text-center py-4">{t('pages.fixtureDetail.noLineup')}</div>
              )}
            </div>

            {/* Away Team Lineup */}
            <div className="min-w-0">
              <h4 className="font-medium text-white mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <span className="truncate">{fixture.awayTeam?.name}</span>
                <span className="text-xs text-gray-400">({fixture.awayLineup?.length || 0})</span>
              </h4>
              {fixture.awayLineup && fixture.awayLineup.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {fixture.awayLineup.map((playerId) => {
                    const player = fixture.awayTeam?.players?.find(p => p.id === playerId);
                    if (!player) return null;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => fixture.awayTeam?.id && navigate(`/teams/${fixture.awayTeam.id}/players/${player.id}`)}
                        className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg min-w-0 text-left w-full hover:bg-dark-700 transition-colors"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {player.jerseyNumber || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                            <span className="truncate">{player.name}</span>
                            {player.isCaptain && (
                              <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" title={t('pages.fixtureDetail.captain')} />
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400 truncate">{player.position}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 text-center py-4">{t('pages.fixtureDetail.noLineup')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match Timeline */}
      {fixture.events && fixture.events.length > 0 && (
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t('pages.fixtureDetail.matchEvents')}
          </h3>
          <div className="space-y-3">
            {fixture.events
              .sort((a, b) => a.minute - b.minute)
              .map((event) => {
                const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
                const player = team?.players?.find(p => p.id === event.playerId);
                const assistant = event.assistById ? team?.players?.find(p => p.id === event.assistById) : null;
                
                return (
                  <div key={event.id} className="flex items-start gap-4 p-3 bg-dark-800 rounded-lg">
                    {/* Minute Badge */}
                    <div className="w-12 flex-shrink-0">
                      <span className="text-sm font-bold text-purple-400">
                        {event.minute}'
                      </span>
                    </div>

                    {/* Event Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {event.type === 'goal' && (
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      {event.type === 'yellow_card' && (
                        <div className="w-4 h-5 bg-yellow-400 rounded-sm" />
                      )}
                      {event.type === 'red_card' && (
                        <div className="w-4 h-5 bg-red-500 rounded-sm" />
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {player?.name || t('pages.fixtureDetail.unknownPlayer')}
                        {event.type === 'goal' && ' ⚽'}
                      </div>
                      {assistant && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {t('pages.fixtureDetail.assist')}: {assistant.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-0.5">
                        {team?.name}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Live Commentary */}
      {isLiveMatch && fixture.commentary && (
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.fixtureDetail.liveCommentary')}</h3>
          <div className="space-y-3">
            {fixture.commentary.map((event, index) => (
              <div key={index} className="flex gap-3">
                <span className="text-xs text-gray-400 min-w-[30px]">{event.minute}'</span>
                <p className="text-gray-300 text-sm">{event.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Stats */}
      {(isLiveMatch || isCompleted) && fixture.stats && (
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.fixtureDetail.matchStatistics')}</h3>
          <div className="space-y-4">
            {Object.entries(fixture.stats).map(([stat, values]) => (
              <div key={stat} className="flex items-center justify-between">
                <span className="text-white font-medium">{values.home}</span>
                <span className="text-gray-400 text-sm capitalize">{stat}</span>
                <span className="text-white font-medium">{values.away}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Actions - Like & Comment Count */}
      <div className="flex items-center gap-6 py-4 border-t border-b border-dark-700 mb-6">
        <button 
          onClick={handleLike}
          disabled={!user || isLiking}
          className={`flex items-center gap-2 transition-colors ${
            isLiked
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-400 hover:text-red-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart 
            className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} 
          />
          <span>{likes} {isLiked ? t('pages.fixtureDetail.liked') : t('pages.fixtureDetail.like')}</span>
        </button>
        
        <div className="flex items-center gap-2 text-gray-400">
          <MessageCircle className="w-5 h-5" />
          <span>{fixtureComments.length} {t('pages.fixtureDetail.comments')}</span>
        </div>
      </div>

        </div>

        <aside className="fixture-detail-comments card">
          <h3 className="text-lg font-semibold text-white">
            {t('pages.fixtureDetail.matchDiscussion')} ({fixtureComments.length})
          </h3>

          {user ? (
            <form onSubmit={handleAddComment} className="border-t border-dark-700 pt-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('pages.fixtureDetail.addComment')}
                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
                    disabled={isCommenting}
                  />
                  {newComment.trim() && (
                    <button
                      type="submit"
                      disabled={isCommenting}
                      className="text-primary-500 hover:text-primary-400 font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {isCommenting ? t('pages.fixtureDetail.posting') : t('pages.fixtureDetail.post')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="border-t border-dark-700 pt-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">
                    <button 
                      onClick={() => navigate('/login')}
                      className="text-primary-500 hover:text-primary-400 font-medium"
                    >
                      {t('pages.fixtureDetail.logIn')}
                    </button>
                    {' '}{t('pages.fixtureDetail.toComment')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {fixtureComments.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">
                {t('pages.fixtureDetail.noCommentsYet')}
              </p>
            ) : (
              fixtureComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{comment.userName}</span>
                      <span className="text-gray-300 text-sm leading-relaxed">{comment.content}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FixtureDetail;
