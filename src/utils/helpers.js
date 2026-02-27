import { LIVE_CLOCK_PHASES, getAutoFullTimeMinute, resolveMatchTimingFromFixture, toCanonicalFixtureStatus } from './matchTiming';

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

export const getCanonicalFixtureStatus = (fixtureOrStatus) => {
  if (typeof fixtureOrStatus === 'string') {
    return toCanonicalFixtureStatus(fixtureOrStatus);
  }
  return toCanonicalFixtureStatus(fixtureOrStatus?.status);
};

export const isFixtureCompleted = (fixture) => getCanonicalFixtureStatus(fixture) === 'completed';

const toDateMs = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return null;
};

const inferPhaseStartedAtMs = ({ phase, phaseStartedAt, kickoffMs, clockMinute, timing, nowMs }) => {
  const explicitPhaseStartMs = toDateMs(phaseStartedAt);
  if (explicitPhaseStartMs != null && explicitPhaseStartMs <= nowMs) {
    return explicitPhaseStartMs;
  }

  if (phase === LIVE_CLOCK_PHASES.FIRST_HALF) {
    if (kickoffMs != null && kickoffMs <= nowMs) {
      return kickoffMs;
    }
    const elapsed = Math.max(0, Math.min(timing.halfMinutes, clockMinute));
    return nowMs - (elapsed * 60000);
  }

  if (phase === LIVE_CLOCK_PHASES.SECOND_HALF) {
    const secondHalfElapsed = Math.max(
      0,
      Math.min(timing.halfMinutes, clockMinute - timing.halfMinutes)
    );
    return nowMs - (secondHalfElapsed * 60000);
  }

  if (phase === LIVE_CLOCK_PHASES.HALFTIME && kickoffMs != null) {
    return Math.min(nowMs, kickoffMs + (timing.halfMinutes * 60000));
  }

  return nowMs;
};

export const getEffectiveFixtureStatus = (fixture) => {
  const derived = getDerivedFixtureLiveState(fixture);
  return derived.status;
};

