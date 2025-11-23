import React from 'react';

const AppShell = React.forwardRef(({ children, header, bottomNav, className = '' }, ref) => {
  return (
    <div className={`h-screen bg-app text-white flex flex-col relative overflow-x-hidden overflow-y-hidden ${className}`}>
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top-right glow */}
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] bg-brand-purple/10 blur-[120px] rounded-full mix-blend-screen" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[40%] bg-brand-purple/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Header Area */}
      {header && (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-app/80 border-b border-white/5">
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <main 
        ref={ref}
        className={`flex-1 relative z-10 w-full overflow-y-auto overflow-x-hidden hide-scrollbar ${bottomNav ? 'pb-24' : ''}`}
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
