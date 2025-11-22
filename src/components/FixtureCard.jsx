import React from 'react';
import { MapPin } from 'lucide-react';
import TeamAvatar from './TeamAvatar';
import { isFixtureLive } from '../utils/helpers';
import { formatDateTime } from '../utils/dateUtils';

const FixtureCard = ({ fixture = {}, onClick = () => {}, compact = false }) => {
  const home = fixture.homeTeam || fixture.homeTeamId || {};
  const away = fixture.awayTeam || fixture.awayTeamId || {};
  const status = fixture.status || (isFixtureLive(fixture) ? 'live' : 'scheduled');
  const isLive = status === 'live' || isFixtureLive(fixture);
  const isCompleted = status === 'completed' || status === 'finished';

  // Format date/time using project helper
  const dateLabel = fixture.dateTime ? formatDateTime(fixture.dateTime) : '';

  return (
    <button
      onClick={() => onClick(fixture)}
      className={`group relative w-full overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all hover:border-white/10 hover:bg-white/[0.07] active:scale-[0.99] ${
        compact ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4'
      }`}
      style={{ backgroundColor: '#0b1020', borderRadius: compact ? '12px' : '20px' }}
    >
      {/* Background Gradients */}
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand-purple/10 blur-3xl transition-opacity group-hover:opacity-75" />
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-opacity group-hover:opacity-75" />

      <div className="relative">
        {/* Header: Date/Venue */}
        <div className={`flex items-center justify-between font-medium uppercase tracking-wider text-white/40 ${
          compact ? 'mb-2 text-[9px]' : 'mb-3 sm:mb-4 text-[10px]'
        }`}>
          <div className="flex items-center gap-1">
            {fixture.venue && (
              <>
                <MapPin className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{fixture.venue}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE {fixture.liveData?.minute && `• ${fixture.liveData.minute}'`}
              </span>
            ) : (
              <span>{dateLabel}</span>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className={`grid grid-cols-[1fr_auto_1fr] items-center ${compact ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-4'}`}>
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-end sm:text-right">
            <span className={`font-bold text-white truncate w-full order-2 sm:order-1 ${
              compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
            }`}>{home?.name || 'Home'}</span>
            <TeamAvatar 
              name={home?.name} 
              logo={home?.logo} 
              size={compact ? 32 : 48} 
              className={`flex-shrink-0 order-1 sm:order-2 ${
                compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-12 sm:w-12'
              }`} 
            />
          </div>

          {/* Score / VS */}
          <div className={`flex flex-col items-center justify-center rounded-lg bg-black/20 backdrop-blur-sm ${
            compact ? 'min-w-[40px] sm:min-w-[50px] px-1.5 py-1 sm:px-2 sm:py-1.5' : 'min-w-[50px] sm:min-w-[60px] px-2 py-1.5 sm:px-3 sm:py-2'
          }`}>
            {isLive || isCompleted ? (
              <div className={`flex items-center font-bold text-white ${
                compact ? 'gap-1 text-sm sm:text-lg' : 'gap-1.5 sm:gap-2 text-lg sm:text-2xl'
              }`}>
                <span>{fixture.homeScore ?? 0}</span>
                <span className="text-white/20">-</span>
                <span>{fixture.awayScore ?? 0}</span>
              </div>
            ) : (
              <span className={`font-bold text-white/20 ${
                compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}>VS</span>
            )}
            {isCompleted && <span className="text-[8px] sm:text-[10px] font-medium uppercase text-white/40">FT</span>}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-start sm:text-left">
            <TeamAvatar 
              name={away?.name} 
              logo={away?.logo} 
              size={compact ? 32 : 48} 
              className={`flex-shrink-0 ${
                compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-12 sm:w-12'
              }`} 
            />
            <span className={`font-bold text-white truncate w-full ${
              compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
            }`}>{away?.name || 'Away'}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default FixtureCard;