export const getDerivedFixtureLiveState = (fixture) => {
  if (!fixture) {
    return { status: 'scheduled', isLive: false, minute: 0, phase: 'pre_match', paused: false };
  }

  const status = getCanonicalFixtureStatus(fixture);
  const liveClock = fixture.liveClock || {};
  const timing = resolveMatchTimingFromFixture(fixture);
  const autoFullTimeMinute = getAutoFullTimeMinute(timing);
  const nowMs = Date.now();
  const kickoffMs = toDateMs(fixture.dateTime || fixture.date);
  const paused = Boolean(liveClock.adminPause);

  if (status === 'postponed' || status === 'cancelled') {
    return { status, isLive: false, minute: 0, phase: 'pre_match', paused: false };
  }

  if (status === 'completed') {
    const rawCompletedMinute = Number(liveClock.currentMinute ?? fixture.minute ?? 0);
    const isManualFullTime = String(liveClock.lastTransitionKey || '').startsWith('manual_full_time');
    const completedMinute = Number.isFinite(rawCompletedMinute) && rawCompletedMinute > 0
      ? (isManualFullTime ? rawCompletedMinute : Math.max(rawCompletedMinute, autoFullTimeMinute))
      : autoFullTimeMinute;
    return {
      status: 'completed',
      isLive: false,
      minute: completedMinute,
      phase: LIVE_CLOCK_PHASES.FULL_TIME,
      paused: false
    };
  }

  const minuteFromClock = Number(liveClock.currentMinute);
  const minuteFromFixture = Number(fixture.minute);
  const fallbackMinute = Number.isFinite(minuteFromFixture) ? minuteFromFixture : 0;
  const clockMinute = Number.isFinite(minuteFromClock) ? minuteFromClock : fallbackMinute;

  const autoFromKickoff = () => {
    if (!kickoffMs || nowMs < kickoffMs || liveClock.manualStartOnly) {
      return { status: 'scheduled', isLive: false, minute: 0, phase: LIVE_CLOCK_PHASES.PRE_MATCH, paused: false };
    }
    const elapsed = Math.max(0, Math.floor((nowMs - kickoffMs) / 60000));
    if (elapsed < timing.halfMinutes) {
      return { status: 'live', isLive: true, minute: elapsed, phase: LIVE_CLOCK_PHASES.FIRST_HALF, paused: false };
    }
    if (liveClock.holdSecondHalf || elapsed < timing.halfMinutes + timing.breakMinutes) {
      return { status: 'live', isLive: true, minute: timing.halfMinutes, phase: LIVE_CLOCK_PHASES.HALFTIME, paused: false };
    }
    if (elapsed < autoFullTimeMinute + timing.breakMinutes) {
      const minute = Math.min(
        autoFullTimeMinute,
        timing.halfMinutes + (elapsed - timing.halfMinutes - timing.breakMinutes)
      );
      return { status: 'live', isLive: true, minute, phase: LIVE_CLOCK_PHASES.SECOND_HALF, paused: false };
    }
    return {
      status: 'completed',
      isLive: false,
      minute: autoFullTimeMinute,
      phase: LIVE_CLOCK_PHASES.FULL_TIME,
      paused: false
    };
  };

  if (status === 'scheduled') {
    return autoFromKickoff();
  }

  if (status === 'live') {
    const phase = liveClock.phase;
    if (!phase || phase === LIVE_CLOCK_PHASES.PRE_MATCH) {
      const inferred = autoFromKickoff();
      return { ...inferred, status: 'live', isLive: true };
    }

    if (paused) {
      return { status: 'live', isLive: true, minute: Math.max(0, clockMinute), phase, paused: true };
    }

    const phaseStartedAtMs = inferPhaseStartedAtMs({
      phase,
      phaseStartedAt: liveClock.phaseStartedAt,
      kickoffMs,
      clockMinute,
      timing,
      nowMs
    });

    const elapsed = Math.max(0, Math.floor((nowMs - phaseStartedAtMs) / 60000));
    if (phase === LIVE_CLOCK_PHASES.FIRST_HALF) {
      return {
        status: 'live',
        isLive: true,
        minute: Math.min(timing.halfMinutes, elapsed),
        phase,
        paused: false
      };
    }
    if (phase === LIVE_CLOCK_PHASES.HALFTIME) {
      return { status: 'live', isLive: true, minute: timing.halfMinutes, phase, paused: false };
    }
    if (phase === LIVE_CLOCK_PHASES.SECOND_HALF) {
      return {
        status: 'live',
        isLive: true,
        minute: Math.min(autoFullTimeMinute, timing.halfMinutes + elapsed),
        phase,
        paused: false
      };
    }
    return { status: 'live', isLive: true, minute: Math.max(0, clockMinute), phase, paused: false };
  }

  return { status, isLive: false, minute: Math.max(0, clockMinute), phase: LIVE_CLOCK_PHASES.PRE_MATCH, paused: false };
};

export const getFixtureLiveBadgeState = (fixture) => {
  const derived = getDerivedFixtureLiveState(fixture);
  if (derived.status === 'completed') return { live: false, text: 'FT' };
  if (derived.status === 'postponed') return { live: false, text: 'Postponed' };
  if (derived.status === 'cancelled') return { live: false, text: 'Cancelled' };
  if (!derived.isLive) return { live: false, text: '' };
  if (derived.paused) return { live: true, text: 'PAUSED' };
  if (derived.phase === LIVE_CLOCK_PHASES.HALFTIME) return { live: true, text: 'HT' };
  return { live: true, text: `${Math.max(0, derived.minute)}'` };
};

// Check if a fixture is currently live
export const isFixtureLive = (fixture) => {
  return getDerivedFixtureLiveState(fixture).isLive;
};

export const getFixtureMinute = (fixture) => {
  return getDerivedFixtureLiveState(fixture).minute;
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

/**
 * Convert various video platform URLs to their embed formats
 * @param {string} url - The original video URL
 * @returns {string} - The embeddable URL
 */
export const getEmbedUrl = (url) => {
  if (!url) return '';

  // YouTube
  // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/live/ID, m.youtube.com, etc.
  const ytMatch = url.match(/(?:(?:m|www)\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/|live\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }

  // Vimeo
  // Supports: vimeo.com/ID, player.vimeo.com/video/ID
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
};
