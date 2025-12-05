import React from 'react';
import LeftSidebar from '../desktop/LeftSidebar';
import RightSidebar from '../desktop/RightSidebar';

const DesktopLayout = ({ children }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-6 max-w-[1920px] mx-auto px-6 lg:px-8 h-full pt-6">
      {/* Left Sidebar - Hidden on mobile/tablet */}
      <aside className="hidden lg:block sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar">
        <LeftSidebar />
      </aside>
      
      {/* Main Content */}
      <main className="min-h-screen w-full min-w-0 pb-12 lg:pb-20">
        {children}
      </main>
      
      {/* Right Sidebar - Hidden on mobile/tablet/small desktop */}
      <aside className="hidden xl:block sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar">
        <RightSidebar />
      </aside>
    </div>
  );
};

export default DesktopLayout;
