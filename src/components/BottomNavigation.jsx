import React from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';

const BottomNavigation = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="bg-black/30 backdrop-blur-[26px] border border-primary-500 rounded-2xl mx-4 px-4 py-3">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;