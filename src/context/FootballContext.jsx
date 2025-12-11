import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { teamsCollection, fixturesCollection, leagueTableCollection, adminActivityCollection, leagueSettingsCollection, seasonsCollection, leaguesCollection } from '../firebase/firestore';
import { useAuth } from './AuthContext';
import useCachedState from '../hooks/useCachedState';

const FootballContext = createContext();

export const useFootball = () => {
  const context = useContext(FootballContext);
  if (!context) {
    throw new Error('useFootball must be used within a FootballProvider');
  }
  return context;
};

export const FootballProvider = ({ children }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useCachedState('football:teams', []);
  const [fixtures, setFixtures] = useCachedState('football:fixtures', []);
  const [leagueTable, setLeagueTable] = useCachedState('football:leagueTable', []);
  const [leagues, setLeagues] = useCachedState('football:leagues', []);
  const [leagueSettings, setLeagueSettings] = useCachedState('football:leagueSettings', {
    qualifiedPosition: 4,
    relegationPosition: 18,
    totalTeams: 20
  });
  const [activeSeason, setActiveSeason] = useCachedState('football:activeSeason', null);
  const [activeSeasons, setActiveSeasons] = useCachedState('football:activeSeasons', []);
  const [seasons, setSeasons] = useCachedState('football:seasons', []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to always have latest teams for real-time listener
  const teamsRef = useRef(teams);
  useEffect(() => { teamsRef.current = teams; }, [teams]);

  const ownerId = user?.uid || null;
  const ownerName = user?.displayName || user?.name || user?.email || 'Unknown Admin';
  const isSuperAdmin = user?.isSuperAdmin;
  const isAdmin = user?.isAdmin;

  const applyOwnerMetadata = (payload = {}) => ({
    ...payload,
    ownerId,
    ownerName
  });

  const resolveWinner = (payload = {}, existingFixture = null) => {
    const homeScore = payload.homeScore ?? existingFixture?.homeScore;
    const awayScore = payload.awayScore ?? existingFixture?.awayScore;
    const penHome = payload.penaltyHomeScore ?? existingFixture?.penaltyHomeScore;
    const penAway = payload.penaltyAwayScore ?? existingFixture?.penaltyAwayScore;

    if (payload.status !== 'completed' && existingFixture?.status !== 'completed') return null;

    if (homeScore > awayScore) return payload.homeTeamId || existingFixture?.homeTeamId || null;
    if (awayScore > homeScore) return payload.awayTeamId || existingFixture?.awayTeamId || null;

    if (payload.decidedByPenalties && penHome != null && penAway != null) {
      if (penHome > penAway) return payload.homeTeamId || existingFixture?.homeTeamId || null;
      if (penAway > penHome) return payload.awayTeamId || existingFixture?.awayTeamId || null;
    }

    return null;
  };

  // Load initial data
  useEffect(() => {
    // Check if Firebase is initialized
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setLoading(false);
      setError('Firebase configuration missing. Please set up your .env file.');
      return;
    }
    
    loadInitialData();
  }, []);

  // Real-time fixtures updates
  useEffect(() => {
    // Skip real-time updates if Firebase not configured
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      return;
    }

    const unsubscribe = fixturesCollection.onSnapshot((updatedFixtures) => {
      // Use ref to get latest teams (avoid stale closure)
      const currentTeams = teamsRef.current || [];
      const populatedFixtures = updatedFixtures.map(fixture => {
        const homeTeam = currentTeams.find(t => t.id === fixture.homeTeamId);
        const awayTeam = currentTeams.find(t => t.id === fixture.awayTeamId);
        
        return {
          ...fixture,
          homeTeam: homeTeam || { id: fixture.homeTeamId, name: `Unknown Team (${fixture.homeTeamId?.substring(0, 8) || 'no ID'})`, logo: '' },
          awayTeam: awayTeam || { id: fixture.awayTeamId, name: `Unknown Team (${fixture.awayTeamId?.substring(0, 8) || 'no ID'})`, logo: '' }
        };
      });
      setFixtures(populatedFixtures);
    });

    return () => unsubscribe();
  }, []); // Run once on mount; teamsRef keeps it up to date

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [teamsData, fixturesData, leagueData, settingsData, activeSeasonsData, seasonsData, leaguesData] = await Promise.all([
        teamsCollection.getAll(),
        fixturesCollection.getAll(),
        leagueTableCollection.getCurrent(),
        leagueSettingsCollection.get(),
        seasonsCollection.getActiveList(),
        seasonsCollection.getAll(),
        leaguesCollection.getAll()
      ]);

      setTeams(teamsData);
      setLeagueSettings(settingsData);
      setActiveSeasons(activeSeasonsData || []);
      setActiveSeason(activeSeasonsData?.[0] || null);
      setSeasons(seasonsData);
      setLeagues(leaguesData);
      
      // Debug: Log available team IDs
      
      // Populate fixtures with team data
      const populatedFixtures = fixturesData.map(fixture => {
        const homeTeam = teamsData.find(t => t.id === fixture.homeTeamId);
        const awayTeam = teamsData.find(t => t.id === fixture.awayTeamId);
        
        return {
          ...fixture,
          homeTeam: homeTeam || { id: fixture.homeTeamId, name: `Unknown Team (${fixture.homeTeamId?.substring(0, 8) || 'no ID'})`, logo: '' },
          awayTeam: awayTeam || { id: fixture.awayTeamId, name: `Unknown Team (${fixture.awayTeamId?.substring(0, 8) || 'no ID'})`, logo: '' }
        };
      });
      
      setFixtures(populatedFixtures);
      setLeagueTable(leagueData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTeam = async (teamData) => {
    if (!isAdmin) {
      throw new Error('Only admins can add teams');
    }

    try {
      const teamPayload = applyOwnerMetadata(teamData);
      const teamId = await teamsCollection.add(teamPayload);
      const newTeam = { id: teamId, ...teamPayload };
      setTeams(prev => [...prev, newTeam]);
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'add',
          type: 'team',
          itemId: teamId,
          itemName: teamPayload.name,
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
      
      return newTeam;
    } catch (error) {
      throw error;
    }
  };

  const addBulkTeams = async (teamsData) => {
    if (!isAdmin) {
      throw new Error('Only admins can add teams');
    }

    try {
      const enrichedTeams = teamsData.map(team => applyOwnerMetadata(team));
      await teamsCollection.addBulk(enrichedTeams);
      // Reload teams to get the updated list with Firebase IDs
      const updatedTeams = await teamsCollection.getAll();
      setTeams(updatedTeams);
    } catch (error) {
      throw error;
    }
  };

  const updateTeam = async (teamId, updates) => {
    try {
      const existingTeam = teams.find(team => team.id === teamId);
      const updatePayload = (isAdmin && !isSuperAdmin)
        ? {
            ...updates,
            ownerId: existingTeam?.ownerId || ownerId,
            ownerName: existingTeam?.ownerName || ownerName
          }
        : updates;

      await teamsCollection.update(teamId, updatePayload);
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, ...updatePayload } : team
      ));
      
      // Log activity
      if (user) {
        const team = teams.find(t => t.id === teamId);
        await adminActivityCollection.log({
          action: 'update',
          type: 'team',
          itemId: teamId,
          itemName: team?.name || 'Unknown Team',
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      
      // Ensure teamId is a string
      const id = String(teamId);
      
      const team = teams.find(t => t.id === id || t.id === teamId);
      
      await teamsCollection.delete(id);
      
      setTeams(prev => prev.filter(team => team.id !== id && team.id !== teamId));
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'delete',
          type: 'team',
          itemId: id,
          itemName: team?.name || 'Unknown Team',
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const followTeam = async (teamId) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to follow teams');
      }

      await teamsCollection.follow(teamId, user.uid);
      
      // Update local state
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const currentFollowers = team.followers || [];
          if (!currentFollowers.includes(user.uid)) {
            return {
              ...team,
              followers: [...currentFollowers, user.uid],
              followerCount: (team.followerCount || 0) + 1
            };
          }
        }
        return team;
      }));
      
    } catch (error) {
      throw error;
    }
  };

  const unfollowTeam = async (teamId) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to unfollow teams');
      }

      await teamsCollection.unfollow(teamId, user.uid);
      
      // Update local state
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const currentFollowers = team.followers || [];
          if (currentFollowers.includes(user.uid)) {
            return {
              ...team,
              followers: currentFollowers.filter(id => id !== user.uid),
              followerCount: Math.max(0, (team.followerCount || 0) - 1)
            };
          }
        }
        return team;
      }));
      
    } catch (error) {
      throw error;
    }
  };

  const addFixture = async (fixtureData) => {
    if (!isAdmin) {
      throw new Error('Only admins can add fixtures');
    }

    try {
      const fixturePayload = applyOwnerMetadata({
        ...fixtureData,
        decidedByPenalties: Boolean(fixtureData.decidedByPenalties),
        penaltyHomeScore: fixtureData.decidedByPenalties ? fixtureData.penaltyHomeScore ?? null : null,
        penaltyAwayScore: fixtureData.decidedByPenalties ? fixtureData.penaltyAwayScore ?? null : null,
        penaltyWinnerId: fixtureData.decidedByPenalties ? fixtureData.penaltyWinnerId || null : null,
      });

      const winnerId = resolveWinner(fixturePayload);
      const payloadWithWinner = { ...fixturePayload, winnerId };

      const fixtureId = await fixturesCollection.add(payloadWithWinner);
      
      // Find the team data
      const homeTeam = teams.find(t => t.id === fixturePayload.homeTeamId);
      const awayTeam = teams.find(t => t.id === fixturePayload.awayTeamId);
      
      const newFixture = { 
        id: fixtureId, 
        ...payloadWithWinner,
        homeTeam: homeTeam || { id: fixturePayload.homeTeamId, name: 'Unknown Team', logo: '' },
        awayTeam: awayTeam || { id: fixturePayload.awayTeamId, name: 'Unknown Team', logo: '' },
        dateTime: new Date(fixturePayload.dateTime)
      };
      
      setFixtures(prev => [...prev, newFixture].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)));
      
      // ⚡ NOTIFICATION TRIGGER: New fixture created
      // TODO: Send notifications to followers of homeTeam and awayTeam
      // - Check if user has 'upcomingMatches' setting enabled
      // - Send 24 hours before match if 'upcomingMatches' is true
      // - Include: team names, match date/time, competition
      // Example notification: "Manchester United vs Liverpool - Tomorrow at 3:00 PM"
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'add',
          type: 'fixture',
          itemId: fixtureId,
          itemName: `${homeTeam?.name || 'Unknown'} vs ${awayTeam?.name || 'Unknown'}`,
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
      
      return newFixture;
    } catch (error) {
      throw error;
    }
  };

  const updateFixture = async (fixtureId, updates) => {
    try {
      const fixture = fixtures.find(f => f.id === fixtureId);
      const wasCompleted = fixture?.status === 'completed';
      const isNowCompleted = updates.status === 'completed';
      const statusChangedToLive = fixture?.status !== 'live' && updates.status === 'live';
      
      const normalizedUpdates = {
        ...updates,
        decidedByPenalties: Boolean(updates.decidedByPenalties),
        penaltyHomeScore: updates.decidedByPenalties ? updates.penaltyHomeScore ?? null : null,
        penaltyAwayScore: updates.decidedByPenalties ? updates.penaltyAwayScore ?? null : null,
        penaltyWinnerId: updates.decidedByPenalties ? updates.penaltyWinnerId || null : null,
      };

      const winnerId = resolveWinner(normalizedUpdates, fixture);

      const updatePayload = (isAdmin && !isSuperAdmin)
        ? {
            ...normalizedUpdates,
            winnerId,
            ownerId: fixture?.ownerId || ownerId,
            ownerName: fixture?.ownerName || ownerName
          }
        : { ...normalizedUpdates, winnerId };

      await fixturesCollection.update(fixtureId, updatePayload);
      setFixtures(prev => prev.map(f => 
        f.id === fixtureId ? { ...f, ...updatePayload } : f
      ));

      // ⚡ NOTIFICATION TRIGGER: Match goes live
      if (statusChangedToLive) {
        // TODO: Send notifications to followers of both teams
        // - Check if user has 'liveMatches' setting enabled
        // - Include: team names, "Match is now LIVE!", current score (0-0)
        // Example: "🔴 LIVE: Manchester United vs Liverpool - 0-0"
      }

      // ⚡ NOTIFICATION TRIGGER: Match completed with final score
      if (!wasCompleted && isNowCompleted && (updates.homeScore !== undefined || updates.awayScore !== undefined)) {
        // TODO: Send notifications to followers of both teams
        // - Check if user has 'matchResults' setting enabled
        // - Include: team names, final score, result (win/loss/draw)
        // Example: "⚽ Full Time: Manchester United 2-1 Liverpool"
      }
      
      // If fixture is part of a season and is now completed, update group standings
      if (fixture?.seasonId && fixture?.groupId && isNowCompleted && !wasCompleted) {
        await updateSeasonStandings(fixture.seasonId, fixture.groupId, {
          ...fixture,
          ...updates
        });
      }
      
      // If scores changed for an already completed season fixture, recalculate standings
      if (fixture?.seasonId && fixture?.groupId && isNowCompleted && wasCompleted &&
          (updates.homeScore !== fixture.homeScore || updates.awayScore !== fixture.awayScore)) {
        await recalculateGroupStandings(fixture.seasonId, fixture.groupId);
      }
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'update',
          type: 'fixture',
          itemId: fixtureId,
          itemName: `${fixture?.homeTeam?.name || 'Unknown'} vs ${fixture?.awayTeam?.name || 'Unknown'}`,
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // Update season standings based on fixture result
  const updateSeasonStandings = async (seasonId, groupId, fixture) => {
    try {
      const season = await seasonsCollection.getById(seasonId);
      if (!season || !season.groups) return;

      const group = season.groups.find(g => g.id === groupId);
      if (!group) return;

      // Initialize standings if not exists
      if (!group.standings) {
        group.standings = group.teams.map(team => ({
          teamId: team.id,
          team: team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }));
      }

      // Find team standings
      const homeTeamStanding = group.standings.find(s => s.teamId === fixture.homeTeamId || s.team?.id === fixture.homeTeamId);
      const awayTeamStanding = group.standings.find(s => s.teamId === fixture.awayTeamId || s.team?.id === fixture.awayTeamId);

      if (!homeTeamStanding || !awayTeamStanding) return;

      // Update standings
      const homeScore = fixture.homeScore || 0;
      const awayScore = fixture.awayScore || 0;

      homeTeamStanding.played += 1;
      awayTeamStanding.played += 1;
      homeTeamStanding.goalsFor += homeScore;
      homeTeamStanding.goalsAgainst += awayScore;
      awayTeamStanding.goalsFor += awayScore;
      awayTeamStanding.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeTeamStanding.won += 1;
        homeTeamStanding.points += 3;
        awayTeamStanding.lost += 1;
      } else if (awayScore > homeScore) {
        awayTeamStanding.won += 1;
        awayTeamStanding.points += 3;
        homeTeamStanding.lost += 1;
      } else {
        homeTeamStanding.drawn += 1;
        awayTeamStanding.drawn += 1;
        homeTeamStanding.points += 1;
        awayTeamStanding.points += 1;
      }

      homeTeamStanding.goalDifference = homeTeamStanding.goalsFor - homeTeamStanding.goalsAgainst;
      awayTeamStanding.goalDifference = awayTeamStanding.goalsFor - awayTeamStanding.goalsAgainst;

      // Update the season
      await seasonsCollection.updateGroup(seasonId, groupId, { standings: group.standings });
      
      // Reload seasons to reflect changes
      const updatedSeasons = await seasonsCollection.getAll();
      setSeasons(updatedSeasons);
      const updatedActiveSeason = updatedSeasons.find(s => s.isActive);
      if (updatedActiveSeason) setActiveSeason(updatedActiveSeason);
      
    } catch (error) {
    }
  };

  // Recalculate all standings for a group (when scores are edited)
  const recalculateGroupStandings = async (seasonId, groupId) => {
    try {
      // Get all fixtures for this group
      const groupFixtures = fixtures.filter(f => 
        f.seasonId === seasonId && 
        f.groupId === groupId && 
        f.status === 'completed'
      );

      const season = await seasonsCollection.getById(seasonId);
      if (!season || !season.groups) return;

      const group = season.groups.find(g => g.id === groupId);
      if (!group) return;

      // Reset standings
      const standings = group.teams.map(team => ({
        teamId: team.id,
        team: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }));

      // Recalculate from all fixtures
      groupFixtures.forEach(fixture => {
        const homeTeamStanding = standings.find(s => s.teamId === fixture.homeTeamId || s.team?.id === fixture.homeTeamId);
        const awayTeamStanding = standings.find(s => s.teamId === fixture.awayTeamId || s.team?.id === fixture.awayTeamId);

        if (!homeTeamStanding || !awayTeamStanding) return;

        const homeScore = fixture.homeScore || 0;
        const awayScore = fixture.awayScore || 0;

        homeTeamStanding.played += 1;
        awayTeamStanding.played += 1;
        homeTeamStanding.goalsFor += homeScore;
        homeTeamStanding.goalsAgainst += awayScore;
        awayTeamStanding.goalsFor += awayScore;
        awayTeamStanding.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
          homeTeamStanding.won += 1;
          homeTeamStanding.points += 3;
          awayTeamStanding.lost += 1;
        } else if (awayScore > homeScore) {
          awayTeamStanding.won += 1;
          awayTeamStanding.points += 3;
          homeTeamStanding.lost += 1;
        } else {
          homeTeamStanding.drawn += 1;
          awayTeamStanding.drawn += 1;
          homeTeamStanding.points += 1;
          awayTeamStanding.points += 1;
        }

        homeTeamStanding.goalDifference = homeTeamStanding.goalsFor - homeTeamStanding.goalsAgainst;
        awayTeamStanding.goalDifference = awayTeamStanding.goalsFor - awayTeamStanding.goalsAgainst;
      });

      // Update the season
      await seasonsCollection.updateGroup(seasonId, groupId, { standings });
      
      // Reload seasons
      const updatedSeasons = await seasonsCollection.getAll();
      setSeasons(updatedSeasons);
      const updatedActiveSeason = updatedSeasons.find(s => s.isActive);
      if (updatedActiveSeason) setActiveSeason(updatedActiveSeason);
      
    } catch (error) {
    }
  };

  const updateLeagueTable = async (teamId, stats) => {
    try {
      await leagueTableCollection.updateTeam(teamId, stats);
      setLeagueTable(prev => prev.map(team => 
        team.id === teamId ? { ...team, ...stats } : team
      ).sort((a, b) => b.points - a.points || (b.goalDifference - a.goalDifference)));
    } catch (error) {
      throw error;
    }
  };

  const updateLeagueSettings = async (settings) => {
    try {
      await leagueSettingsCollection.save(settings);
      setLeagueSettings(settings);
    } catch (error) {
      throw error;
    }
  };

  // Season management functions
  const setSeasonActiveState = async (seasonId, isActive = true) => {
    try {
      await seasonsCollection.setActive(seasonId, isActive);
      const [updatedSeasons, updatedActiveList] = await Promise.all([
        seasonsCollection.getAll(),
        seasonsCollection.getActiveList()
      ]);

      setSeasons(updatedSeasons);
      setActiveSeasons(updatedActiveList || []);
      setActiveSeason((updatedActiveList || [])[0] || null);
    } catch (error) {
      throw error;
    }
  };

  const getSeasonFixtures = (seasonId) => {
    return fixtures.filter(f => f.seasonId === seasonId);
  };

  const getGroupStandings = (seasonId, groupId) => {
    const season = seasons.find(s => s.id === seasonId) || activeSeason;
    if (!season) return [];
    
    const group = season.groups?.find(g => g.id === groupId);
    return group?.standings || [];
  };

  const updateGroupStandings = async (seasonId, groupId, standings) => {
    try {
      const season = seasons.find(s => s.id === seasonId);
      if (!season) return;

      const updatedGroups = season.groups.map(g => 
        g.id === groupId ? { ...g, standings } : g
      );

      await seasonsCollection.update(seasonId, { groups: updatedGroups });
      
      // Update local state
      setSeasons(prev => prev.map(s => 
        s.id === seasonId ? { ...s, groups: updatedGroups } : s
      ));
      
      if (activeSeason?.id === seasonId) {
        setActiveSeason(prev => ({ ...prev, groups: updatedGroups }));
      }
    } catch (error) {
      throw error;
    }
  };

  // League management functions
  const fetchLeagues = async () => {
    try {
      const leaguesData = await leaguesCollection.getAll();
      setLeagues(leaguesData);
      return leaguesData;
    } catch (error) {
      throw error;
    }
  };

  const addLeague = async (leagueData) => {
    if (!isAdmin) {
      throw new Error('Only admins can add leagues');
    }

    try {
      const leaguePayload = applyOwnerMetadata(leagueData);
      const leagueId = await leaguesCollection.add(leaguePayload);
      await fetchLeagues(); // Refresh leagues
      return leagueId;
    } catch (error) {
      throw error;
    }
  };

  const updateLeague = async (leagueId, leagueData) => {
    try {
      const existingLeague = leagues.find(league => league.id === leagueId);
      const updatePayload = (isAdmin && !isSuperAdmin)
        ? {
            ...leagueData,
            ownerId: existingLeague?.ownerId || ownerId,
            ownerName: existingLeague?.ownerName || ownerName
          }
        : leagueData;

      await leaguesCollection.update(leagueId, updatePayload);
      await fetchLeagues(); // Refresh leagues
    } catch (error) {
      throw error;
    }
  };

  const deleteLeague = async (leagueId) => {
    try {
      await leaguesCollection.delete(leagueId);
      await fetchLeagues(); // Refresh leagues
    } catch (error) {
      throw error;
    }
  };

  const ownedTeams = useMemo(() => {
    if (isSuperAdmin) return teams;
    if (!isAdmin) return [];
    return teams.filter(team => team.ownerId === ownerId);
  }, [teams, isAdmin, isSuperAdmin, ownerId]);

  const ownedFixtures = useMemo(() => {
    if (isSuperAdmin) return fixtures;
    if (!isAdmin) return [];
    return fixtures.filter(fixture => fixture.ownerId === ownerId);
  }, [fixtures, isAdmin, isSuperAdmin, ownerId]);

  const ownedLeagues = useMemo(() => {
    if (isSuperAdmin) return leagues;
    if (!isAdmin) return [];
    return leagues.filter(league => league.ownerId === ownerId);
  }, [leagues, isAdmin, isSuperAdmin, ownerId]);

  const ownedSeasons = useMemo(() => {
    if (isSuperAdmin) return seasons;
    if (!isAdmin) return [];
    return seasons.filter(season => season.ownerId === ownerId);
  }, [seasons, isAdmin, isSuperAdmin, ownerId]);

  const followedTeams = useMemo(() => {
    if (!user) return [];
    return teams.filter(team => {
      const followers = team.followers || [];
      return followers.includes(user.uid);
    });
  }, [teams, user]);

  const value = {
    teams,
    ownedTeams,
    followedTeams,
    fixtures,
    ownedFixtures,
    leagueTable,
    leagueSettings,
    leagues,
    ownedLeagues,
    activeSeason,
    activeSeasons,
    seasons,
    ownedSeasons,
    loading,
    error,
    isAdmin,
    isSuperAdmin,
    addTeam,
    addBulkTeams,
    updateTeam,
    deleteTeam,
    followTeam,
    unfollowTeam,
    addFixture,
    updateFixture,
    updateLeagueTable,
    updateLeagueSettings,
    fetchLeagues,
    addLeague,
    updateLeague,
    deleteLeague,
    setSeasonActiveState,
    getSeasonFixtures,
    getGroupStandings,
    updateGroupStandings,
    refreshData: loadInitialData
  };

  return (
    <FootballContext.Provider value={value}>
      {children}
    </FootballContext.Provider>
  );
};
