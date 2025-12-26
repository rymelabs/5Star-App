import React from 'react';

const AppShell = React.forwardRef(({ children, header, bottomNav, className = '' }, ref) => {
  return (
    <div className={`h-screen bg-app text-white flex flex-col relative overflow-hidden ${className}`}>
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top-right glow */}
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] bg-brand-purple/10 blur-[120px] rounded-full mix-blend-screen" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[40%] bg-brand-purple/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Header Area - Fixed positioning with iOS Safari fix */}
      {header && (
        <header 
          className="fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md bg-app/80 border-b border-white/5 ios-safe-top-blur"
          style={{ 
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
        >
          {header}
        </header>
      )}

      {/* Main Content Area - Add top padding to account for fixed header */}
      <main 
        ref={ref}
        className={`flex-1 relative z-10 w-full overflow-y-auto overflow-x-hidden hide-scrollbar ${header ? '' : 'pt-6'} ${bottomNav ? 'pb-40 md:pb-32' : 'pb-12 lg:pb-24'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          ...(header ? { paddingTop: 'calc(5rem + env(safe-area-inset-top))' } : null)
        }}
      >
        {children}
      </main>

      {/* Bottom Gradient Overlay - Creates separation from bottom navbar */}
      {bottomNav && (
        <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-40 bg-gradient-to-t from-black via-black/60 to-transparent" />
      )}

      {/* Bottom Navigation Area */}
      {bottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {bottomNav}
        </div>
      )}
    </div>
  );
});

export default AppShell;
