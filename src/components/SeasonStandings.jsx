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
      return 'bg-green-500/5';
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
        <div className="card p-4 sm:p-6">
          {/* Table */}
          {standings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No standings data available
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                    <tr>
                      <th className="text-left py-2 px-2 sm:px-0 sticky left-0 bg-dark-700 sm:bg-transparent z-10">Pos</th>
                      <th className="text-left py-2 px-2 sticky left-8 sm:left-0 bg-dark-700 sm:bg-transparent z-10 min-w-[120px] sm:min-w-0">Team</th>
                      <th className="text-center py-2 px-1 sm:px-2">P</th>
                      <th className="text-center py-2 px-1 sm:px-2">W</th>
                      <th className="text-center py-2 px-1 sm:px-2">D</th>
                      <th className="text-center py-2 px-1 sm:px-2">L</th>
                      <th className="text-center py-2 px-1 sm:px-2">GD</th>
                      <th className="text-center py-2 px-1 sm:px-2">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm">
                    {standings.map((standing) => {
                      const team = teams.find(t => t.id === standing.team?.id || t.id === standing.teamId);
                      const isQualifier = standing.position <= (season.knockoutConfig?.qualifiersPerGroup || 2);
                      return (
                        <tr 
                          key={standing.position} 
                          className={`border-b border-gray-700/50 hover:bg-dark-700/50 transition-colors ${getPositionColor(standing.position)}`}
                        >
                          <td className="py-3 px-2 sm:px-0 sticky left-0 bg-dark-700 sm:bg-transparent z-10">
                            <span className={`font-semibold ${isQualifier ? 'text-green-400' : 'text-white'}`}>
                              {standing.position}
                            </span>
                          </td>
                          <td className="py-3 px-2 sticky left-8 sm:left-0 bg-dark-700 sm:bg-transparent z-10">
                            <div className="flex items-center space-x-2 min-w-[120px] sm:min-w-0 max-w-[140px] sm:max-w-[200px]">
                              {team?.logo && (
                                <img
                                  src={team.logo}
                                  alt={team?.name || standing.team?.name}
                                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <span className="text-white truncate" title={team?.name || standing.team?.name || 'Unknown Team'}>
                                {team?.name || standing.team?.name || 'Unknown Team'}
                              </span>
                            </div>
                          </td>
                          <td className="text-center text-gray-300 px-1 sm:px-2">{standing.played}</td>
                          <td className="text-center text-gray-300 px-1 sm:px-2">{standing.won}</td>
                          <td className="text-center text-gray-300 px-1 sm:px-2">{standing.drawn}</td>
                          <td className="text-center text-gray-300 px-1 sm:px-2">{standing.lost}</td>
                          <td className={`text-center px-1 sm:px-2 ${
                            standing.goalDifference > 0 ? 'text-green-400' : 
                            standing.goalDifference < 0 ? 'text-red-400' : 
                            'text-gray-300'
                          }`}>
                            {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                          </td>
                          <td className="text-center font-semibold text-white px-1 sm:px-2">{standing.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
