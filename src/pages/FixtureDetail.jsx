import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';

const FixtureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fixtures } = useFootball();
  const { getCommentsForItem, addComment, subscribeToComments, comments } = useNews();
  const { user } = useAuth();
  const [fixture, setFixture] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const foundFixture = fixtures.find(f => f.id === id);
    setFixture(foundFixture);
  }, [id, fixtures]);

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
        userName: user.name
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
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
  const isLive = fixture.status === 'live';
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
            isLive ? 'bg-red-500 text-white animate-pulse' :
            isCompleted ? 'bg-accent-500 text-white' :
            'bg-gray-600 text-gray-300'
          }`}>
            {isLive ? 'LIVE' : isCompleted ? 'FULL TIME' : 'UPCOMING'}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <div className="w-16 h-16 bg-dark-700 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-500">
                {fixture.homeTeam.charAt(0)}
              </span>
            </div>
            <h2 className="font-semibold text-white">{fixture.homeTeam}</h2>
          </div>

          <div className="text-center px-8">
            {isLive || isCompleted ? (
              <div className="text-3xl font-bold text-white">
                {fixture.homeScore} - {fixture.awayScore}
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-400">VS</div>
            )}
            <div className="text-sm text-gray-400 mt-1">
              {isLive && `${fixture.minute || 0}'`}
            </div>
          </div>

          <div className="text-center flex-1">
            <div className="w-16 h-16 bg-dark-700 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-500">
                {fixture.awayTeam.charAt(0)}
              </span>
            </div>
            <h2 className="font-semibold text-white">{fixture.awayTeam}</h2>
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

      {/* Live Commentary */}
      {isLive && fixture.commentary && (
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
      {(isLive || isCompleted) && fixture.stats && (
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

      {/* Comments Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">
            Match Discussion ({fixtureComments.length})
          </h3>
        </div>

        {/* Add Comment Form */}
        {user && (
          <form onSubmit={handleAddComment} className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this match..."
              className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 resize-none"
              rows="3"
            />
            <button
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              className="btn-primary"
            >
              {isCommenting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {fixtureComments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            fixtureComments.map((comment) => (
              <div key={comment.id} className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{comment.userName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FixtureDetail;