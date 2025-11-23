import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Trophy, Star, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { useFootball } from '../../context/FootballContext';
import TeamAvatar from '../../components/TeamAvatar';

const LeftSidebar = () => {
  const { followedTeams } = useFootball();

  const quickFilters = [
    { icon: Clock, label: 'Live Scores', path: '/fixtures?status=live', color: 'text-red-500' },
    { icon: Calendar, label: 'Today', path: '/fixtures?status=today', color: 'text-blue-500' },
    { icon: TrendingUp, label: 'Upcoming', path: '/fixtures?status=upcoming', color: 'text-brand-purple' },
    { icon: CheckCircle2, label: 'Results', path: '/fixtures?status=completed', color: 'text-green-500' },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Quick Filters */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
          Quick Filters
        </h3>
        <div className="space-y-1">
          {quickFilters.map((filter) => (
            <NavLink
              key={filter.label}
              to={filter.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <filter.icon className={`w-4 h-4 ${filter.color}`} />
              <span className="text-sm font-medium">{filter.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Followed Teams */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            My Teams
          </h3>
          <span className="text-xs text-brand-purple font-bold bg-brand-purple/10 px-2 py-0.5 rounded-full">
            {followedTeams?.length || 0}
          </span>
        </div>
        
        <div className="overflow-y-auto hide-scrollbar space-y-1 flex-1 -mx-2 px-2">
          {followedTeams && followedTeams.length > 0 ? (
            followedTeams.map((team) => (
              <NavLink
                key={team.id}
                to={`/teams/${team.id}`}
              >
                {({ isActive }) => (
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    <TeamAvatar name={team.name} logo={team.logo} size={24} />
                    <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {team.name}
                    </span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-purple" />}
                  </div>
                )}
              </NavLink>
            ))
          ) : (
            <div className="text-center py-8 px-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Star className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 mb-3">Follow teams to see them here</p>
              <NavLink 
                to="/teams" 
                className="text-xs font-bold text-brand-purple hover:text-white transition-colors"
              >
                Browse Teams
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Competitions Link */}
      <div className="bg-gradient-to-br from-brand-purple/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-purple rounded-lg">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Leagues</h4>
            <p className="text-xs text-gray-400">View all competitions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
