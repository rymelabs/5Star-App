import React, { useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { navItems } from '../navItems';

const BottomNav = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Get current page index
  const getCurrentIndex = () => {
    const index = navItems.findIndex(item => {
      if (item.path === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.path);
    });
    return index === -1 ? 0 : index;
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum swipe distance to trigger navigation

    if (Math.abs(swipeDistance) < minSwipeDistance) return;

    const currentIndex = getCurrentIndex();

    if (swipeDistance > 0) {
      // Swiped left - go to next page
      const nextIndex = Math.min(currentIndex + 1, navItems.length - 1);
      if (nextIndex !== currentIndex) {
        navigate(navItems[nextIndex].path);
      }
    } else {
      // Swiped right - go to previous page
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        navigate(navItems[prevIndex].path);
      }
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto px-4 pb-6">
      <nav 
        className="bg-elevated/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 relative overflow-hidden group touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
