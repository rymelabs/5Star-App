import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchModal from './SearchModal';
import ProfileModal from './ProfileModal';

const Header = () => {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-[26px] border-b border-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <img 
            src="/5StarLogo.svg" 
            alt="5Star" 
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