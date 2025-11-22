import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import SearchModal from '../ui/SearchModal';
import ProfileModal from '../ProfileModal';

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
      <div className="flex items-center justify-between px-4 py-3">
        <img 
          src="/5StarLogo.svg" 
          alt="5Star" 
          className="h-8 w-auto drop-shadow-[0_0_10px_rgba(109,40,217,0.5)]"
        />
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-gray-400 hover:text-brand-purple hover:bg-white/5 rounded-full transition-all"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNotificationClick}
            className="relative p-2 text-gray-400 hover:text-brand-purple hover:bg-white/5 rounded-full transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-brand-red rounded-full shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setIsProfileOpen(true)}
            className="ml-1 w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-brand-purple transition-colors"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-elevated flex items-center justify-center text-xs font-bold text-brand-purple">
                {user?.email?.[0]?.toUpperCase() || 'G'}
              </div>
            )}
          </button>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Header;
