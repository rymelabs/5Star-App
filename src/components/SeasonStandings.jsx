import React, { useState, useMemo } from 'react';
import { Trophy, Users, TrendingUp, Award } from 'lucide-react';

const SeasonStandings = ({ season, teams }) => {
  const [activeGroup, setActiveGroup] = useState(season?.groups?.[0]?.id || null);

  if (!season || !season.groups || season.groups.length === 0) {
    return (
      <div className="card p-6 sm:p-8 text-center">
        <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No groups configured for this season</p>
      </div>
    );
  }

  const currentGroup = season.groups.find(g => g.id === activeGroup);

  // Calculate standings for the current group
  const standings = useMemo(() => {
    if (!currentGroup || !currentGroup.standings) {
      // Generate initial standings from teams
      return currentGroup?.teams?.map((team, index) => ({
        position: index + 1,
        team: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      })) || [];
    }
    
    // Sort by points, then goal difference, then goals for
    return [...currentGroup.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    }).map((standing, index) => ({
      ...standing,
      position: index + 1
    }));
  }, [currentGroup]);

  const getPositionColor = (position) => {
    const qualifiers = season.knockoutConfig?.qualifiersPerGroup || 2;
    if (position <= qualifiers) {
      return 'border-l-4 border-green-500 bg-green-500/5';
    }
    return '';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Group Tabs */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="flex space-x-1 sm:space-x-2 px-4 sm:px-0 min-w-max sm:min-w-0">
          {season.groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeGroup === group.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      {currentGroup && (
        <div className="card overflow-hidden">
          {/* Table Header - Desktop */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[auto_1fr_repeat(6,auto)] gap-2 sm:gap-4 px-4 py-3 bg-dark-700 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-600">
              <div className="text-center">S/N</div>
              <div>TEAM</div>
              <div className="text-center">P</div>
              <div className="text-center">W</div>
              <div className="text-center">D</div>
              <div className="text-center">L</div>
              <div className="text-center">GD</div>
              <div className="text-center">PTS</div>
            </div>
          </div>

          {/* Table Header - Mobile */}
          <div className="block sm:hidden overflow-x-auto">
            <div className="grid grid-cols-[auto_1fr_repeat(6,auto)] gap-2 px-4 py-3 bg-dark-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-600 min-w-max">
              <div className="text-center sticky left-0 bg-dark-700 z-10">#</div>
              <div className="sticky left-6 bg-dark-700 z-10 min-w-[140px]">Team</div>
              <div className="text-center">P</div>
              <div className="text-center">W</div>
              <div className="text-center">D</div>
              <div className="text-center">L</div>
              <div className="text-center">GD</div>
              <div className="text-center">PTS</div>
            </div>
          </div>

          {/* Table Body */}
          {standings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No standings data available
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="px-4 sm:px-0">
                {standings.map((standing) => {
                  const team = teams.find(t => t.id === standing.team?.id || t.id === standing.teamId);
                  return (
                    <div
                      key={standing.position}
                      className={`grid grid-cols-[auto_1fr_repeat(6,auto)] gap-2 sm:gap-4 px-4 py-3 border-b border-dark-700 last:border-0 hover:bg-dark-700/50 transition-colors ${getPositionColor(standing.position)} min-w-max sm:min-w-0`}
                    >
                      {/* Position - Sticky on mobile */}
                      <div className="text-center font-semibold text-white sticky left-0 bg-dark-800 sm:bg-transparent z-10 sm:static w-6 sm:w-auto">
                        {standing.position}
                      </div>
                      
                      {/* Team - Sticky on mobile */}
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-[140px] max-w-[180px] sm:max-w-[240px] sticky left-6 bg-dark-800 sm:bg-transparent z-10 sm:static">
                        {team?.logo && (
                          <img 
                            src={team.logo} 
                            alt={team?.name || standing.team?.name} 
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0" 
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                        <span 
                          className="font-medium text-white text-sm sm:text-base truncate" 
                          title={team?.name || standing.team?.name || 'Unknown Team'}
                        >
                          {team?.name || standing.team?.name || 'Unknown Team'}
                        </span>
                      </div>
                      
                      {/* Stats */}
                      <div className="text-center text-gray-300 text-xs sm:text-base">{standing.played}</div>
                      <div className="text-center text-gray-300 text-xs sm:text-base">{standing.won}</div>
                      <div className="text-center text-gray-300 text-xs sm:text-base">{standing.drawn}</div>
                      <div className="text-center text-gray-300 text-xs sm:text-base">{standing.lost}</div>
                      <div className={`text-center font-medium text-sm sm:text-base ${
                        standing.goalDifference > 0 ? 'text-green-400' : 
                        standing.goalDifference < 0 ? 'text-red-400' : 
                        'text-gray-300'
                      }`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </div>
                      <div className="text-center font-bold text-primary-400 text-sm sm:text-base">{standing.points}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          {season.knockoutConfig?.qualifiersPerGroup > 0 && (
            <div className="px-4 py-3 bg-dark-700/50 border-t border-dark-600">
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Qualifies for knockout stage</span>
                </div>
                <div className="text-gray-500">•</div>
                <div className="text-gray-400">Top {season.knockoutConfig.qualifiersPerGroup} in each group</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Group Info */}
      {currentGroup && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-400">Teams</span>
            </div>
            <p className="text-lg sm:text-lg font-bold text-white">{currentGroup.teams?.length || 0}</p>
          </div>

          <div className="card p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-accent-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-400">Qualifiers</span>
            </div>
            <p className="text-lg sm:text-lg font-bold text-white">
              {season.knockoutConfig?.qualifiersPerGroup || 0}
            </p>
          </div>

          <div className="card p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-400">Matches</span>
            </div>
            <p className="text-lg sm:text-lg font-bold text-white">
              {standings.reduce((sum, s) => sum + s.played, 0) / 2 || 0}
            </p>
          </div>

          <div className="card p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-400 truncate">Completed</span>
            </div>
            <p className="text-lg sm:text-lg font-bold text-white">
              {standings.every(s => s.played > 0) ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonStandings;
