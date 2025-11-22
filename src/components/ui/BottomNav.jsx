import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { navItems } from '../navItems';

const BottomNav = () => {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md mx-auto px-6 pb-6">
      <nav className="bg-elevated/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 relative overflow-hidden group">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-center px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300
                ${isActive ? 'text-brand-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                active:scale-90
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Glow */}
                  <div className={`
                    absolute inset-0 nav-item-glow blur-md rounded-xl -z-10 transition-opacity duration-500
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `} />
                  
                  <div className={`relative ${isActive ? 'animate-icon-pop' : ''}`}>
                    <item.icon 
                      className={`w-6 h-6 transition-colors duration-300`} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  
                  {/* Active Dot */}
                  <div className={`
                    absolute bottom-2 w-1 h-1 rounded-full bg-brand-purple shadow-[0_0_8px_rgba(109,40,217,0.8)]
                    transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                    ${isActive ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-2'}
                  `} />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
