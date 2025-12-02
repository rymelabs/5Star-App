import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Search, User, Bell } from 'lucide-react';

const Header = ({ onSearchClick, onProfileClick }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-dark-700">
      <div className="flex items-center mt-8 justify-between px-4 py-3">
        {/* App Logo */}
        <div className="flex items-center">
          <img 
            src="/Fivescores logo.svg" 
            alt="Fivescores" 
            className="h-12 w-auto"
          />
        </div>

        {/* Right Section - Search, Notifications, and Profile */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <button
            onClick={onSearchClick}
            className="p-2 rounded-full hover:bg-dark-800 transition-colors duration-200"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-full hover:bg-dark-800 transition-colors duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all duration-200"
            aria-label="Profile"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;