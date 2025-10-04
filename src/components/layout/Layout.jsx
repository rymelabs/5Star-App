import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import SearchModal from '../ui/SearchModal';
import ProfileModal from '../ui/ProfileModal';

const Layout = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleSearchClose = () => {
    setShowSearchModal(false);
  };

  const handleProfileClose = () => {
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <Header onSearchClick={handleSearchClick} onProfileClick={handleProfileClick} />
      
      {/* Main Content */}
      <main className="pt-16 pb-20">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Modals */}
      {showSearchModal && (
        <SearchModal onClose={handleSearchClose} />
      )}
      
      {showProfileModal && (
        <ProfileModal onClose={handleProfileClose} />
      )}
    </div>
  );
};

export default Layout;