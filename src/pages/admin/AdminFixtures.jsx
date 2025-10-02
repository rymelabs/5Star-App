import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, MapPin, Save, X } from 'lucide-react';

const AdminFixtures = () => {
  const navigate = useNavigate();
  const { fixtures, teams, addFixture } = useFootball();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    competition: 'Premier League',
    round: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.homeTeam || !formData.awayTeam || !formData.date || !formData.time) return;

    setLoading(true);
    try {
      // Combine date and time into a single dateTime
      const dateTimeString = `${formData.date}T${formData.time}`;
      const dateTime = new Date(dateTimeString);
      
      const newFixture = {
        homeTeamId: formData.homeTeam,
        awayTeamId: formData.awayTeam,
        dateTime: dateTime,
        venue: formData.venue || '',
        competition: formData.competition || 'Premier League',
        round: formData.round || '',
        status: formData.status || 'scheduled',
        homeScore: null,
        awayScore: null
      };
      
      console.log('Submitting fixture:', newFixture);
      await addFixture(newFixture);
      
      // Reset form
      setFormData({
        homeTeam: '',
        awayTeam: '',
        date: '',
        time: '',
        venue: '',
        competition: 'Premier League',
        round: '',
        status: 'scheduled'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding fixture:', error);
      alert('Failed to add fixture: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      homeTeam: '',
      awayTeam: '',
      date: '',
      time: '',
      venue: '',
      competition: 'Premier League',
      round: '',
      status: 'scheduled'
    });
    setShowAddForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'text-accent-500 bg-accent-500/20';
      case 'finished': return 'text-gray-400 bg-gray-500/20';
      case 'postponed': return 'text-yellow-500 bg-yellow-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/20';
      default: return 'text-primary-500 bg-primary-500/20';
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-white">Fixtures Management</h1>
              <p className="text-sm text-gray-400">{fixtures.length} fixtures</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Fixture
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add Fixture Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Fixture</h3>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Home Team *
                  </label>
                  <select
                    name="homeTeam"
                    value={formData.homeTeam}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select home team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Away Team *
                  </label>
                  <select
                    name="awayTeam"
                    value={formData.awayTeam}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select away team</option>
                    {teams.filter(team => team.id !== formData.homeTeam).map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="Stadium name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Competition
                  </label>
                  <select
                    name="competition"
                    value={formData.competition}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="Premier League">Premier League</option>
                    <option value="Champions League">Champions League</option>
                    <option value="FA Cup">FA Cup</option>
                    <option value="League Cup">League Cup</option>
                    <option value="Europa League">Europa League</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Round/Matchday
                  </label>
                  <input
                    type="text"
                    name="round"
                    value={formData.round}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="e.g., Matchday 15, Quarter Final"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                    <option value="postponed">Postponed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.homeTeam || !formData.awayTeam}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Fixture'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Fixtures List */}
        <div className="space-y-4">
          {fixtures.map((fixture) => {
            // Handle both old (date/time) and new (dateTime) formats
            let dateTime;
            if (fixture.dateTime) {
              const dt = new Date(fixture.dateTime);
              dateTime = {
                date: dt.toLocaleDateString(),
                time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              };
            } else {
              dateTime = formatDateTime(fixture.date, fixture.time);
            }
            
            // Safely get team data
            const homeTeam = fixture.homeTeam || teams.find(t => t.id === fixture.homeTeamId) || { name: 'Unknown', logo: '' };
            const awayTeam = fixture.awayTeam || teams.find(t => t.id === fixture.awayTeamId) || { name: 'Unknown', logo: '' };
            
            return (
              <div key={fixture.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fixture.status)}`}>
                      {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-400">{fixture.competition}</span>
                    {fixture.round && (
                      <span className="text-sm text-gray-500">• {fixture.round}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/admin/fixtures/edit/${fixture.id}`)}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this fixture?')) {
                          console.log('Delete fixture:', fixture.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {/* Teams */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {homeTeam.logo && (
                        <img
                          src={homeTeam.logo}
                          alt={homeTeam.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <span className="font-medium text-white">{homeTeam.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 px-4">
                      {fixture.status === 'finished' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {fixture.homeScore} - {fixture.awayScore}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-gray-400">VS</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {awayTeam.logo && (
                        <img
                          src={awayTeam.logo}
                          alt={awayTeam.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <span className="font-medium text-white">{awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="text-right text-sm text-gray-400 ml-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{dateTime.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{dateTime.time}</span>
                    </div>
                    {fixture.venue && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{fixture.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {fixtures.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No fixtures yet</h3>
            <p className="text-gray-400 mb-4">Get started by adding your first fixture</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add First Fixture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFixtures;