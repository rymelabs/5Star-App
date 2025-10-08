import React, { useState } from 'react';

const TeamAvatar = ({ name = '', logo = '', size = 48, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const initials = (name || '').split(' ').map(s => s.charAt(0)).slice(0,2).join('').toUpperCase() || '?';
  const sizePx = typeof size === 'number' ? size : parseInt(size, 10) || 48;

  const showImage = logo && !imgError && typeof logo === 'string' && logo.trim();

  return (
    <div style={{ width: `${sizePx}px`, height: `${sizePx}px` }} className={`rounded-md ${showImage ? 'p-1.5' : ''} flex items-center justify-center flex-shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="bg-dark-700 w-full h-full rounded-md flex items-center justify-center">
          <span className="text-primary-500 font-bold" style={{ fontSize: Math.max(12, Math.floor(sizePx / 2)) }}>{initials}</span>
        </div>
      )}
    </div>
  );
};

export default TeamAvatar;
