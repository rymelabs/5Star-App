import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useFootball } from '../../../context/FootballContext';
import NewTeamAvatar from '../../NewTeamAvatar';
import { formatDate, formatTime } from '../../../utils/dateUtils';

const UpcomingFixturesWidget = () => {
  const { fixtures } = useFootball();

  const upcomingFixtures = useMemo(() => {
    if (!fixtures) return [];
    const now = new Date();
    return fixtures
      .filter(f => new Date(f.dateTime) > now && f.status !== 'completed')
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .slice(0, 5);
  }, [fixtures]);

  if (upcomingFixtures.length === 0) return null;

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-purple" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Upcoming
          </h3>
        </div>
        <Link to="/fixtures" className="text-[10px] font-bold text-brand-purple hover:text-white transition-colors">
          VIEW ALL
        </Link>
      </div>
      
      <div className="space-y-3">
        {upcomingFixtures.map((fixture) => (
          <Link 
            key={fixture.id} 
            to={`/fixtures/${fixture.id}`}
            className="block p-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-medium">
                {formatDate(fixture.dateTime)} • {formatTime(fixture.dateTime)}
              </span>
              <span className="text-[10px] text-brand-purple/80 font-bold px-1.5 py-0.5 bg-brand-purple/10 rounded">
                {fixture.competition || 'League'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NewTeamAvatar team={fixture.homeTeam} size={20} />
                <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                  {fixture.homeTeam.name}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-600">VS</span>
              <div className="flex items-center gap-2 flex-row-reverse">
                <NewTeamAvatar team={fixture.awayTeam} size={20} />
                <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                  {fixture.awayTeam.name}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UpcomingFixturesWidget;
