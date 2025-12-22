import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Github, Globe, Heart, Shield, Users } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="page-header ml-3">About</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* App Logo & Name */}
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-xl bg-white p-2">
            <img 
              src="/Fivescores logo.svg" 
              alt="Fivescores" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Fivescores</h2>
          <p className="text-gray-400 text-sm">Official App</p>
          <p className="text-gray-500 text-xs mt-1">Version {import.meta.env.VITE_APP_VERSION}</p>
        </div>

        {/* About the App */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            About the App
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Welcome to Fivescores! Your go-to platform for all things football.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Stay up to date with live scores, fixtures, team standings, player statistics, and the latest news from your favorite teams. Follow teams, get personalized notifications, and never miss a moment of the action.
          </p>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            Key Features
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">Live Scores & Updates:</span> Real-time match scores and live commentary
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">Fixtures & Results:</span> Complete schedule and match results
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">League Tables:</span> Up-to-date standings and team statistics
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">Team Following:</span> Follow your favorite teams and get personalized updates
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">News & Articles:</span> Latest news, interviews, and match reports
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">Smart Notifications:</span> Customizable alerts for matches and team news
              </div>
            </li>
          </ul>
        </div>

        {/* Built By */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            Built With Love By
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
              <img 
                src="/RymeLabs.svg" 
                alt="RymeLabs" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">RymeLabs</h4>
              <p className="text-sm text-gray-400">Digital Innovation Studio</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            RymeLabs is committed to building innovative digital solutions that bring communities together. 
            This app was specially crafted for Fivescores to enhance the fan experience and 
            keep the community connected.
          </p>
        </div>

        {/* Support & Contact */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-400" />
            Support & Contact
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Need help or have feedback?</p>
              <a
                href="mailto:RymeLabs@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </div>
            <div className="pt-4 border-t border-dark-700">
              <p className="text-sm text-gray-400 mb-2">Email us at:</p>
              <a
                href="mailto:RymeLabs@gmail.com"
                className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
              >
                RymeLabs@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Legal & Policies */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            Legal
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/privacy-policy')}
              className="w-full text-left px-4 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 group-hover:text-white">Privacy Policy</span>
                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/terms-of-service')}
              className="w-full text-left px-4 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 group-hover:text-white">Terms of Service</span>
                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/terms-and-conditions')}
              className="w-full text-left px-4 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 group-hover:text-white">Terms & Conditions</span>
                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/licenses')}
              className="w-full text-left px-4 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 group-hover:text-white">Open Source Licenses</span>
                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180" />
              </div>
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} RymeLabs. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Made with <Heart className="w-3 h-3 inline text-red-500" /> for Fivescores
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
