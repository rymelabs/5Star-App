import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useFootball } from '../../../context/FootballContext';
import TeamAvatar from '../../../components/TeamAvatar';

const TopScorersWidget = () => {
  const { fixtures } = useFootball();

  const topScorers = useMemo(() => {
    if (!fixtures) return [];
    
    const scorerMap = new Map();
    const completedFixtures = fixtures.filter(f => f.status === 'completed');

    completedFixtures.forEach(fixture => {
      if (!fixture.events) return;

      fixture.events.forEach(event => {
        if (event.type === 'goal') {
          // Try to find player info from the event or fixture data
          // This logic depends on how your data is structured
          // Assuming event has playerName or we can look it up
          
          const team = event.team === fixture.homeTeam?.id ? fixture.homeTeam : fixture.awayTeam;
          
          // If we have player info in the event
          const playerId = event.playerId || event.player?.id;
          const playerName = event.playerName || event.player?.name || 'Unknown Player';
          
          if (playerId && team) {
            const key = `${playerId}_${team.id}`;
            if (!scorerMap.has(key)) {
              scorerMap.set(key, {
                id: playerId,
                name: playerName,
                team: team,
                goals: 0
              });
            }
            scorerMap.get(key).goals++;
          }
        }
      });
    });

    return Array.from(scorerMap.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [fixtures]);

  if (topScorers.length === 0) return null;

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-brand-purple" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Top Scorers
        </h3>
      </div>
      
      <div className="space-y-3">
        {topScorers.map((scorer, index) => (
          <div key={`${scorer.id}-${index}`} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                  index === 1 ? 'bg-gray-400/20 text-gray-400' : 
                  index === 2 ? 'bg-orange-500/20 text-orange-500' : 'text-gray-600'}
              `}>
                {index + 1}
              </div>
              <TeamAvatar team={scorer.team} size={24} />
              <div>
                <div className="text-sm font-medium text-white group-hover:text-brand-purple transition-colors">
                  {scorer.name}
                </div>
                <div className="text-[10px] text-gray-500">
                  {scorer.team.name}
                </div>
              </div>
            </div>
            <div className="font-bold text-white">{scorer.goals}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopScorersWidget;
