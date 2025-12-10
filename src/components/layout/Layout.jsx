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
      {/* ULTRA VISIBLE TEST - If you see this, React is working */}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 99999,
        backgroundColor: '#eab308',
        color: '#000',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(234, 179, 8, 0.8)',
        fontWeight: 'bold',
        fontSize: '18px',
        border: '3px solid white'
      }}>
        <div style={{marginBottom: '10px', fontSize: '14px'}}>🎯 TAILWIND TEST</div>
        <div className="sm:hidden">📱 XS (&lt;640px)</div>
        <div className="hidden sm:block md:hidden">📱 SM (≥640px)</div>
        <div className="hidden md:block lg:hidden">💻 MD (≥768px)</div>
        <div className="hidden lg:block xl:hidden">🖥️ LG (≥1024px)</div>
        <div className="hidden xl:block 2xl:hidden">🖥️ XL (≥1280px)</div>
        <div className="hidden 2xl:block">🖥️ 2XL (≥1536px)</div>
      </div>
      
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
        <SearchModal isOpen={showSearchModal} onClose={handleSearchClose} />
      )}
      
      {showProfileModal && (
        <ProfileModal isOpen={showProfileModal} onClose={handleProfileClose} />
      )}
    </div>
  );
};

export default Layout;
