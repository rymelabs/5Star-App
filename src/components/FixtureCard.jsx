import React from 'react';
import TeamAvatar from './TeamAvatar';
import { isFixtureLive } from '../utils/helpers';
import { formatDateTime } from '../utils/dateUtils';

const FixtureCard = ({ fixture = {}, onClick = () => {} }) => {
  const home = fixture.homeTeam || fixture.homeTeamId || {};
  const away = fixture.awayTeam || fixture.awayTeamId || {};
  const status = fixture.status || (isFixtureLive(fixture) ? 'live' : 'scheduled');

  // Format date/time using project helper
  const dateLabel = fixture.dateTime ? formatDateTime(fixture.dateTime) : '';

  return (
    <button
      onClick={() => onClick(fixture)}
      aria-label={`Fixture: ${home?.name || 'Home'} vs ${away?.name || 'Away'} ${dateLabel} ${status === 'live' ? 'Live' : ''}`}
      className={`w-full text-left rounded-2xl p-3 border border-dark-700 bg-gradient-to-br from-dark-900/60 to-dark-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition transform hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex items-center gap-3 min-w-0">
          <TeamAvatar name={home?.name} logo={home?.logo} size={44} className="flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-gray-400">Home</div>
            <div className="font-semibold text-white truncate" title={home?.name}>{home?.name || 'TBD'}</div>
          </div>
        </div>

        {/* Center: Score / Time / Status */}
        <div className="flex flex-col items-center justify-center w-36">
          {status === 'completed' ? (
            <>
              <div className="text-lg font-bold text-white">{fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">FT</div>
            </>
          ) : status === 'live' || isFixtureLive(fixture) ? (
            <>
              <div className="text-lg font-bold text-white">{fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}</div>
              <div className="mt-1 inline-flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">LIVE</span>
                <span className="text-xs text-gray-400">{fixture.liveData?.minute ? `${fixture.liveData.minute}'` : null}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-primary-500">VS</div>
              <div className="text-xs text-gray-400 mt-1">{dateLabel || 'TBD'}</div>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-3 min-w-0 justify-end">
          <div className="flex-shrink-0 relative">
            {/* Decorative behind-logo */}
            {away?.logo && (
              <img src={away.logo} alt="" aria-hidden className="absolute right-0 top-1/2 transform -translate-y-1/2 w-14 h-14 opacity-10 pointer-events-none rounded-full" />
            )}
            <TeamAvatar name={away?.name} logo={away?.logo} size={44} className="relative z-10" />
          </div>
          <div className="min-w-0 text-right">
            <div className="text-sm text-gray-400">Away</div>
            <div className="font-semibold text-white truncate" title={away?.name}>{away?.name || 'TBD'}</div>
          </div>
        </div>
      </div>

      {/* Venue */}
      {fixture.venue && (
        <div className="mt-3 text-xs text-gray-400">{fixture.venue}</div>
      )}
    </button>
  );
};

export default FixtureCard;
