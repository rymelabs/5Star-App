import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import SearchModal from './ui/SearchModal';
import ProfileModal from './ProfileModal';

const Header = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-[26px] border-b border-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <img 
            src="/Fivescores logo.svg" 
            alt="Fivescores" 
            className="h-8 w-auto"
          />
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            >
              {user?.name?.[0] || 'U'}
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <SearchModal onClose={() => setIsSearchOpen(false)} />
      )}
      
      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}
    </>
  );
};

export default Header;