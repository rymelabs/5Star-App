import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, MapPin, Calendar, RefreshCw, ChevronRight, Filter, Star } from 'lucide-react';
import { afconService } from '../services/afconService.js';

const AfconPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('fixtures');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const result = await afconService.getData(forceRefresh);
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading AFCON data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => loadData(true);

  const getFilteredFixtures = () => {
    if (!data?.fixtures) return [];
    let fixtures = [...data.fixtures];
    if (selectedGroup !== 'all') {
      fixtures = fixtures.filter(f => f.group === selectedGroup);
    }
    switch (activeTab) {
      case 'live': return fixtures.filter(f => f.isLive);
      case 'fixtures': return afconService.getUpcomingFixtures(fixtures);
      case 'results': return afconService.getResults(fixtures);
      default: return fixtures;
    }
  };

  // --- Components ---

  const TabButton = ({ id, label, count, active, onClick }) => (
    <button
      onClick={onClick}
      className={`relative px-6 py-3 text-base font-medium transition-all duration-300 rounded-full flex items-center gap-2.5 ${
        active 
          ? 'bg-white text-[#008751] shadow-lg shadow-black/10' 
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          active ? 'bg-[#EF3340] text-white' : 'bg-white/20 text-white'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const FilterChip = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
        active
          ? 'bg-[#008751] border-[#008751] text-white shadow-md shadow-[#008751]/20'
          : 'bg-transparent border-white/10 text-gray-400 hover:border-[#008751]/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  const MatchCard = ({ match }) => {
    const isLive = match.isLive;
    const isFinished = ['FT', 'AET', 'PEN'].includes(match.status);
    
    return (
      <div className="group relative bg-[#121212] hover:bg-[#1a1a1a] rounded-2xl p-5 border border-white/5 hover:border-[#008751]/30 transition-all duration-300 shadow-xl shadow-black/20">
        {/* Live Indicator Line */}
        {isLive && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#EF3340] to-transparent shadow-[0_0_10px_#EF3340]" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 text-xs text-gray-500 uppercase tracking-wider font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[#008751]">{match.group !== 'Knockout' ? `Group ${match.group}` : match.round}</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>{match.venue}</span>
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 text-[#EF3340] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF3340]" />
              LIVE
            </div>
          )}
        </div>

        {/* Match Content */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center gap-3 group-hover:transform group-hover:-translate-x-1 transition-transform duration-300">
            <div className="relative">
              <div className="text-7xl flag-emoji filter drop-shadow-lg">{match.homeTeam.flag}</div>
              {isLive && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#008751] rounded-full border-2 border-[#121212]" />}
            </div>
            <span className="text-sm font-bold text-white text-center leading-tight">{match.homeTeam.name}</span>
          </div>

          {/* Score/Time */}
          <div className="px-6 flex flex-col items-center min-w-[100px]">
            {isFinished || isLive ? (
              <div className="flex items-center gap-3 text-3xl font-black text-white tracking-tight">
                <span>{match.homeScore ?? 0}</span>
                <span className="text-gray-600 text-xl">:</span>
                <span>{match.awayScore ?? 0}</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-white/90 tracking-tight">
                {afconService.formatMatchTime(match.date)}
              </div>
            )}
            
            <div className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
              isLive 
                ? 'bg-[#EF3340]/10 text-[#EF3340]' 
                : isFinished 
                  ? 'text-gray-500' 
                  : 'bg-[#008751]/10 text-[#008751]'
            }`}>
              {afconService.getStatusDisplay(match)}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center gap-3 group-hover:transform group-hover:translate-x-1 transition-transform duration-300">
            <div className="relative">
              <div className="text-7xl flag-emoji filter drop-shadow-lg">{match.awayTeam.flag}</div>
              {isLive && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#008751] rounded-full border-2 border-[#121212]" />}
            </div>
            <span className="text-sm font-bold text-white text-center leading-tight">{match.awayTeam.name}</span>
          </div>
        </div>

        {/* Footer */}
        {!isLive && (
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{afconService.formatMatchDate(match.date)}</span>
          </div>
        )}
      </div>
    );
  };

  const StandingsTable = ({ group, teams }) => (
    <div className="bg-[#121212] rounded-2xl overflow-hidden border border-white/5 shadow-xl shadow-black/20 mb-6">
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#121212] px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#008751]/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#008751]" />
          </div>
          <span className="font-bold text-white text-lg">Group {group}</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-[#008751]" title="Qualification" />
          <div className="w-2 h-2 rounded-full bg-gray-700" />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="py-4 px-6 text-left font-medium">Team</th>
              <th className="py-4 px-4 text-center font-medium">MP</th>
              <th className="py-4 px-4 text-center font-medium">W</th>
              <th className="py-4 px-4 text-center font-medium">D</th>
              <th className="py-4 px-4 text-center font-medium">L</th>
              <th className="py-4 px-4 text-center font-medium">GF/GA</th>
              <th className="py-4 px-4 text-center font-medium">GD</th>
              <th className="py-4 px-6 text-center font-bold text-white">Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr 
                key={team.team} 
                className={`group border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                  idx < 2 ? 'bg-[#008751]/[0.02]' : ''
                }`}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium w-4 ${idx < 2 ? 'text-[#008751]' : 'text-gray-600'}`}>
                      {team.position}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl flag-emoji-sm filter drop-shadow-md transition-transform group-hover:scale-110 duration-200">{team.flag}</span>
                      <span className={`font-semibold ${idx < 2 ? 'text-white' : 'text-gray-300'}`}>
                        {team.team}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center text-gray-400">{team.played}</td>
                <td className="py-4 px-4 text-center text-gray-400">{team.won}</td>
                <td className="py-4 px-4 text-center text-gray-400">{team.draw}</td>
                <td className="py-4 px-4 text-center text-gray-400">{team.lost}</td>
                <td className="py-4 px-4 text-center text-gray-500 text-xs">
                  {team.goalsFor}/{team.goalsAgainst}
                </td>
                <td className="py-4 px-4 text-center font-medium text-gray-300">
                  {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-block min-w-[24px] text-center font-bold ${
                    idx < 2 ? 'text-[#008751]' : 'text-white'
                  }`}>
                    {team.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const filteredFixtures = getFilteredFixtures();
  const liveCount = data?.liveMatches?.length || 0;

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#008751] selection:text-white pb-20">
      {/* Hero Header */}
      <div className="relative bg-[#008751]">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FCD116] blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-black blur-3xl"></div>
            <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-[#EF3340] blur-3xl"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative px-6 pt-8 pb-24">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-white transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-white transition-all ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center text-center">
            {/* AFCON Logo */}
            <img 
              src="/AFCON.webp" 
              alt="AFCON 2025" 
              className="w-36 h-36 object-contain mb-4 drop-shadow-2xl"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white/90 mb-3">
              <MapPin className="w-3 h-3" />
              <span>Morocco</span>
              <span className="w-1 h-1 rounded-full bg-white/50"></span>
              <span>Dec 21 - Jan 18</span>
            </div>
            <p className="text-white/80 text-sm max-w-md mx-auto">
              Live scores, fixtures, and standings
            </p>
          </div>
        </div>

        {/* Floating Tabs */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 z-20">
          <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex justify-center gap-1 shadow-2xl shadow-black/50 w-fit mx-auto overflow-x-auto">
            {[
              { id: 'live', label: 'Live', count: liveCount },
              { id: 'fixtures', label: 'Matches' },
              { id: 'results', label: 'Results' },
              { id: 'standings', label: 'Table' }
            ].map(tab => (
              <TabButton
                key={tab.id}
                {...tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pt-16 max-w-3xl mx-auto">
        
        {/* Content Grid */}
        <div className="space-y-4">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-[#1a1a1a] rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#008751] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium animate-pulse">Loading Tournament Data...</p>
            </div>
          ) : error && !data ? (
            <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-white/5">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-[#EF3340]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unable to Load Data</h3>
              <p className="text-gray-400 mb-6 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2 bg-[#008751] hover:bg-[#006d41] text-white rounded-full font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'standings' ? (
                <div className="space-y-6 animate-fade-in">
                  {Object.entries(data?.standings || {}).map(([group, teams]) => (
                    <StandingsTable key={group} group={group} teams={teams} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {filteredFixtures.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 font-medium">No matches found</p>
                      <p className="text-gray-600 text-sm mt-1">Try changing the filter or tab</p>
                    </div>
                  ) : (
                    filteredFixtures.map((match, idx) => (
                      <MatchCard key={match.id || idx} match={match} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AfconPage;
