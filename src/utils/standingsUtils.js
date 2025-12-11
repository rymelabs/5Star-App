/**
 * Standings Calculation Utility
 * 
 * Computes group standings from fixtures with accurate GD (goal difference) and points.
 */

/**
 * Sort standings by points → goal difference → goals for, then assign positions.
 * @param {Array} rows - Array of standing row objects
 * @returns {Array} Sorted rows with position field
 */
export const sortStandingsList = (rows = []) => (
  [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    })
    .map((row, index) => ({ ...row, position: index + 1 }))
);

/**
 * Calculate group standings from fixtures.
 * 
 * @param {Object} group - Group object with { id, name, teams: [], standings?: [] }
 * @param {Array} allFixtures - All fixtures (will be filtered by seasonId and groupId/teams)
 * @param {Array} allTeams - All teams for resolving team data
 * @param {string} seasonId - Season ID to filter fixtures
 * @returns {Array} Computed standings array sorted by points/GD/GF with positions
 */
export const calculateGroupStandings = (group, allFixtures = [], allTeams = [], seasonId = null) => {
  if (!group) return [];

  // Build set of team IDs in this group
  const groupTeamIds = new Set(
    (group.teams || [])
      .map(team => team?.id || team?.teamId)
      .filter(Boolean)
  );

  // Helper to resolve team by ID
  const resolveTeamById = (teamId) => {
    if (!teamId) return null;
    return (
      allTeams.find(team => team.id === teamId) ||
      (group.teams || []).find(team => (team.id || team.teamId) === teamId) ||
      null
    );
  };

  // Filter fixtures for this group (completed only)
  const groupFixtures = allFixtures.filter((fixture) => {
    if (fixture.status !== 'completed') return false;
    // Match by seasonId if provided
    if (seasonId && fixture.seasonId !== seasonId) return false;
    // Match by direct groupId
    const directGroupId = fixture.groupId || fixture.group?.id;
    if (directGroupId && directGroupId === group.id) return true;
    // Fallback: both teams are in this group
    const homeId = fixture.homeTeamId || fixture.homeTeam?.id;
    const awayId = fixture.awayTeamId || fixture.awayTeam?.id;
    return homeId && awayId && groupTeamIds.has(homeId) && groupTeamIds.has(awayId);
  });

  // Helper to ensure a team row exists in the table
  const ensureRow = (table, teamInfo, fallbackId) => {
    const normalizedTeam = teamInfo?.team || teamInfo;
    const teamId = normalizedTeam?.id || normalizedTeam?.teamId || fallbackId;
    if (!teamId) return null;

    if (!table[teamId]) {
      // Always try to resolve from allTeams first to get full team data (including logo)
      const resolvedTeam = resolveTeamById(teamId) || normalizedTeam || { id: teamId, name: 'Unknown Team' };
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

  // If no completed fixtures, return stored standings or zero-initialized rows
  if (!groupFixtures.length) {
    if (group.standings?.length) {
      return sortStandingsList(
        group.standings.map((standing) => ({
          ...standing,
          team: standing.team || resolveTeamById(standing.teamId || standing.team?.id),
          goalDifference: standing.goalDifference ?? ((standing.goalsFor || 0) - (standing.goalsAgainst || 0)),
        }))
      );
    }

    // Return zero-initialized rows for all group teams
    return sortStandingsList(
      (group.teams || []).map((team) => ({
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
      }))
    );
  }

  // Build standings table from fixtures
  const table = {};

  // Initialize rows for all group teams
  (group.teams || []).forEach(team => {
    const teamId = team?.id || team?.teamId;
    if (teamId) {
      ensureRow(table, team, teamId);
    }
  });

  // Process each fixture
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

  // Compute GD and sort
  return sortStandingsList(
    Object.values(table).map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }))
  );
};

export default calculateGroupStandings;
