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

      {/* Header Area */}
      {header && (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-app/80 border-b border-white/5">
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <main 
        ref={ref}
        className="flex-1 relative z-10 w-full max-w-md mx-auto px-4 py-6 pb-24 overflow-y-auto hide-scrollbar"
      >
        {children}
      </main>

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
