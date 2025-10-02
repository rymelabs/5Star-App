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
  
  // Single word team name - return first 3 letters
  if (words.length === 1) {
    return teamName.substring(0, 3).toUpperCase();
  }
  
  // Multi-word team name - first letter of first word + first letters of other words
  const firstWord = words[0];
  const otherWords = words.slice(1);
  
  const abbreviation = firstWord.charAt(0).toUpperCase() + 
    otherWords.map(word => word.charAt(0).toUpperCase()).join('');
  
  return abbreviation;
};

// Check if a fixture is currently live
export const isFixtureLive = (fixture) => {
  if (!fixture) return false;
  
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
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
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
    console.error(`Error getting item from localStorage: ${error}`);
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item to localStorage: ${error}`);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item from localStorage: ${error}`);
  }
};