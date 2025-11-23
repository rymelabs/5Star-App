import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DesktopHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const navItems = [
    { path: '/', label: 'Latest' },
    { path: '/fixtures', label: 'Fixtures' },
    { path: '/teams', label: 'Teams' },
    { path: '/news', label: 'News' },
    { path: '/stats', label: 'Stats' },
  ];

  return (
    <div className="h-16 px-6 lg:px-8 flex items-center justify-between max-w-[1920px] mx-auto">
      {/* Logo & Nav */}
      <div className="flex items-center gap-12">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-black tracking-tight text-white">
            fivescores.com
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative w-64 lg:w-80 group">
          <div className="absolute inset-0 bg-brand-purple/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
            <input
              type="text"
              placeholder="Search teams, matches, news..."
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-black/40 transition-all duration-300"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050816]" />
          </button>
          
          <div className="h-8 w-[1px] bg-white/10" />
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-white/5"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-blue-600 flex items-center justify-center text-xs font-bold border border-white/10">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-white leading-none mb-0.5">My Account</div>
                  <div className="text-[10px] text-gray-400 leading-none">Manage Profile</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">Manage Profile</span>
                      </button>

                      {user?.isAdmin && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate('/admin');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">Admin Dashboard</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-white/10" />

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link 
              to="/auth"
              className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopHeader;
