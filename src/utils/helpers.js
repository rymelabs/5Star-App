// String utilities
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const capitalizeWords = (text) => {
  return text.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const formatScore = (homeScore, awayScore) => {
  if (homeScore === undefined || awayScore === undefined) {
    return 'vs';
  }
  return `${homeScore} - ${awayScore}`;
};

// Abbreviate team names
export const abbreviateTeamName = (teamName) => {
  if (!teamName || typeof teamName !== 'string') return '';
  
  const words = teamName.trim().split(/\s+/);
  
  // Normalize words: remove empty, filter out small tokens if necessary
  const cleaned = words.filter(w => w && w.length > 0);

  // Single word: first 3 letters
  if (cleaned.length === 1) {
    return cleaned[0].substring(0, 3).toUpperCase();
  }

  // Two words: first letter of first word + first two letters of second word
  if (cleaned.length === 2) {
    const first = cleaned[0].charAt(0).toUpperCase();
    const second = (cleaned[1].substring(0, 2).toUpperCase() + '  ').substring(0, 2);
    return (first + second).toUpperCase();
  }

  // Three or more words: first letter of first three words
  const initials = cleaned.slice(0, 3).map(w => w.charAt(0).toUpperCase()).join('');
  return initials;
};

// Check if a fixture is currently live
export const isFixtureLive = (fixture) => {
  if (!fixture) return false;

  const rawStatus = fixture.status;
  const normalizedStatus = String(rawStatus || '').trim().toLowerCase();

  // Never treat postponed/cancelled/TBD fixtures as live
  if (
    normalizedStatus === 'pst' ||
    normalizedStatus === 'postponed' ||
    normalizedStatus === 'tbd' ||
    normalizedStatus === 'canc' ||
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled'
  ) {
    return false;
  }
  
  // If admin marked it as live or playing, it's live
  if (fixture.status === 'live' || fixture.status === 'playing') {
    return true;
  }
  
  // Check if match time has started but less than 2 hours have passed
  const matchTime = new Date(fixture.dateTime);
  const now = new Date();
  const timeDiff = now - matchTime; // milliseconds
  
  // Match is live if:
  // - Current time is after match start time
  // - Less than 2 hours (7200000 ms) have passed since match start
  const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  
  return timeDiff >= 0 && timeDiff <= twoHours;
};

const getFixtureTeamIds = (fixture) => {
  const homeId = fixture?.homeTeam?.id || fixture?.homeTeamId || fixture?.homeTeam?.teamId;
  const awayId = fixture?.awayTeam?.id || fixture?.awayTeamId || fixture?.awayTeam?.teamId;
  return [homeId, awayId].filter(Boolean);
};

export const getLiveTeamIds = (fixtures = []) => {
  const liveIds = new Set();
  if (!Array.isArray(fixtures) || fixtures.length === 0) return liveIds;

  fixtures.forEach((fixture) => {
    if (!isFixtureLive(fixture)) return;
    getFixtureTeamIds(fixture).forEach((id) => liveIds.add(id));
  });

  return liveIds;
};

// Number utilities
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Array utilities
export const groupBy = (array, iteratee) => {
  if (!Array.isArray(array)) return {};
  return array.reduce((groups, item) => {
    const rawKey = typeof iteratee === 'function' ? iteratee(item) : item?.[iteratee];
    const key = rawKey ?? '__undefined__';
    const normalizedKey = typeof key === 'string' || typeof key === 'number' ? key : String(key);
    if (!groups[normalizedKey]) {
      groups[normalizedKey] = [];
    }
    groups[normalizedKey].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

// Color utilities
export const getPositionColor = (position) => {
  if (position <= 4) return 'text-primary-400'; // Champions League
  if (position <= 6) return 'text-accent-400'; // Europa League
  if (position >= 18) return 'text-red-400'; // Relegation
  return 'text-gray-300'; // Mid-table
};

export const getFormColor = (result) => {
  switch (result) {
    case 'W': return 'bg-primary-600';
    case 'D': return 'bg-yellow-600';
    case 'L': return 'bg-red-600';
    default: return 'bg-gray-600';
  }
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Local storage utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
  }
};
