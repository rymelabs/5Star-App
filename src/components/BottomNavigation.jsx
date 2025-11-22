import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { navItems } from './navItems';

const BottomNavigation = () => {
  const { t } = useLanguage();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 px-4">
      <nav className="bg-brand-purple/90 backdrop-blur-[26px] border border-white/10 rounded-2xl py-3 mx-4">
        <div className="flex justify-around px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item group ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="nav-icon w-5 h-5 mb-1 flex-shrink-0" />
              <span className="nav-label text-xs font-medium tracking-tight truncate max-w-full block">
                {t(item.labelKey)}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;