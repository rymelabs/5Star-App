import React, { memo } from 'react';
import { MapPin } from 'lucide-react';
import NewTeamAvatar from './NewTeamAvatar';
import { isFixtureLive } from '../utils/helpers';
import { formatDateTime } from '../utils/dateUtils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import FixtureCardDesktop from './ui/FixtureCardDesktop';

const FixtureCard = memo(({ fixture = {}, onClick = () => {}, compact = false, variant = 'card' }) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Use desktop variant only if not in compact mode and on desktop screen
  if (isDesktop && !compact && variant === 'card') {
    return <FixtureCardDesktop fixture={fixture} onClick={onClick} />;
  }

  const home = fixture.homeTeam || fixture.homeTeamId || {};
  const away = fixture.awayTeam || fixture.awayTeamId || {};
  const status = fixture.status || (isFixtureLive(fixture) ? 'live' : 'scheduled');
  const isLive = status === 'live' || isFixtureLive(fixture);
  const isCompleted = status === 'completed' || status === 'finished';
  const isRow = variant === 'row';

  const scoreForDisplay = (value) => (value === '' || value === null || value === undefined ? 0 : value);
  const homeScoreDisplay = (isLive || isCompleted) ? scoreForDisplay(fixture.homeScore) : fixture.homeScore;
  const awayScoreDisplay = (isLive || isCompleted) ? scoreForDisplay(fixture.awayScore) : fixture.awayScore;

  // Format date/time using project helper
  const dateLabel = fixture.dateTime ? formatDateTime(fixture.dateTime) : '';

  const containerClasses = isRow
    ? `group relative w-full overflow-hidden border-b border-white/5 last:border-0 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors ${compact ? 'p-1.5' : 'p-2'}`
    : `group relative w-full overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all hover:border-white/10 hover:bg-white/[0.07] active:scale-[0.99] ${compact ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4'}`;

  const containerStyle = isRow
    ? {}
    : { backgroundColor: '#0b1020', borderRadius: compact ? '12px' : '20px' };

  return (
    <button
      onClick={() => onClick(fixture)}
      className={containerClasses}
      style={containerStyle}
    >
      {/* Background Gradients - Only for card variant */}
      {!isRow && (
        <>
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand-purple/10 blur-3xl transition-opacity group-hover:opacity-75" />
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-opacity group-hover:opacity-75" />
        </>
      )}

      <div className="relative">
        {/* Header: Date/Venue - Hide in row mode unless live */}
        {!isRow && (
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
        )}

        {/* Row Mode: Time/Status Indicator */}
        {isRow && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-12 text-center text-[10px] font-medium text-white/40">
             {isLive ? (
                <span className="text-red-400 animate-pulse">
                  {fixture.liveData?.minute ? `${fixture.liveData.minute}'` : 'LIVE'}
                </span>
              ) : isCompleted ? (
                <span>FT</span>
              ) : (
                <span>{fixture.dateTime ? new Date(fixture.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              )}
          </div>
        )}

        {/* Teams & Score */}
        <div className={`grid grid-cols-[1fr_auto_1fr] items-center ${
          isRow ? 'pl-12 gap-2' : (compact ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-4')
        }`}>
          {/* Home Team */}
          <div className={`flex items-center gap-2 ${isRow ? 'justify-end text-right' : 'flex-col text-center sm:flex-row sm:justify-end sm:text-right'}`}>
            <span className={`truncate w-full ${
              isRow ? 'text-[11px] order-1 font-normal' : (compact ? 'text-[10px] sm:text-xs order-2 sm:order-1 font-bold' : 'text-xs sm:text-sm order-2 sm:order-1 font-bold')
            }`}>{home?.name || 'Home'}</span>
            <NewTeamAvatar 
              team={home}
              size={isRow ? 20 : (compact ? 32 : 48)} 
              className={`flex-shrink-0 ${
                isRow ? 'h-5 w-5 order-2' : (compact ? 'h-8 w-8 sm:h-9 sm:w-9 order-1 sm:order-2' : 'h-10 w-10 sm:h-12 sm:w-12 order-1 sm:order-2')
              }`} 
            />
          </div>

          {/* Score / VS */}
          <div className={`flex flex-col items-center justify-center rounded-lg ${
            isRow ? 'bg-transparent min-w-[30px] px-0' : (compact ? 'bg-black/20 backdrop-blur-sm min-w-[40px] sm:min-w-[50px] px-1.5 py-1 sm:px-2 sm:py-1.5' : 'bg-black/20 backdrop-blur-sm min-w-[50px] sm:min-w-[60px] px-2 py-1.5 sm:px-3 sm:py-2')
          }`}>
            {isLive || isCompleted ? (
              <div className={`flex items-center font-bold text-white ${
                isRow ? 'gap-1 text-sm' : (compact ? 'gap-1 text-sm sm:text-lg' : 'gap-1.5 sm:gap-2 text-lg sm:text-2xl')
              }`}>
                <span>{homeScoreDisplay}</span>
                {!isRow && <span className="text-white/20">-</span>}
                {isRow && <span className="text-white/20 text-[10px] mx-0.5">-</span>}
                <span>{awayScoreDisplay}</span>
              </div>
            ) : (
              <span className={`font-bold text-white/20 ${
                isRow ? 'text-xs' : (compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg')
              }`}>VS</span>
            )}
            {!isRow && isCompleted && <span className="text-[8px] sm:text-[10px] font-medium uppercase text-white/40">FT</span>}
          </div>

          {/* Away Team */}
          <div className={`flex items-center gap-2 ${isRow ? 'justify-start text-left' : 'flex-col text-center sm:flex-row sm:justify-start sm:text-left'}`}>
            <NewTeamAvatar 
              team={away}
              size={isRow ? 20 : (compact ? 32 : 48)} 
              className={`flex-shrink-0 ${
                isRow ? 'h-5 w-5' : (compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-12 sm:w-12')
              }`} 
            />
            <span className={`truncate w-full ${
              isRow ? 'text-[11px] font-normal' : (compact ? 'text-[10px] sm:text-xs font-bold' : 'text-xs sm:text-sm font-bold')
            }`}>{away?.name || 'Away'}</span>
          </div>
        </div>
      </div>
    </button>
  );
});

FixtureCard.displayName = 'FixtureCard';

export default FixtureCard;
