import React from 'react';

const SurfaceCard = ({ 
  children, 
  className = '', 
  padding = 'md', 
  elevated = false, 
  interactive = false,
  onClick,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const baseClasses = 'bg-elevated rounded-2xl border border-white/5 transition-all duration-200';
  const elevationClass = elevated ? 'shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'shadow-sm';
  const interactiveClass = interactive ? 'cursor-pointer hover:bg-elevated-soft hover:scale-[1.01] active:scale-[0.99]' : '';

  return (
    <div 
      className={`${baseClasses} ${paddingClasses[padding]} ${elevationClass} ${interactiveClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default SurfaceCard;
