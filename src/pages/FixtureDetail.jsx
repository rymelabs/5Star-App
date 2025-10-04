import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle, Heart, User, Shield, Target } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';
import { fixturesCollection } from '../firebase/firestore';
import { isFixtureLive } from '../utils/helpers';

const FixtureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fixtures } = useFootball();
  const { getCommentsForItem, addComment, subscribeToComments, comments } = useNews();
  const { user } = useAuth();
  const [fixture, setFixture] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const foundFixture = fixtures.find(f => f.id === id);
    setFixture(foundFixture);
    
    // Initialize likes from fixture data
    if (foundFixture) {
      setLikes(foundFixture.likes || 0);
      setIsLiked(foundFixture.likedBy?.includes(user?.uid) || false);
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

  if (!fixture) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">❌ Fixture not found</div>
        <button onClick={() => navigate('/fixtures')} className="btn-primary">
          Back to Fixtures
        </button>
      </div>
    );
  }

  const fixtureComments = comments[`fixture_${id}`] || [];
  const isLiveMatch = isFixtureLive(fixture);
  const isCompleted = fixture.status === 'completed';

  return (
    <div className="p-6 pb-24">
      {/* Back Button */}
      <button
        onClick={() => navigate('/fixtures')}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Fixtures
      </button>

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
              <span className="animate-live-pulse font-bold">● LIVE</span>
            ) : isCompleted ? (
              'FULL TIME'
            ) : (
              'UPCOMING'
            )}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            {fixture.homeTeam?.logo && fixture.homeTeam.logo.trim() ? (
              <img 
                src={fixture.homeTeam.logo} 
                alt={fixture.homeTeam.name}
                className="w-16 h-16 mx-auto mb-2 object-contain rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-dark-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-500">
                  {fixture.homeTeam?.name?.charAt(0) || 'H'}
                </span>
              </div>
            )}
            <h2 className="font-semibold text-white">{fixture.homeTeam?.name || 'Home Team'}</h2>
          </div>

          <div className="text-center px-8">
            {isLiveMatch || isCompleted ? (
              <div className="text-lg font-bold text-white">
                {fixture.homeScore} - {fixture.awayScore}
              </div>
            ) : (
              <div className="text-lg font-bold text-gray-400">VS</div>
            )}
            <div className="text-sm text-gray-400 mt-1">
              {isLiveMatch && `${fixture.minute || 0}'`}
            </div>
          </div>

          <div className="text-center flex-1">
            {fixture.awayTeam?.logo && fixture.awayTeam.logo.trim() ? (
              <img 
                src={fixture.awayTeam.logo} 
                alt={fixture.awayTeam.name}
                className="w-16 h-16 mx-auto mb-2 object-contain rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-dark-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-500">
                  {fixture.awayTeam?.name?.charAt(0) || 'A'}
                </span>
              </div>
            )}
            <h2 className="font-semibold text-white">{fixture.awayTeam?.name || 'Away Team'}</h2>
          </div>
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
            Starting Lineups
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
                      <div key={player.id} className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {player.jerseyNumber || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                            <span className="truncate">{player.name}</span>
                            {player.isCaptain && (
                              <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" title="Captain" />
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400 truncate">{player.position}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 text-center py-4">No lineup</div>
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
                      <div key={player.id} className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {player.jerseyNumber || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                            <span className="truncate">{player.name}</span>
                            {player.isCaptain && (
                              <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" title="Captain" />
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400 truncate">{player.position}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 text-center py-4">No lineup</div>
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
            Match Events
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
                        {player?.name || 'Unknown Player'}
                        {event.type === 'goal' && ' ⚽'}
                      </div>
                      {assistant && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Assist: {assistant.name}
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
          <h3 className="text-lg font-semibold text-white mb-4">Live Commentary</h3>
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
          <h3 className="text-lg font-semibold text-white mb-4">Match Statistics</h3>
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
          <span>{likes} {isLiked ? 'Liked' : 'Like'}</span>
        </button>
        
        <div className="flex items-center gap-2 text-gray-400">
          <MessageCircle className="w-5 h-5" />
          <span>{fixtureComments.length} Comments</span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white">Match Discussion ({fixtureComments.length})</h3>

        {/* Add Comment Form - Instagram Style */}
        {user ? (
          <form onSubmit={handleAddComment} className="border-t border-dark-700 pt-4">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>

              {/* Comment Input */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
                  disabled={isCommenting}
                />
                
                {/* Post Button - Only visible when there's text */}
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={isCommenting}
                    className="text-primary-500 hover:text-primary-400 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {isCommenting ? 'Posting...' : 'Post'}
                  </button>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="border-t border-dark-700 pt-4">
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
                    Log in
                  </button>
                  {' '}to comment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments List - Instagram Style */}
        <div className="space-y-4 pt-2">
          {fixtureComments.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            fixtureComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* Commenter Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
                
                {/* Comment Content */}
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
      </div>
    </div>
  );
};

export default FixtureDetail;