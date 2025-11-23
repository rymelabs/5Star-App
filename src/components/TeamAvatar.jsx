import React, { useState } from 'react';

const TeamAvatar = ({ team, name = '', logo = '', size = 48, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  
  // Support both team object and individual name/logo props
  const teamName = team?.name || name || '';
  const teamLogo = team?.logo || logo || '';
  
  // Get first two initials from team name (or one if single word)
  const getInitials = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };
  
  const initials = getInitials(teamName);
  const sizePx = typeof size === 'number' ? size : 
                 size === 'xs' ? 32 : 
                 size === 'sm' ? 40 : 
                 size === 'md' ? 48 : 
                 size === 'lg' ? 64 : 
                 parseInt(size, 10) || 48;

  const showImage = teamLogo && !imgError && typeof teamLogo === 'string' && teamLogo.trim();

  // Dynamic font size based on avatar size and initials length
  const fontSize = initials.length === 1 
    ? Math.max(14, Math.floor(sizePx * 0.5))
    : Math.max(12, Math.floor(sizePx * 0.38));

  return (
    <div 
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }} 
      className={`
        relative group flex-shrink-0 rounded-full 
        flex items-center justify-center
        transition-all duration-300
        ${showImage ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.02] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] ring-1 ring-white/10 backdrop-blur-sm' : ''}
        ${className}
      `}
    >
      {/* Inner glow effect for images */}
      {showImage && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

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
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(139,92,246,0.5),inset_0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden ring-2 ring-purple-500/30">
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-full" />
          
          {/* Animated glow on hover */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-purple/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Initials */}
          <span 
            className="relative font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] select-none z-10" 
            style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

export default TeamAvatar;
