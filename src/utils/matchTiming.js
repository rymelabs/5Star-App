export const MATCH_BREAK_RATIO = 15 / 90;
export const DEFAULT_REGULATION_MINUTES = 30;
export const AUTO_FULL_TIME_MINUTE = 90;
export const MIN_REGULATION_MINUTES = 30;
export const MAX_REGULATION_MINUTES = 240;
const LEGACY_DEFAULT_REGULATION_MINUTES = 90;

export const LIVE_CLOCK_PHASES = {
  PRE_MATCH: 'pre_match',
  FIRST_HALF: 'first_half',
  HALFTIME: 'halftime',
  SECOND_HALF: 'second_half',
  FULL_TIME: 'full_time'
};

const LEGACY_STATUS_MAP = {
  upcoming: 'scheduled',
  playing: 'live',
  finished: 'completed'
};

export const toCanonicalFixtureStatus = (status) => {
  if (!status) return 'scheduled';
  const normalized = String(status).toLowerCase();
  return LEGACY_STATUS_MAP[normalized] || normalized;
};

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
    return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return null;
};

const normalizeLegacyDefaultMinutes = ({ minutes, source, fixture }) => {
  const fixtureOverride = Number(fixture?.regulationMinutes);
  const hasFixtureOverride = Number.isInteger(fixtureOverride);

  if (
    source === 'default' &&
    !hasFixtureOverride &&
    minutes === LEGACY_DEFAULT_REGULATION_MINUTES
  ) {
    return DEFAULT_REGULATION_MINUTES;
  }

  return minutes;
};

export const validateRegulationMinutes = (value, options = {}) => {
  const { allowNull = false } = options;

  if (value === null || value === undefined || value === '') {
    return allowNull
      ? { valid: true, minutes: null }
      : { valid: false, error: 'Regulation minutes is required.' };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { valid: false, error: 'Regulation minutes must be an integer.' };
  }
  if (parsed < MIN_REGULATION_MINUTES || parsed > MAX_REGULATION_MINUTES) {
    return {
      valid: false,
      error: `Regulation minutes must be between ${MIN_REGULATION_MINUTES} and ${MAX_REGULATION_MINUTES}.`
    };
  }
  if (parsed % 2 !== 0) {
    return { valid: false, error: 'Regulation minutes must be an even number.' };
  }

  return { valid: true, minutes: parsed };
};

export const createMatchTimingSnapshot = (regulationMinutes, source = 'default') => {
  const validation = validateRegulationMinutes(regulationMinutes);
  const safeRegulationMinutes = validation.valid ? validation.minutes : DEFAULT_REGULATION_MINUTES;

  return {
    regulationMinutes: safeRegulationMinutes,
    halfMinutes: safeRegulationMinutes / 2,
    breakMinutes: Math.max(1, Math.round(safeRegulationMinutes * MATCH_BREAK_RATIO)),
    breakRatio: MATCH_BREAK_RATIO,
    source
  };
};

export const resolveFixtureTiming = ({ league, season, fixtureRegulationMinutes } = {}) => {
  const fixtureValidation = validateRegulationMinutes(fixtureRegulationMinutes, { allowNull: true });
  if (fixtureValidation.valid && fixtureValidation.minutes != null) {
    return createMatchTimingSnapshot(fixtureValidation.minutes, 'fixture');
  }

  const seasonOverride = season?.matchTimingOverride?.regulationMinutes;
  const seasonValidation = validateRegulationMinutes(seasonOverride, { allowNull: true });
  if (seasonValidation.valid && seasonValidation.minutes != null) {
    return createMatchTimingSnapshot(seasonValidation.minutes, 'season');
  }

  const leagueDefault = league?.matchTimingDefaults?.regulationMinutes;
  const leagueValidation = validateRegulationMinutes(leagueDefault, { allowNull: true });
  if (leagueValidation.valid && leagueValidation.minutes != null) {
    return createMatchTimingSnapshot(leagueValidation.minutes, 'league');
  }

  return createMatchTimingSnapshot(DEFAULT_REGULATION_MINUTES, 'default');
};

export const resolveMatchTimingFromFixture = (fixture = {}) => {
  const existing = fixture?.matchTiming;
  if (existing && typeof existing === 'object') {
    const validation = validateRegulationMinutes(existing.regulationMinutes, { allowNull: true });
    if (validation.valid && validation.minutes != null) {
      const source = existing.source || 'default';
      const normalizedMinutes = normalizeLegacyDefaultMinutes({
        minutes: validation.minutes,
        source,
        fixture
      });
      return createMatchTimingSnapshot(normalizedMinutes, source);
    }
  }

  const validation = validateRegulationMinutes(fixture?.regulationMinutes, { allowNull: true });
  if (validation.valid && validation.minutes != null) {
    return createMatchTimingSnapshot(validation.minutes, 'fixture');
  }

  return createMatchTimingSnapshot(DEFAULT_REGULATION_MINUTES, 'default');
};

export const getAutoFullTimeMinute = (timingOrFixture = {}) => {
  const timing = Object.prototype.hasOwnProperty.call(timingOrFixture, 'regulationMinutes')
    ? timingOrFixture
    : resolveMatchTimingFromFixture(timingOrFixture);
  const regulation = Number(timing?.regulationMinutes);
  const safeRegulation = Number.isInteger(regulation) ? regulation : DEFAULT_REGULATION_MINUTES;
  return Math.max(safeRegulation, AUTO_FULL_TIME_MINUTE);
};

export const createDefaultLiveClock = (fixture = {}, nowIso = new Date().toISOString()) => {
  const timing = resolveMatchTimingFromFixture(fixture);
  const autoFullTimeMinute = getAutoFullTimeMinute(timing);
  const canonicalStatus = toCanonicalFixtureStatus(fixture.status);
  const isLive = canonicalStatus === 'live';
  const isCompleted = canonicalStatus === 'completed';
  const explicitMinute = Number(fixture.minute ?? fixture?.liveClock?.currentMinute ?? 0);
  const hasExplicitMinute = Number.isFinite(explicitMinute) && explicitMinute > 0;
  const isManualFullTime = String(fixture?.liveClock?.lastTransitionKey || '').startsWith('manual_full_time');
  const completedMinute = hasExplicitMinute
    ? (isManualFullTime ? explicitMinute : Math.max(explicitMinute, autoFullTimeMinute))
    : autoFullTimeMinute;
  const nowMs = toDateMs(nowIso) || Date.now();
  const kickoffMs = toDateMs(fixture.dateTime || fixture.date);
  const livePhaseStartAt = kickoffMs && kickoffMs <= nowMs
    ? new Date(kickoffMs).toISOString()
    : nowIso;

  return {
    phase: isCompleted
      ? LIVE_CLOCK_PHASES.FULL_TIME
      : isLive
        ? LIVE_CLOCK_PHASES.FIRST_HALF
        : LIVE_CLOCK_PHASES.PRE_MATCH,
    phaseStartedAt: isLive ? livePhaseStartAt : nowIso,
    currentMinute: isCompleted ? completedMinute : 0,
    adminPause: false,
    holdSecondHalf: false,
    lastTransitionKey: isCompleted ? `full_time:${completedMinute}` : `init:${Date.now()}`
  };
};
