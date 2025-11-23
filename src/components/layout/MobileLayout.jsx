import React from 'react';

const MobileLayout = ({ children }) => {
  return (
    <div className="w-full mx-auto px-4 py-6">
      {children}
    </div>
  );
};

export default MobileLayout;
