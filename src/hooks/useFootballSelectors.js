/**
 * Football Context Selectors
 * 
 * These selector hooks allow components to subscribe to specific parts of the 
 * FootballContext without re-rendering when other parts change.
 * 
 * Usage:
 *   // Instead of:
 *   const { teams, fixtures, loading } = useFootball();
 * 
 *   // Use specific selectors:
 *   const teams = useTeams();
 *   const fixtures = useFixtures();
 */

import { useMemo } from 'react';
import { useFootball } from '../context/FootballContext';

/**
 * Returns only teams data - use when you only need teams
 */
export const useTeams = () => {
  const { teams, loading, error } = useFootball();
  return useMemo(() => ({ teams, loading, error }), [teams, loading, error]);
};

/**
 * Returns only fixtures data - use when you only need fixtures
 */
export const useFixtures = () => {
  const { fixtures, loading, error } = useFootball();
  return useMemo(() => ({ fixtures, loading, error }), [fixtures, loading, error]);
};

/**
 * Returns only seasons data
 */
export const useSeasons = () => {
  const { seasons, activeSeason, activeSeasons, loading, error } = useFootball();
  return useMemo(() => ({ 
    seasons, 
    activeSeason, 
    activeSeasons, 
    loading, 
    error 
  }), [seasons, activeSeason, activeSeasons, loading, error]);
};

/**
 * Returns only leagues data
 */
export const useLeagues = () => {
  const { leagues, loading, error } = useFootball();
  return useMemo(() => ({ leagues, loading, error }), [leagues, loading, error]);
};

/**
 * Returns only league table data
 */
export const useLeagueTable = () => {
  const { leagueTable, leagueSettings, loading, error } = useFootball();
  return useMemo(() => ({ 
    leagueTable, 
    leagueSettings, 
    loading, 
    error 
  }), [leagueTable, leagueSettings, loading, error]);
};

/**
 * Returns admin-specific data
 */
export const useFootballAdmin = () => {
  const { 
    isAdmin, 
    isSuperAdmin, 
    ownedTeams, 
    ownedFixtures, 
    ownedLeagues, 
    ownedSeasons,
    addTeam,
    addBulkTeams,
    updateTeam,
    deleteTeam,
    addFixture,
    updateFixture,
    addLeague,
    updateLeague,
    deleteLeague
  } = useFootball();

  return useMemo(() => ({
    isAdmin,
    isSuperAdmin,
    ownedTeams,
    ownedFixtures,
    ownedLeagues,
    ownedSeasons,
    addTeam,
    addBulkTeams,
    updateTeam,
    deleteTeam,
    addFixture,
    updateFixture,
    addLeague,
    updateLeague,
    deleteLeague
  }), [
    isAdmin, isSuperAdmin, ownedTeams, ownedFixtures, ownedLeagues, ownedSeasons,
    addTeam, addBulkTeams, updateTeam, deleteTeam, addFixture, updateFixture,
    addLeague, updateLeague, deleteLeague
  ]);
};

/**
 * Returns team following functionality
 */
export const useTeamFollowing = () => {
  const { followedTeams, followTeam, unfollowTeam } = useFootball();
  return useMemo(() => ({ 
    followedTeams, 
    followTeam, 
    unfollowTeam 
  }), [followedTeams, followTeam, unfollowTeam]);
};

/**
 * Returns a single team by ID
 */
export const useTeamById = (teamId) => {
  const { teams } = useFootball();
  return useMemo(() => teams.find(t => t.id === teamId) || null, [teams, teamId]);
};

/**
 * Returns a single fixture by ID
 */
export const useFixtureById = (fixtureId) => {
  const { fixtures } = useFootball();
  return useMemo(() => fixtures.find(f => f.id === fixtureId) || null, [fixtures, fixtureId]);
};

/**
 * Returns fixtures filtered by status
 */
export const useFixturesByStatus = (status) => {
  const { fixtures, loading } = useFootball();
  return useMemo(() => ({
    fixtures: fixtures.filter(f => f.status === status),
    loading
  }), [fixtures, status, loading]);
};

/**
 * Returns fixtures for a specific team
 */
export const useTeamFixtures = (teamId) => {
  const { fixtures, loading } = useFootball();
  return useMemo(() => ({
    fixtures: fixtures.filter(f => 
      f.homeTeamId === teamId || f.awayTeamId === teamId
    ),
    loading
  }), [fixtures, teamId, loading]);
};
