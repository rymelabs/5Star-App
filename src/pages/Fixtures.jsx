import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../context/FootballContext';
import { Calendar, Clock, Filter, Trophy, Users } from 'lucide-react';
import { formatDate, formatTime, getMatchDayLabel, isToday } from '../utils/dateUtils';
import { formatScore, groupBy, sortBy } from '../utils/helpers';

const Fixtures = () => {
  const navigate = useNavigate();
  const { fixtures, leagueTable, currentSeason } = useFootball();
  const [activeTab, setActiveTab] = useState('fixtures');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter fixtures based on status
  const filteredFixtures = useMemo(() => {
    let filtered = fixtures;
    
    if (statusFilter === 'upcoming') {
      filtered = fixtures.filter(f => new Date(f.dateTime) > new Date());
    } else if (statusFilter === 'completed') {
      filtered = fixtures.filter(f => f.status === 'completed');
    } else if (statusFilter === 'live') {
      filtered = fixtures.filter(f => f.status === 'live');
    } else if (statusFilter === 'today') {
      filtered = fixtures.filter(f => isToday(f.dateTime));
    }
    
    return sortBy(filtered, 'dateTime', 'desc');
  }, [fixtures, statusFilter]);

  // Group fixtures by date
  const groupedFixtures = useMemo(() => {
    return groupBy(filteredFixtures, (fixture) => formatDate(fixture.dateTime));
  }, [filteredFixtures]);

  const handleFixtureClick = (fixture) => {
    navigate(`/fixtures/${fixture.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-600 text-white';
      case 'completed': return 'bg-gray-600 text-white';
      case 'scheduled': return 'bg-primary-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = (fixture) => {
    if (fixture.status === 'live') return 'LIVE';
    if (fixture.status === 'completed') return 'FT';
    if (new Date(fixture.dateTime) > new Date()) return formatTime(fixture.dateTime);
    return 'Scheduled';
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Football</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
        >
          <Filter className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Filter by Status</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Fixtures' },
              { key: 'today', label: 'Today' },
              { key: 'live', label: 'Live' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-6 bg-dark-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'fixtures'
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Fixtures
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'table'
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Table
        </button>
      </div>

      {/* Content */}
      {activeTab === 'fixtures' ? (
        <div className="space-y-6">
          {Object.entries(groupedFixtures).length > 0 ? (
            Object.entries(groupedFixtures).map(([date, dayFixtures]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-white mb-3 sticky top-16 bg-dark-900 py-2">
                  {getMatchDayLabel(dayFixtures[0].dateTime)}
                </h3>
                <div className="space-y-3">
                  {dayFixtures.map((fixture) => (
                    <div
                      key={fixture.id}
                      onClick={() => handleFixtureClick(fixture)}
                      className="card p-4 cursor-pointer hover:bg-dark-700 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        {/* Teams */}
                        <div className="flex-1">
                          {/* Home Team */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <img
                                src={fixture.homeTeam.logo}
                                alt={fixture.homeTeam.name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                              <span className="font-medium text-white">
                                {fixture.homeTeam.name}
                              </span>
                            </div>
                            {fixture.status === 'completed' && (
                              <span className="text-lg font-bold text-white">
                                {fixture.homeScore}
                              </span>
                            )}
                          </div>
                          
                          {/* Away Team */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={fixture.awayTeam.logo}
                                alt={fixture.awayTeam.name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                              <span className="font-medium text-white">
                                {fixture.awayTeam.name}
                              </span>
                            </div>
                            {fixture.status === 'completed' && (
                              <span className="text-lg font-bold text-white">
                                {fixture.awayScore}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Status/Time */}
                        <div className="ml-4 text-center">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(fixture.status)}`}>
                            {getStatusText(fixture)}
                          </div>
                          {fixture.venue && (
                            <div className="text-xs text-gray-500 mt-1">
                              {fixture.venue}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Live indicators */}
                      {fixture.status === 'live' && (
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="flex items-center text-red-400">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                            Live • {fixture.liveData?.minute || 0}'
                          </div>
                          {fixture.liveData?.events && fixture.liveData.events.length > 0 && (
                            <div className="text-gray-400">
                              {fixture.liveData.events.length} events
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No fixtures found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        /* League Table */
        <div className="card overflow-hidden">
          {currentSeason && (
            <div className="px-4 py-3 bg-dark-700 border-b border-dark-600">
              <h3 className="font-medium text-white">{currentSeason.name}</h3>
            </div>
          )}
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-dark-700 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Team</div>
            <div className="col-span-1 text-center">P</div>
            <div className="col-span-1 text-center">W</div>
            <div className="col-span-1 text-center">D</div>
            <div className="col-span-1 text-center">L</div>
            <div className="col-span-1 text-center">GD</div>
            <div className="col-span-2 text-center">Pts</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-dark-700">
            {leagueTable.map((team) => (
              <div
                key={team.team.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-dark-700 transition-colors duration-200"
              >
                <div className="col-span-1 flex items-center">
                  <span className={`text-sm font-medium ${
                    team.position <= 4 ? 'text-primary-400' :
                    team.position <= 6 ? 'text-accent-400' :
                    team.position >= 18 ? 'text-red-400' : 'text-white'
                  }`}>
                    {team.position}
                  </span>
                </div>
                
                <div className="col-span-5 flex items-center space-x-2">
                  <img
                    src={team.team.logo}
                    alt={team.team.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <span className="text-sm font-medium text-white truncate">
                    {team.team.name}
                  </span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className="text-sm text-gray-300">{team.played}</span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className="text-sm text-gray-300">{team.won}</span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className="text-sm text-gray-300">{team.drawn}</span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className="text-sm text-gray-300">{team.lost}</span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className={`text-sm ${
                    team.goalDifference > 0 ? 'text-accent-400' : 
                    team.goalDifference < 0 ? 'text-red-400' : 'text-gray-300'
                  }`}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </span>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="text-sm font-semibold text-white">
                    {team.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Table Legend */}
          <div className="px-4 py-3 bg-dark-700 border-t border-dark-600">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded mr-2"></div>
                Champions League
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-accent-600 rounded mr-2"></div>
                Europa League
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                Relegation
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fixtures;