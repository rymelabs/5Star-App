import React from 'react';

const PillChip = ({ 
  label, 
  active = false, 
  variant = 'solid', // solid, outline, ghost
  tone = 'neutral', // neutral, primary, success, danger
  size = 'md', // sm, md
  onClick,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 whitespace-nowrap';
  
  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-4 py-1.5 text-sm'
  };

  const variants = {
    solid: {
      neutral: active ? 'bg-white text-app' : 'bg-elevated-soft text-gray-400 hover:bg-white/10 hover:text-white',
      primary: active ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/25' : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20',
      success: active ? 'bg-accent-green text-white' : 'bg-accent-green/10 text-accent-green',
      danger: active ? 'bg-brand-red text-white' : 'bg-brand-red/10 text-brand-red',
    },
    outline: {
      neutral: active ? 'border border-white text-white' : 'border border-white/10 text-gray-400 hover:border-white/30 hover:text-white',
      primary: active ? 'border border-brand-purple text-brand-purple' : 'border border-brand-purple/30 text-brand-purple/70 hover:border-brand-purple hover:text-brand-purple',
    }
  };

  // Fallback for ghost if needed, or just map to solid/outline logic
  const style = variants[variant]?.[tone] || variants.solid.neutral;

  return (
    <button
      className={`${baseClasses} ${sizes[size]} ${style} ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default PillChip;
