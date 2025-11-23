import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useFootball } from '../../../context/FootballContext';
import TeamAvatar from '../../../components/TeamAvatar';
import { formatDate } from '../../../utils/dateUtils';

const RecentResultsWidget = () => {
  const { fixtures } = useFootball();

  const recentResults = useMemo(() => {
    if (!fixtures) return [];
    return fixtures
      .filter(f => f.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);
  }, [fixtures]);

  if (recentResults.length === 0) return null;

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Recent Results
          </h3>
        </div>
        <Link to="/fixtures?status=completed" className="text-[10px] font-bold text-brand-purple hover:text-white transition-colors">
          VIEW ALL
        </Link>
      </div>
      
      <div className="space-y-3">
        {recentResults.map((fixture) => (
          <Link 
            key={fixture.id} 
            to={`/fixtures/${fixture.id}`}
            className="block p-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-medium">
                {formatDate(fixture.dateTime)}
              </span>
              <span className="text-[10px] text-green-500 font-bold">FT</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamAvatar team={fixture.homeTeam} size={20} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                    {fixture.homeTeam.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">{fixture.homeScore}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamAvatar team={fixture.awayTeam} size={20} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                    {fixture.awayTeam.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">{fixture.awayScore}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentResultsWidget;
