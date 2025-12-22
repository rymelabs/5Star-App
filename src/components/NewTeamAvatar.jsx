import React, { useState, memo } from 'react';

const sizeToPixels = (size) => {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'xs':
      return 32;
    case 'sm':
      return 40;
    case 'md':
      return 48;
    case 'lg':
      return 64;
    default:
      return Number.parseInt(size, 10) || 48;
  }
};

const getInitial = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
};

const NewTeamAvatar = memo(({ team, name = '', size = 48, className = '', useThumbnail = true }) => {
  const [imgError, setImgError] = useState(false);
  const teamName = team?.name || name;
  // Normalize team logo: check multiple possible property names
  const teamLogoFull = team?.logo || team?.profilePicture || team?.image || team?.imageUrl || team?.logoUrl || team?.crest || team?.badge || '';
  const teamLogoThumb = team?.logoThumbUrl || '';
  
  // Use thumbnail for small sizes (< 80px) if available, otherwise use full logo
  // Falls back to full logo if thumbnail is missing
  const sizePx = sizeToPixels(size);
  const shouldUseThumbnail = useThumbnail && sizePx <= 80 && teamLogoThumb;
  const teamLogo = shouldUseThumbnail ? teamLogoThumb : teamLogoFull;
  
  const initial = getInitial(teamName);
  const fontSize = Math.max(14, Math.floor(sizePx * 0.55));
  const showImage = Boolean(teamLogo) && !imgError;

  return (
    <div
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      className={`flex items-center justify-center rounded-full text-white font-black tracking-wide shadow-[0_10px_25px_rgba(0,0,0,0.35)] ring-1 ring-white/15 overflow-hidden ${className} ${
        showImage ? 'bg-app' : 'bg-gradient-to-br from-brand-purple to-brand-purple/70'
      }`}
    >
      {showImage ? (
        <img
          src={teamLogo}
          alt={teamName}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={{ fontSize: `${fontSize}px`, lineHeight: 1 }} className="select-none">
          {initial}
        </span>
      )}
    </div>
  );
});

NewTeamAvatar.displayName = 'NewTeamAvatar';

export default NewTeamAvatar;
