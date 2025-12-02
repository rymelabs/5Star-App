import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Newspaper } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'latest',
      label: 'Latest',
      icon: Home,
      path: '/',
    },
    {
      id: 'fixtures',
      label: 'Fixtures',
      icon: Calendar,
      path: '/fixtures',
    },
    {
      id: 'news',
      label: 'News',
      icon: Newspaper,
      path: '/news',
    },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[70%] max-w-xs z-50 bg-black/30 backdrop-blur-md border-t border-orange-500 rounded-full">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`nav-item ${active ? 'active' : ''}`}
              aria-label={item.label}
            >
              <Icon className={`w-5 h-5 mb-1 ${active ? 'text-primary-500' : 'text-gray-400'}`} />
              <span className={`text-xs ${active ? 'text-primary-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;