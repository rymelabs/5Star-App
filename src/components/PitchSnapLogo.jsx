import React, { useId } from 'react';

export function PitchSnapLogo({ className = '', showText = true }) {
  const instanceId = useId().replace(/:/g, '');
  const gradientId = `${instanceId}-ios-pitch-gradient`;
  const playShadowId = `${instanceId}-play-shadow`;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative w-12 h-12 shrink-0 group">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-md overflow-visible transition-transform group-hover:scale-105 duration-300 ease-out"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>
            <filter id={playShadowId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.2)" />
            </filter>
          </defs>

          <path
            d="M60 0 C 24 0 0 24 0 60 C 0 96 24 120 60 120 C 96 120 120 96 120 60 C 120 24 96 0 60 0 Z"
            fill={`url(#${gradientId})`}
          />

          <g stroke="white" strokeWidth="2.5" fill="none" opacity="0.6">
            <rect x="16" y="28" width="88" height="64" rx="5" />
            <line x1="60" y1="28" x2="60" y2="42" stroke="white" strokeWidth="2.5" />
            <line x1="60" y1="78" x2="60" y2="92" stroke="white" strokeWidth="2.5" />
            <path d="M16 46 H 24 V 74 H 16" />
            <path d="M104 46 H 96 V 74 H 104" />
          </g>

          <path
            d="M 54 44 L 78 60 L 54 76 Z"
            fill="white"
            stroke="white"
            strokeWidth="3"
            strokeLinejoin="round"
            filter={`url(#${playShadowId})`}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className="font-semibold tracking-tight text-white font-sans leading-none"
            style={{ fontSize: '4.5rem' }}
          >
            PitchSnap
          </span>
        </div>
      )}
    </div>
  );
}

export default PitchSnapLogo;
