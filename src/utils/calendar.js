/**
 * Calendar utility functions for adding fixtures to device calendar
 * Generates .ics (iCalendar) files that can be downloaded and opened
 * with any calendar app (Google Calendar, Apple Calendar, Outlook, etc.)
 */

/**
 * Format date to iCalendar format (YYYYMMDDTHHMMSSZ)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted date string
 */
const formatICalDate = (date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Generate a unique ID for calendar events
 * @returns {string} - Unique event ID
 */
const generateEventId = () => {
  return `fixture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@fivescores.com`;
};

/**
 * Create an iCalendar (.ics) file for a fixture
 * @param {Object} fixture - Fixture object with match details
 * @returns {Blob} - Blob object containing the .ics file data
 */
export const createFixtureCalendarEvent = (fixture) => {
  if (!fixture || !fixture.dateTime) {
    throw new Error('Invalid fixture data');
  }

  const startDate = new Date(fixture.dateTime);
  // Assume match duration is 2 hours (including potential extra time)
  const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
  
  // Create reminder: 1 hour before the match
  const reminderDate = new Date(startDate.getTime() - (60 * 60 * 1000));
  
  const homeTeam = fixture.homeTeam?.name || 'Home Team';
  const awayTeam = fixture.awayTeam?.name || 'Away Team';
  const venue = fixture.venue || 'TBD';
  const round = fixture.round || 'Match';
  
  // Build the iCalendar content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fivescores//Fixture Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Fivescores',
    'X-WR-TIMEZONE:UTC',
    'BEGIN:VEVENT',
    `UID:${generateEventId()}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${homeTeam} vs ${awayTeam}`,
    `DESCRIPTION:${round}\\n${homeTeam} vs ${awayTeam}\\nVenue: ${venue}\\n\\nAdded via Fivescores App`,
    `LOCATION:${venue}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H', // 1 hour before
    'DESCRIPTION:Match starts in 1 hour',
    'ACTION:DISPLAY',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M', // 15 minutes before
    'DESCRIPTION:Match starts in 15 minutes',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Create blob with proper MIME type
  return new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
};

/**
 * Download a calendar event file
 * @param {Object} fixture - Fixture object
 * @param {string} filename - Optional filename (default: auto-generated)
 */
export const downloadFixtureCalendar = (fixture) => {
  try {
    const icsBlob = createFixtureCalendarEvent(fixture);
    const homeTeam = fixture.homeTeam?.name || 'Home';
    const awayTeam = fixture.awayTeam?.name || 'Away';
    const date = new Date(fixture.dateTime).toISOString().split('T')[0];
    const filename = `${homeTeam}_vs_${awayTeam}_${date}.ics`.replace(/\s+/g, '_');
    
    // Create download link
    const url = URL.createObjectURL(icsBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Add fixture to calendar (attempts to use native calendar APIs if available,
 * otherwise falls back to downloading .ics file)
 * @param {Object} fixture - Fixture object
 * @returns {Promise<boolean>} - Success status
 */
export const addFixtureToCalendar = async (fixture) => {
  // Check if device supports native calendar API (experimental)
  // This is not widely supported yet, so we'll use .ics download as primary method
  
  // For now, always use .ics download method
  return downloadFixtureCalendar(fixture);
};

/**
 * Check if a fixture should trigger a calendar reminder
 * based on user settings and team following
 * @param {Object} fixture - Fixture object
 * @param {Array} followedTeams - Array of team IDs the user follows
 * @param {Object} notificationSettings - User notification preferences
 * @returns {boolean} - Whether to add calendar reminder
 */
export const shouldAddCalendarReminder = (fixture, followedTeams = [], notificationSettings = {}) => {
  if (!fixture || !fixture.homeTeam || !fixture.awayTeam) {
    return false;
  }
  
  // Check if notifications are enabled
  if (!notificationSettings.upcomingMatches) {
    return false;
  }
  
  // Check if user follows either team
  const followsHomeTeam = followedTeams.includes(fixture.homeTeam.id);
  const followsAwayTeam = followedTeams.includes(fixture.awayTeam.id);
  
  return followsHomeTeam || followsAwayTeam;
};

/**
 * Batch add multiple fixtures to calendar
 * @param {Array} fixtures - Array of fixture objects
 * @returns {Promise<number>} - Number of successfully added events
 */
export const addMultipleFixturesToCalendar = async (fixtures) => {
  let successCount = 0;
  
  for (const fixture of fixtures) {
    try {
      const success = await addFixtureToCalendar(fixture);
      if (success) successCount++;
    } catch (error) {
      /* ignore calendar add errors */
    }
  }
  
  return successCount;
};

/**
 * Format fixture details for calendar description
 * @param {Object} fixture - Fixture object
 * @returns {string} - Formatted description
 */
export const formatFixtureDescription = (fixture) => {
  const parts = [];
  
  if (fixture.round) parts.push(fixture.round);
  if (fixture.homeTeam?.name && fixture.awayTeam?.name) {
    parts.push(`${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
  }
  if (fixture.venue) parts.push(`Venue: ${fixture.venue}`);
  if (fixture.seasonName) parts.push(`Season: ${fixture.seasonName}`);
  
  parts.push('\\nAdded via Fivescores App');
  
  return parts.join('\\n');
};
