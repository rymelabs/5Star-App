import React from 'react';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto bg-black pt-16 pb-24">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;