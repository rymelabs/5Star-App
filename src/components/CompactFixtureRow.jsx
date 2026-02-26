import React from 'react';
import { formatTime } from '../utils/dateUtils';
import { isFixtureLive } from '../utils/helpers';
import NewTeamAvatar from './NewTeamAvatar';

// Compact fixture row used for season/competition/league fixtures
// Inspired by LiveScore's clean, professional design
const CompactFixtureRow = ({ fixture, onClick }) => {
  const date = new Date(fixture.dateTime);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const timeLabel = formatTime(fixture.dateTime);
  const isCompleted = fixture.status === 'completed';
  const isLive = isFixtureLive(fixture);
  const showPenalties = isCompleted && fixture.penaltyHomeScore !== null && fixture.penaltyHomeScore !== undefined && fixture.penaltyAwayScore !== null && fixture.penaltyAwayScore !== undefined;

  return (
    <div
      onClick={() => onClick && onClick(fixture)}
      className="group flex items-center h-12 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
    >
      {/* Time/Status Column */}
      <div className="w-14 flex-shrink-0 flex flex-col items-center justify-center px-2">
        {isLive ? (
          <span className="text-[11px] font-bold text-red-500 animate-pulse">LIVE</span>
        ) : isCompleted ? (
          <span className="text-[11px] font-semibold text-gray-400">FT</span>
        ) : (
          <>
            <span className="text-[11px] font-semibold text-white">{timeLabel}</span>
            <span className="text-[9px] text-gray-500">{day}/{month}</span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.06]" />

      {/* Teams & Score */}
      <div className="flex-1 flex items-center px-3 min-w-0">
        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
          <span className={`text-[13px] truncate transition-colors ${
            isCompleted && Number(fixture.homeScore) > Number(fixture.awayScore)
              ? 'text-white font-semibold'
              : 'text-gray-300 group-hover:text-white'
          }`}>
            {fixture.homeTeam?.name}
          </span>
          <NewTeamAvatar team={fixture.homeTeam} size={22} />
        </div>

        {/* Score / VS */}
        <div className="mx-3 flex-shrink-0">
          {isCompleted || isLive ? (
            <div className="flex items-center gap-1">
              <span className={`text-[15px] font-bold w-5 text-center ${
                Number(fixture.homeScore) > Number(fixture.awayScore) ? 'text-white' : 'text-gray-400'
              }`}>
                {fixture.homeScore}
              </span>
              <span className="text-[11px] text-gray-600">-</span>
              <span className={`text-[15px] font-bold w-5 text-center ${
                Number(fixture.awayScore) > Number(fixture.homeScore) ? 'text-white' : 'text-gray-400'
              }`}>
                {fixture.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-500 font-medium">vs</span>
          )}
          {showPenalties && (
            <div className="text-[10px] text-purple-200 text-center leading-tight mt-0.5">
              Pens {fixture.penaltyHomeScore}-{fixture.penaltyAwayScore}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 min-w-0 justify-start">
          <NewTeamAvatar team={fixture.awayTeam} size={22} />
          <span className={`text-[13px] truncate transition-colors ${
            isCompleted && Number(fixture.awayScore) > Number(fixture.homeScore)
              ? 'text-white font-semibold'
              : 'text-gray-300 group-hover:text-white'
          }`}>
            {fixture.awayTeam?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompactFixtureRow;
