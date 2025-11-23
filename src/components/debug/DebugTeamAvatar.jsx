import React, { useState } from 'react';

const DebugTeamAvatar = ({ homeTeam, awayTeam }) => {
  const [isOpen, setIsOpen] = useState(false);

  const extractInitial = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const teams = [
    { label: 'Home', team: homeTeam },
    { label: 'Away', team: awayTeam }
  ];

  return (
    <div className="fixed bottom-24 right-4 z-[100] text-xs">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-2 rounded-lg bg-brand-purple text-white font-semibold shadow-lg shadow-brand-purple/40 hover:bg-brand-purple/80 transition-colors"
      >
        {isOpen ? 'Hide' : 'Show'} Avatar Debug
      </button>

      {isOpen && (
        <div className="mt-2 w-64 rounded-2xl bg-black/80 border border-white/10 p-4 backdrop-blur-md space-y-3 shadow-xl">
          <p className="text-white text-sm font-bold">Team Initials</p>
          {teams.map(({ label, team }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-gray-400 uppercase tracking-widest text-[10px]">{label}</span>
              <div className="flex-1 text-right">
                <span className="text-white text-sm font-semibold">
                  {team?.name || 'Unknown'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center font-black text-white bg-white/5">
                {extractInitial(team?.name)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugTeamAvatar;
