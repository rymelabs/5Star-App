import React, { createContext, useContext, useState, useEffect } from 'react';
import { teamsCollection, fixturesCollection, leagueTableCollection, adminActivityCollection, leagueSettingsCollection, seasonsCollection } from '../firebase/firestore';
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
          return {
            ...fixture,
            homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'Unknown Team', logo: '' },
            awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'Unknown Team', logo: '' }
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
      const [teamsData, fixturesData, leagueData, settingsData, activeSeasonData, seasonsData] = await Promise.all([
        teamsCollection.getAll(),
        fixturesCollection.getAll(),
        leagueTableCollection.getCurrent(),
        leagueSettingsCollection.get(),
        seasonsCollection.getActive(),
        seasonsCollection.getAll()
      ]);

      setTeams(teamsData);
      setLeagueSettings(settingsData);
      setActiveSeason(activeSeasonData);
      setSeasons(seasonsData);
      
      // Populate fixtures with team data
      const populatedFixtures = fixturesData.map(fixture => {
        const homeTeam = teamsData.find(t => t.id === fixture.homeTeamId);
        const awayTeam = teamsData.find(t => t.id === fixture.awayTeamId);
        return {
          ...fixture,
          homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'Unknown Team', logo: '' },
          awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'Unknown Team', logo: '' }
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
      const team = teams.find(t => t.id === teamId);
      await teamsCollection.delete(teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'delete',
          type: 'team',
          itemId: teamId,
          itemName: team?.name || 'Unknown Team',
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
    } catch (error) {
      console.error('Error deleting team:', error);
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
      await fixturesCollection.update(fixtureId, updates);
      setFixtures(prev => prev.map(fixture => 
        fixture.id === fixtureId ? { ...fixture, ...updates } : fixture
      ));
      
      // Log activity
      if (user) {
        const fixture = fixtures.find(f => f.id === fixtureId);
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

  const value = {
    teams,
    fixtures,
    leagueTable,
    leagueSettings,
    activeSeason,
    seasons,
    loading,
    error,
    addTeam,
    addBulkTeams,
    updateTeam,
    deleteTeam,
    addFixture,
    updateFixture,
    updateLeagueTable,
    updateLeagueSettings,
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