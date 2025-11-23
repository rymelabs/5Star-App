import React from 'react';
import { MapPin, Bell, Share2, ChevronRight } from 'lucide-react';
import NewTeamAvatar from '../NewTeamAvatar';
import { isFixtureLive } from '../../utils/helpers';
import { formatDateTime, formatTime } from '../../utils/dateUtils';

const FixtureCardDesktop = ({ fixture = {}, onClick = () => {} }) => {
  const home = fixture.homeTeam || fixture.homeTeamId || {};
  const away = fixture.awayTeam || fixture.awayTeamId || {};
  const status = fixture.status || (isFixtureLive(fixture) ? 'live' : 'scheduled');
  const isLive = status === 'live' || isFixtureLive(fixture);
  const isCompleted = status === 'completed' || status === 'finished';

  const dateLabel = fixture.dateTime ? formatDateTime(fixture.dateTime) : '';
  const timeLabel = fixture.dateTime ? formatTime(fixture.dateTime) : '';

  return (
    <div
      onClick={() => onClick(fixture)}
      className="group relative w-full overflow-hidden rounded-xl border border-white/5 bg-[#0b1020] hover:bg-[#111629] transition-all duration-200 cursor-pointer"
    >
      {/* Hover Actions */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button 
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); /* Add notify logic */ }}
        >
          <Bell className="w-4 h-4" />
        </button>
        <button 
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); /* Add share logic */ }}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center p-4 gap-6">
        {/* Status/Time Column */}
        <div className="w-24 flex flex-col items-center justify-center border-r border-white/5 pr-6">
          {isLive ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-red-500 font-bold text-sm animate-pulse">LIVE</span>
              <span className="text-red-400 text-xs font-medium">{fixture.liveData?.minute ? `${fixture.liveData.minute}'` : 'ONGOING'}</span>
            </div>
          ) : isCompleted ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-gray-400 font-bold text-sm">FT</span>
              <span className="text-gray-500 text-xs">{dateLabel}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-white font-bold text-lg">{timeLabel}</span>
              <span className="text-gray-500 text-xs text-center">{dateLabel}</span>
            </div>
          )}
        </div>

        {/* Match Info */}
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          {/* Home Team */}
          <div className="flex items-center justify-end gap-4">
            <span className="text-lg font-bold text-white text-right">{home?.name || 'Home'}</span>
            <NewTeamAvatar team={home} size={40} />
          </div>

          {/* Score */}
          <div className="flex items-center justify-center min-w-[80px]">
            {isLive || isCompleted ? (
              <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                <span className={`text-2xl font-bold ${isLive ? 'text-brand-purple' : 'text-white'}`}>
                  {fixture.homeScore ?? 0}
                </span>
                <span className="text-gray-600 font-medium">-</span>
                <span className={`text-2xl font-bold ${isLive ? 'text-brand-purple' : 'text-white'}`}>
                  {fixture.awayScore ?? 0}
                </span>
              </div>
            ) : (
              <div className="bg-white/5 px-3 py-1 rounded text-sm font-bold text-gray-400">
                VS
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start gap-4">
            <NewTeamAvatar team={away} size={40} />
            <span className="text-lg font-bold text-white text-left">{away?.name || 'Away'}</span>
          </div>
        </div>

        {/* Venue/Competition (Hidden on smaller desktop, visible on large) */}
        <div className="hidden xl:flex flex-col items-end justify-center w-40 pl-6 border-l border-white/5 text-right">
          <span className="text-brand-purple font-bold text-xs uppercase tracking-wider mb-1">
            {fixture.competition || 'League Match'}
          </span>
          {fixture.venue && (
            <div className="flex items-center gap-1 text-gray-500">
              <span className="text-xs truncate max-w-[140px]">{fixture.venue}</span>
              <MapPin className="w-3 h-3" />
            </div>
          )}
        </div>
        
        {/* Arrow for interaction hint */}
        <div className="pl-4 text-gray-600 group-hover:text-brand-purple transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default FixtureCardDesktop;
