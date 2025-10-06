import React, { createContext, useContext, useState, useEffect } from 'react';
import { teamsCollection, fixturesCollection, leagueTableCollection, adminActivityCollection, leagueSettingsCollection, seasonsCollection, leaguesCollection } from '../firebase/firestore';
import { useAuth } from './AuthContext';

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
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [leagueSettings, setLeagueSettings] = useState({
    qualifiedPosition: 4,
    relegationPosition: 18,
    totalTeams: 20
  });
  const [activeSeason, setActiveSeason] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    // Check if Firebase is initialized
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      console.warn('🔥 Firebase not configured - using mock data');
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

    try {
      const unsubscribe = fixturesCollection.onSnapshot((updatedFixtures) => {
        // Populate fixtures with team data from current teams state
        const populatedFixtures = updatedFixtures.map(fixture => {
          const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
          const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
          
          // Log warning if teams are not found
          if (!homeTeam) {
            console.warn(`⚠️ Home team not found for fixture ${fixture.id}. Team ID: ${fixture.homeTeamId}`);
          }
          if (!awayTeam) {
            console.warn(`⚠️ Away team not found for fixture ${fixture.id}. Team ID: ${fixture.awayTeamId}`);
          }
          
          return {
            ...fixture,
            homeTeam: homeTeam || { id: fixture.homeTeamId, name: `Unknown Team (${fixture.homeTeamId?.substring(0, 8) || 'no ID'})`, logo: '' },
            awayTeam: awayTeam || { id: fixture.awayTeamId, name: `Unknown Team (${fixture.awayTeamId?.substring(0, 8) || 'no ID'})`, logo: '' }
          };
        });
        setFixtures(populatedFixtures);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up fixtures listener:', error);
    }
  }, [teams]); // Re-run when teams change

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [teamsData, fixturesData, leagueData, settingsData, activeSeasonData, seasonsData, leaguesData] = await Promise.all([
        teamsCollection.getAll(),
        fixturesCollection.getAll(),
        leagueTableCollection.getCurrent(),
        leagueSettingsCollection.get(),
        seasonsCollection.getActive(),
        seasonsCollection.getAll(),
        leaguesCollection.getAll()
      ]);

      setTeams(teamsData);
      setLeagueSettings(settingsData);
      setActiveSeason(activeSeasonData);
      setSeasons(seasonsData);
      setLeagues(leaguesData);
      
      // Debug: Log available team IDs
      console.log('📋 Available Teams:', teamsData.map(t => ({ id: t.id, name: t.name })));
      console.log(`📊 Total Teams: ${teamsData.length}`);
      
      // Populate fixtures with team data
      const populatedFixtures = fixturesData.map(fixture => {
        const homeTeam = teamsData.find(t => t.id === fixture.homeTeamId);
        const awayTeam = teamsData.find(t => t.id === fixture.awayTeamId);
        
        // Log warning if teams are not found
        if (!homeTeam) {
          console.warn(`⚠️ Home team not found for fixture ${fixture.id}. Team ID: ${fixture.homeTeamId}`);
        }
        if (!awayTeam) {
          console.warn(`⚠️ Away team not found for fixture ${fixture.id}. Team ID: ${fixture.awayTeamId}`);
        }
        
        return {
          ...fixture,
          homeTeam: homeTeam || { id: fixture.homeTeamId, name: `Unknown Team (${fixture.homeTeamId?.substring(0, 8) || 'no ID'})`, logo: '' },
          awayTeam: awayTeam || { id: fixture.awayTeamId, name: `Unknown Team (${fixture.awayTeamId?.substring(0, 8) || 'no ID'})`, logo: '' }
        };
      });
      
      setFixtures(populatedFixtures);
      setLeagueTable(leagueData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTeam = async (teamData) => {
    try {
      const teamId = await teamsCollection.add(teamData);
      const newTeam = { id: teamId, ...teamData };
      setTeams(prev => [...prev, newTeam]);
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'add',
          type: 'team',
          itemId: teamId,
          itemName: teamData.name,
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
      
      return newTeam;
    } catch (error) {
      console.error('Error adding team:', error);
      throw error;
    }
  };

  const addBulkTeams = async (teamsData) => {
    try {
      await teamsCollection.addBulk(teamsData);
      // Reload teams to get the updated list with Firebase IDs
      const updatedTeams = await teamsCollection.getAll();
      setTeams(updatedTeams);
    } catch (error) {
      console.error('Error bulk adding teams:', error);
      throw error;
    }
  };

  const updateTeam = async (teamId, updates) => {
    try {
      await teamsCollection.update(teamId, updates);
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, ...updates } : team
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
      console.error('Error updating team:', error);
      throw error;
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      console.log('🔄 Starting team deletion:', teamId, 'Type:', typeof teamId);
      
      // Ensure teamId is a string
      const id = String(teamId);
      console.log('🔄 Converted ID:', id, 'Type:', typeof id);
      
      const team = teams.find(t => t.id === id || t.id === teamId);
      console.log('📋 Team found:', team?.name);
      
      await teamsCollection.delete(id);
      console.log('✅ Team deleted from Firestore');
      
      setTeams(prev => prev.filter(team => team.id !== id && team.id !== teamId));
      console.log('✅ Team removed from local state');
      
      // Log activity
      if (user) {
        console.log('📝 Logging admin activity...');
        await adminActivityCollection.log({
          action: 'delete',
          type: 'team',
          itemId: id,
          itemName: team?.name || 'Unknown Team',
          userId: user.uid,
          userName: user.displayName || user.email
        });
        console.log('✅ Activity logged');
      }
    } catch (error) {
      console.error('❌ Error in deleteTeam:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  const followTeam = async (teamId) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to follow teams');
      }

      console.log('👥 Following team:', teamId);
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
      
      console.log('✅ Team followed successfully');
    } catch (error) {
      console.error('❌ Error following team:', error);
      throw error;
    }
  };

  const unfollowTeam = async (teamId) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to unfollow teams');
      }

      console.log('👥 Unfollowing team:', teamId);
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
      
      console.log('✅ Team unfollowed successfully');
    } catch (error) {
      console.error('❌ Error unfollowing team:', error);
      throw error;
    }
  };

  const addFixture = async (fixtureData) => {
    try {
      const fixtureId = await fixturesCollection.add(fixtureData);
      
      // Find the team data
      const homeTeam = teams.find(t => t.id === fixtureData.homeTeamId);
      const awayTeam = teams.find(t => t.id === fixtureData.awayTeamId);
      
      const newFixture = { 
        id: fixtureId, 
        ...fixtureData,
        homeTeam: homeTeam || { id: fixtureData.homeTeamId, name: 'Unknown Team', logo: '' },
        awayTeam: awayTeam || { id: fixtureData.awayTeamId, name: 'Unknown Team', logo: '' },
        dateTime: new Date(fixtureData.dateTime)
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
      console.error('Error adding fixture:', error);
      throw error;
    }
  };

  const updateFixture = async (fixtureId, updates) => {
    try {
      const fixture = fixtures.find(f => f.id === fixtureId);
      const wasCompleted = fixture?.status === 'completed';
      const isNowCompleted = updates.status === 'completed';
      const statusChangedToLive = fixture?.status !== 'live' && updates.status === 'live';
      
      await fixturesCollection.update(fixtureId, updates);
      setFixtures(prev => prev.map(f => 
        f.id === fixtureId ? { ...f, ...updates } : f
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
      console.error('Error updating fixture:', error);
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
      console.error('Error updating season standings:', error);
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
      console.error('Error recalculating group standings:', error);
    }
  };

  const updateLeagueTable = async (teamId, stats) => {
    try {
      await leagueTableCollection.updateTeam(teamId, stats);
      setLeagueTable(prev => prev.map(team => 
        team.id === teamId ? { ...team, ...stats } : team
      ).sort((a, b) => b.points - a.points || (b.goalDifference - a.goalDifference)));
    } catch (error) {
      console.error('Error updating league table:', error);
      throw error;
    }
  };

  const updateLeagueSettings = async (settings) => {
    try {
      await leagueSettingsCollection.save(settings);
      setLeagueSettings(settings);
    } catch (error) {
      console.error('Error updating league settings:', error);
      throw error;
    }
  };

  // Season management functions
  const setActiveSeasonById = async (seasonId) => {
    try {
      await seasonsCollection.setActive(seasonId);
      const updatedSeason = await seasonsCollection.getById(seasonId);
      setActiveSeason(updatedSeason);
      
      // Reload seasons to update their active status
      const updatedSeasons = await seasonsCollection.getAll();
      setSeasons(updatedSeasons);
      
      // Reload fixtures to show season-specific fixtures
      await loadInitialData();
    } catch (error) {
      console.error('Error setting active season:', error);
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
      console.error('Error updating group standings:', error);
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
      console.error('Error fetching leagues:', error);
      throw error;
    }
  };

  const addLeague = async (leagueData) => {
    try {
      const leagueId = await leaguesCollection.add(leagueData);
      await fetchLeagues(); // Refresh leagues
      return leagueId;
    } catch (error) {
      console.error('Error adding league:', error);
      throw error;
    }
  };

  const updateLeague = async (leagueId, leagueData) => {
    try {
      await leaguesCollection.update(leagueId, leagueData);
      await fetchLeagues(); // Refresh leagues
    } catch (error) {
      console.error('Error updating league:', error);
      throw error;
    }
  };

  const deleteLeague = async (leagueId) => {
    try {
      await leaguesCollection.delete(leagueId);
      await fetchLeagues(); // Refresh leagues
    } catch (error) {
      console.error('Error deleting league:', error);
      throw error;
    }
  };

  const value = {
    teams,
    fixtures,
    leagueTable,
    leagueSettings,
    leagues,
    activeSeason,
    seasons,
    loading,
    error,
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
    setActiveSeasonById,
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