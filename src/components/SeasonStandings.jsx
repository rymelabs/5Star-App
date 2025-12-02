import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Trophy, Users, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewTeamAvatar from './NewTeamAvatar';
import SurfaceCard from './ui/SurfaceCard';

const SeasonStandings = ({ season, teams = [], fixtures = [] }) => {
  const [activeGroup, setActiveGroup] = useState(season?.groups?.[0]?.id || null);
  const [slideDirection, setSlideDirection] = useState(1); // 1 = right, -1 = left

  useEffect(() => {
    setActiveGroup(season?.groups?.[0]?.id || null);
    setSlideDirection(1);
  }, [season]);

  const handleGroupChange = (groupId) => {
    const currentIndex = season.groups.findIndex(g => g.id === activeGroup);
    const newIndex = season.groups.findIndex(g => g.id === groupId);
    setSlideDirection(newIndex > currentIndex ? 1 : -1);
    setActiveGroup(groupId);
  };

  if (!season || !season.groups || season.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">No groups configured for this season</p>
      </div>
    );
  }

  const currentGroup = season.groups.find(g => g.id === activeGroup);

  const allGroupTeams = useMemo(
    () => season.groups?.flatMap(group => group?.teams || []) || [],
    [season]
  );

  const groupTeamIndex = useMemo(() => {
    const map = {};
    season.groups?.forEach((group) => {
      map[group.id] = new Set(
        (group.teams || [])
          .map((team) => team?.id || team?.teamId)
          .filter(Boolean)
      );
    });
    return map;
  }, [season]);

  const seasonFixtures = useMemo(() => {
    if (!season?.id) return [];
    return fixtures.filter(fixture => fixture.seasonId === season.id);
  }, [fixtures, season?.id]);

  const resolveTeamById = (teamId) => {
    if (!teamId) return null;
    return (
      teams.find(team => team.id === teamId) ||
      allGroupTeams.find(team => (team.id || team.teamId) === teamId) ||
      null
    );
  };

  const sortStandingsList = (rows = []) => (
    [...rows]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .map((row, index) => ({ ...row, position: index + 1 }))
  );

  // Calculate standings for the current group
  const standings = useMemo(() => {
    if (!currentGroup) return [];

    const currentGroupTeamIds = groupTeamIndex[currentGroup.id] || new Set();

    const groupFixtures = seasonFixtures.filter((fixture) => {
      if (fixture.status !== 'completed') return false;
      const directGroupId = fixture.groupId || fixture.group?.id;
      if (directGroupId && directGroupId === currentGroup.id) return true;
      const homeId = fixture.homeTeamId || fixture.homeTeam?.id;
      const awayId = fixture.awayTeamId || fixture.awayTeam?.id;
      return homeId && awayId && currentGroupTeamIds.has(homeId) && currentGroupTeamIds.has(awayId);
    });

    const ensureRow = (table, teamInfo, fallbackId) => {
      const normalizedTeam = teamInfo?.team || teamInfo;
      const teamId = normalizedTeam?.id || fallbackId;
      if (!teamId) return null;

      if (!table[teamId]) {
        const resolvedTeam = normalizedTeam || resolveTeamById(teamId) || { id: teamId, name: 'Unknown Team' };
        table[teamId] = {
          teamId,
          team: resolvedTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };
      }

      return table[teamId];
    };

    if (!groupFixtures.length) {
      if (currentGroup?.standings?.length) {
        return sortStandingsList(
          currentGroup.standings.map((standing) => ({
            ...standing,
            team: standing.team || resolveTeamById(standing.teamId || standing.team?.id),
            goalDifference: standing.goalDifference ?? ((standing.goalsFor || 0) - (standing.goalsAgainst || 0)),
          }))
        );
      }

      return sortStandingsList(
        (currentGroup?.teams || []).map((team, index) => ({
          teamId: team?.id || team?.teamId,
          team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          position: index + 1,
        }))
      );
    }

    const table = {};
    (currentGroup?.teams || []).forEach(team => ensureRow(table, team, team?.teamId));

    groupFixtures.forEach((fixture) => {
      const homeTeam = fixture.homeTeam || resolveTeamById(fixture.homeTeamId) || { id: fixture.homeTeamId };
      const awayTeam = fixture.awayTeam || resolveTeamById(fixture.awayTeamId) || { id: fixture.awayTeamId };
      const homeRow = ensureRow(table, homeTeam, fixture.homeTeamId);
      const awayRow = ensureRow(table, awayTeam, fixture.awayTeamId);

      if (!homeRow || !awayRow) return;

      const homeScore = Number.isFinite(Number(fixture.homeScore)) ? Number(fixture.homeScore) : 0;
      const awayScore = Number.isFinite(Number(fixture.awayScore)) ? Number(fixture.awayScore) : 0;

      homeRow.played += 1;
      awayRow.played += 1;
      homeRow.goalsFor += homeScore;
      homeRow.goalsAgainst += awayScore;
      awayRow.goalsFor += awayScore;
      awayRow.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeRow.won += 1;
        homeRow.points += 3;
        awayRow.lost += 1;
      } else if (awayScore > homeScore) {
        awayRow.won += 1;
        awayRow.points += 3;
        homeRow.lost += 1;
      } else {
        homeRow.drawn += 1;
        awayRow.drawn += 1;
        homeRow.points += 1;
        awayRow.points += 1;
      }
    });

    return sortStandingsList(
      Object.values(table).map((row) => ({
        ...row,
        goalDifference: row.goalsFor - row.goalsAgainst,
      }))
    );
  }, [currentGroup, seasonFixtures, teams, allGroupTeams, groupTeamIndex]);

  const getRowStyle = (position) => {
    const qualifiers = season.knockoutConfig?.qualifiersPerGroup || 2;
    if (position <= qualifiers) {
      return 'bg-gradient-to-r from-brand-purple/10 to-transparent border-l-2 border-l-brand-purple';
    }
    return 'border-l-2 border-l-transparent hover:bg-white/[0.02]';
  };

  return (
    <div className="space-y-6">
      {/* Group Tabs - Sleek Segmented Control */}
      <div className="overflow-x-auto hide-scrollbar pb-2 px-6">
        <div className="flex space-x-1.5 min-w-max">
          {season.groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleGroupChange(group.id)}
              className={`
                relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300
                ${activeGroup === group.id
                  ? 'text-white shadow-[0_0_20px_rgba(109,40,217,0.3)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {activeGroup === group.id && (
                <motion.div 
                  layoutId="group-tab-indicator"
                  className="absolute inset-0 bg-brand-purple rounded-full -z-10" 
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeGroup}
          initial={{ opacity: 0, x: 15 * slideDirection }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 * slideDirection }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        >
          <div className="bg-elevated rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full min-w-[600px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="py-2.5 pl-4 pr-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12 sticky left-0 bg-elevated z-10">Pos</th>
                <th className="py-2.5 px-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] sticky left-12 bg-elevated z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">Team</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12">P</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12">W</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12">D</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12">L</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12">GF</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-12">GA</th>
                <th className="py-2.5 px-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] w-16">GD</th>
                <th className="py-2.5 px-4 text-center text-[10px] font-bold text-white uppercase tracking-[0.2em] w-16">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {standings.map((standing) => {
                const team = teams.find(t => t.id === standing.team?.id || t.id === standing.teamId);
                const isQualifier = standing.position <= (season.knockoutConfig?.qualifiersPerGroup || 2);
                
                return (
                  <tr 
                    key={standing.position} 
                    className={`transition-colors duration-200 group text-xs sm:text-sm ${getRowStyle(standing.position)}`}
                  >
                    <td className="py-1.5 pl-4 pr-2 sticky left-0 bg-inherit z-10">
                      <span className={`
                        flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold
                        ${isQualifier ? 'bg-brand-purple text-white shadow-[0_0_10px_rgba(109,40,217,0.4)]' : 'text-gray-500'}
                      `}>
                        {standing.position}
                      </span>
                    </td>
                    <td className="py-1.5 px-4 sticky left-12 bg-inherit z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                      <div className="flex items-center gap-2.5">
                        <NewTeamAvatar 
                          team={team || standing.team} 
                          size={30} 
                          className="ring-1 ring-black/20"
                        />
                        <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[110px] sm:max-w-[190px] group-hover:text-brand-purple transition-colors">
                          {team?.name || standing.team?.name || 'Unknown Team'}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-gray-400 font-mono">{standing.played}</td>
                    <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-gray-400 font-mono">{standing.won}</td>
                    <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-gray-400 font-mono">{standing.drawn}</td>
                    <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-gray-400 font-mono">{standing.lost}</td>
                    <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-gray-400 font-mono">{standing.goalsFor}</td>
                    <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-gray-400 font-mono">{standing.goalsAgainst}</td>
                    <td className={`py-1.5 px-2 text-center text-xs sm:text-sm font-mono font-medium ${
                      standing.goalDifference > 0 ? 'text-green-400' : 
                      standing.goalDifference < 0 ? 'text-red-400' : 
                      'text-gray-500'
                    }`}>
                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </td>
                    <td className="py-1.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-lg bg-white/5 text-white font-bold text-xs sm:text-sm border border-white/10 shadow-inner">
                        {standing.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer / Legend */}
        {season.knockoutConfig?.qualifiersPerGroup > 0 && (
          <div className="px-4 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-purple shadow-[0_0_8px_rgba(109,40,217,0.5)]"></div>
              <span className="font-medium">Qualification Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Elimination</span>
            </div>
          </div>
        )}
      </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Teams', value: currentGroup.teams?.length || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Qualifiers', value: season.knockoutConfig?.qualifiersPerGroup || 0, icon: Trophy, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
          { label: 'Matches', value: standings.reduce((sum, s) => sum + s.played, 0) / 2 || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Completed', value: standings.every(s => s.played > 0) ? 'Yes' : 'No', icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-elevated border border-white/5 rounded-lg p-2.5 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-md ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{stat.label}</p>
              <p className="text-base font-semibold text-white truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeasonStandings;
