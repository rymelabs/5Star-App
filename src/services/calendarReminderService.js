/**
 * Calendar Reminder Service
 * Automatically manages calendar reminders for followed teams and notification settings
 */

import { addFixtureToCalendar, shouldAddCalendarReminder } from '../utils/calendar';

/**
 * Get upcoming fixtures for a specific team
 * @param {Array} allFixtures - All fixtures
 * @param {string} teamId - Team ID
 * @param {number} daysAhead - Number of days to look ahead (default: 30)
 * @returns {Array} - Upcoming fixtures for the team
 */
export const getUpcomingFixturesForTeam = (allFixtures, teamId, daysAhead = 30) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return allFixtures.filter(fixture => {
    const fixtureDate = new Date(fixture.dateTime);
    const isUpcoming = fixtureDate > now && fixtureDate <= futureDate;
    const involvesTeam = 
      fixture.homeTeam?.id === teamId || 
      fixture.awayTeam?.id === teamId;
    
    return isUpcoming && involvesTeam && fixture.status !== 'completed';
  });
};

/**
 * Add calendar reminders for a team's upcoming fixtures
 * @param {string} teamId - Team ID
 * @param {Array} allFixtures - All fixtures
 * @param {Object} notificationSettings - User notification settings
 * @returns {Promise<number>} - Number of fixtures added to calendar
 */
export const addCalendarRemindersForTeam = async (teamId, allFixtures, notificationSettings = {}) => {
  // Check if user has enabled upcoming match notifications
  if (!notificationSettings.upcomingMatches) {
    return 0;
  }

  const upcomingFixtures = getUpcomingFixturesForTeam(allFixtures, teamId);
  
  if (upcomingFixtures.length === 0) {
    return 0;
  }

  let addedCount = 0;
  const calendarReminders = getCalendarReminders();

  for (const fixture of upcomingFixtures) {
    // Skip if already added to calendar
    if (calendarReminders.includes(fixture.id)) {
      continue;
    }

    try {
      const success = await addFixtureToCalendar(fixture);
      if (success) {
        saveCalendarReminder(fixture.id);
        addedCount++;
      }
    } catch (error) {
      /* ignore calendar add failures */
    }
  }

  return addedCount;
};

/**
 * Remove calendar reminders for a team's fixtures
 * Note: Since we're using .ics downloads, we can't actually delete from the calendar
 * We just remove from our tracking list
 * @param {string} teamId - Team ID
 * @param {Array} allFixtures - All fixtures
 */
export const removeCalendarRemindersForTeam = (teamId, allFixtures) => {
  const teamFixtures = allFixtures.filter(fixture => 
    fixture.homeTeam?.id === teamId || fixture.awayTeam?.id === teamId
  );
  
  const calendarReminders = getCalendarReminders();
  const fixtureIds = teamFixtures.map(f => f.id);
  
  const updatedReminders = calendarReminders.filter(id => !fixtureIds.includes(id));
  localStorage.setItem('calendarReminders', JSON.stringify(updatedReminders));
};

/**
 * Get all calendar reminders from localStorage
 * @returns {Array} - Array of fixture IDs
 */
export const getCalendarReminders = () => {
  try {
    const saved = localStorage.getItem('calendarReminders');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Save a calendar reminder to localStorage
 * @param {string} fixtureId - Fixture ID
 */
export const saveCalendarReminder = (fixtureId) => {
  try {
    const reminders = getCalendarReminders();
    if (!reminders.includes(fixtureId)) {
      reminders.push(fixtureId);
      localStorage.setItem('calendarReminders', JSON.stringify(reminders));
    }
  } catch (error) {
    /* ignore storage failures */
  }
};

/**
 * Sync calendar reminders for all followed teams
 * @param {Array} followedTeamIds - Array of team IDs user follows
 * @param {Array} allFixtures - All fixtures
 * @param {Object} notificationSettings - User notification settings
 * @returns {Promise<number>} - Total number of fixtures added
 */
export const syncCalendarForFollowedTeams = async (followedTeamIds, allFixtures, notificationSettings) => {
  if (!notificationSettings.upcomingMatches || !notificationSettings.teamFollowing) {
    return 0;
  }

  let totalAdded = 0;

  for (const teamId of followedTeamIds) {
    const added = await addCalendarRemindersForTeam(teamId, allFixtures, notificationSettings);
    totalAdded += added;
  }

  return totalAdded;
};

/**
 * Get user's followed team IDs
 * @param {Array} allTeams - All teams
 * @param {string} userId - User ID
 * @returns {Array} - Array of followed team IDs
 */
export const getFollowedTeamIds = (allTeams, userId) => {
  if (!userId) return [];
  
  return allTeams
    .filter(team => (team.followers || []).includes(userId))
    .map(team => team.id);
};

/**
 * Check if calendar sync is enabled in settings
 * @param {Object} notificationSettings - User notification settings
 * @returns {boolean}
 */
export const isCalendarSyncEnabled = (notificationSettings) => {
  return Boolean(
    notificationSettings.teamFollowing && 
    notificationSettings.upcomingMatches
  );
};
