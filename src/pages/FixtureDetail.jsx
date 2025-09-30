import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFootball } from '../context/FootballContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, MapPin, Users, MessageCircle, Send, Heart } from 'lucide-react';
import { formatDate, formatTime, getRelativeTime } from '../utils/dateUtils';

const FixtureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fixtures, updateFixture } = useFootball();
  const { user } = useAuth();
  
  const [fixture, setFixture] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const foundFixture = fixtures.find(f => f.id === parseInt(id));
    if (foundFixture) {
      setFixture(foundFixture);
      setComments(foundFixture.comments || []);
    }
  }, [id, fixtures]);

  const handleAddComment = () => {
    if (!comment.trim() || !user) return;

    const newComment = {
      id: Date.now(),
      text: comment.trim(),
      author: user.name,
      authorAvatar: user.avatar,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setComment('');

    // Update fixture in context
    updateFixture(fixture.id, { comments: updatedComments });
  };

  const handleLikeComment = (commentId) => {
    const updatedComments = comments.map(c => 
      c.id === commentId 
        ? { ...c, likes: c.likes + 1 }
        : c
    );
    setComments(updatedComments);
    updateFixture(fixture.id, { comments: updatedComments });
  };

  if (!fixture) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-pulse">Loading fixture...</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-600 text-white';
      case 'completed': return 'bg-gray-600 text-white';
      case 'scheduled': return 'bg-primary-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = () => {
    if (fixture.status === 'live') return `LIVE • ${fixture.liveData?.minute || 0}'`;
    if (fixture.status === 'completed') return 'Full Time';
    return formatTime(fixture.dateTime);
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/fixtures')}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-white">Match Details</h1>
        </div>
      </div>

      {/* Match Info */}
      <div className="px-4 py-6 bg-gradient-to-b from-dark-800 to-dark-900">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fixture.status)} mb-4`}>
            {fixture.status === 'live' && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
            )}
            {getStatusText()}
          </div>
          
          <div className="text-sm text-gray-400 mb-2">
            {formatDate(fixture.dateTime, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          {fixture.venue && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              {fixture.venue}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <img
              src={fixture.homeTeam.logo}
              alt={fixture.homeTeam.name}
              className="w-16 h-16 object-contain mx-auto mb-3"
              onError={(e) => e.target.style.display = 'none'}
            />
            <div className="font-semibold text-white text-lg">
              {fixture.homeTeam.name}
            </div>
          </div>

          {/* Score */}
          <div className="px-6">
            {fixture.status === 'completed' || fixture.status === 'live' ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {fixture.homeScore} - {fixture.awayScore}
                </div>
                {fixture.status === 'live' && fixture.liveData?.events && (
                  <div className="text-sm text-gray-400">
                    {fixture.liveData.events.length} events
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-1">VS</div>
                <div className="text-sm text-gray-500">
                  {formatTime(fixture.dateTime)}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <img
              src={fixture.awayTeam.logo}
              alt={fixture.awayTeam.name}
              className="w-16 h-16 object-contain mx-auto mb-3"
              onError={(e) => e.target.style.display = 'none'}
            />
            <div className="font-semibold text-white text-lg">
              {fixture.awayTeam.name}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex bg-dark-800 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'lineup', label: 'Lineup' },
            { key: 'comments', label: 'Comments', count: comments.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 bg-dark-600 px-1.5 py-0.5 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Match Events */}
            {fixture.liveData?.events && fixture.liveData.events.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-white mb-4">Match Events</h3>
                <div className="space-y-3">
                  {fixture.liveData.events.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 text-center text-sm font-medium text-gray-400">
                        {event.minute}'
                      </div>
                      <div className="flex-1 text-sm text-white">
                        {event.type}: {event.player} ({event.team})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match Stats */}
            <div className="card p-4">
              <h3 className="font-semibold text-white mb-4">Match Statistics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Possession', home: '58%', away: '42%' },
                  { label: 'Shots', home: '12', away: '8' },
                  { label: 'Shots on Target', home: '6', away: '3' },
                  { label: 'Corners', home: '7', away: '4' },
                  { label: 'Fouls', home: '11', away: '9' },
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm text-white font-medium w-16 text-center">
                      {stat.home}
                    </div>
                    <div className="flex-1 text-center text-sm text-gray-400">
                      {stat.label}
                    </div>
                    <div className="text-sm text-white font-medium w-16 text-center">
                      {stat.away}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="space-y-6">
            {/* Starting XI */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="font-semibold text-white mb-4 text-center">
                  {fixture.homeTeam.name}
                </h3>
                <div className="space-y-2">
                  {[1,2,3,4,5,6,7,8,9,10,11].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                        {num}
                      </div>
                      <div className="text-sm text-white">
                        Player {num}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-white mb-4 text-center">
                  {fixture.awayTeam.name}
                </h3>
                <div className="space-y-2">
                  {[1,2,3,4,5,6,7,8,9,10,11].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-accent-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                        {num}
                      </div>
                      <div className="text-sm text-white">
                        Player {num}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Add Comment */}
            {user && (
              <div className="card p-4">
                <div className="flex space-x-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts about this match..."
                      className="input-field w-full h-20 resize-none"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="card p-4">
                    <div className="flex space-x-3">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.author}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white text-sm">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">
                          {comment.text}
                        </p>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Heart className="w-3 h-3" />
                            <span>{comment.likes}</span>
                          </button>
                          <button className="text-xs text-gray-500 hover:text-white transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixtureDetail;