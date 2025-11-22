import React, { useState } from 'react';

const TeamAvatar = ({ team, name = '', logo = '', size = 48, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  
  // Support both team object and individual name/logo props
  const teamName = team?.name || name || '';
  const teamLogo = team?.logo || logo || '';
  
  // Get single initial from team name
  const getInitial = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return '?';
    return name.trim().charAt(0).toUpperCase();
  };
  
  const initial = getInitial(teamName);
  const sizePx = typeof size === 'number' ? size : 
                 size === 'xs' ? 32 : 
                 size === 'sm' ? 40 : 
                 size === 'md' ? 48 : 
                 size === 'lg' ? 64 : 
                 parseInt(size, 10) || 48;

  const showImage = teamLogo && !imgError && typeof teamLogo === 'string' && teamLogo.trim();

  return (
    <div 
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }} 
      className={`
        relative group flex-shrink-0 rounded-full 
        flex items-center justify-center
        bg-gradient-to-b from-white/[0.12] to-white/[0.02]
        shadow-[0_8px_16px_-4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]
        ring-1 ring-white/10 backdrop-blur-sm
        ${className}
      `}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {showImage ? (
        <div className="relative w-full h-full p-[15%] flex items-center justify-center">
           {/* Logo shadow/glow for depth */}
           <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-75 opacity-50" />
           
          <img
            src={teamLogo}
            alt={teamName}
            className="relative w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transform transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-purple via-indigo-900 to-slate-900 flex items-center justify-center shadow-inner">
          <span 
            className="font-bold text-white/90 tracking-wider drop-shadow-md" 
            style={{ fontSize: Math.max(12, Math.floor(sizePx / 2)) }}
          >
            {initial}
          </span>
        </div>
      )}
    </div>
  );
};

export default TeamAvatar;
