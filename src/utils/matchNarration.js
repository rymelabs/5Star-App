const FALLBACK_KEY = 'match.narration.fallback';

const DEFAULT_VARIANT_COUNT = 20;
const GOAL_DYNAMIC_KEY = 'match.narration.goal.dynamic';
const GOAL_OVERTURNED_DYNAMIC_KEY = 'match.narration.goal.overturned.dynamic';
const KICKOFF_DYNAMIC_KEY = 'match.narration.kickoff.dynamic';
const SECOND_HALF_DYNAMIC_KEY = 'match.narration.second_half.dynamic';

const GOAL_OPENERS = [
  'Lightning strike!',
  'Clinical edge!',
  'Pure quality!',
  'Classy finish!',
  'Ice-cold execution!',
  'Ruthless moment!',
  'What a move!',
  'Top-drawer work!',
  'Big attacking statement!',
  'Brilliant delivery!',
  'Sharp, sharp football!',
  'They make it count!',
  'No mercy in that finish!',
  'Surgical in front of goal!',
  'That is footballing craft!',
  'A killer touch!',
  'Brutal in transition!',
  'Direct and decisive!',
  'Precision under pressure!',
  'A thunderous response!'
];

const GOAL_MIDDLES = [
  '{teamName} has scored.',
  '{teamName} are on the board.',
  '{teamName} find the breakthrough.',
  '{teamName} convert their pressure.',
  '{teamName} carve open the defence.',
  '{teamName} punish a loose moment.',
  '{teamName} hit with intent.',
  '{teamName} turn possession into reward.',
  '{teamName} make that attack count.',
  '{teamName} land another attacking blow.',
  '{scorerName} delivers for {teamName}.',
  '{scorerName} puts {teamName} in front.',
  '{scorerName} drags {teamName} level.',
  '{scorerName} finishes that move in style.',
  '{scorerName} fires home for {teamName}.'
];

const GOAL_CLOSERS = [
  'Score now {homeScore}-{awayScore}.',
  'The crowd erupts in response.',
  'That changes the rhythm of this game.',
  'No answer from the back line there.',
  'A huge turning point in this contest.',
  'The pressure has finally told.',
  'Momentum swings immediately.',
  'Defenders left chasing shadows.',
  'The stadium is absolutely alive.',
  'The final touch was unstoppable.',
  'They smelled blood and took it.',
  'Game on in a big way.'
];

const GOAL_OVERTURNED_TEMPLATES = [
  'VAR intervention: goal overturned for {teamName}.',
  'After review, {teamName} lose that goal.',
  'No goal. {teamName} see it wiped off.',
  'The finish is cancelled for {teamName}.',
  'Decision changed: goal removed from {teamName}.',
  'Big reversal: {teamName} have that goal struck out.',
  'The board changes, {teamName} lose the goal.',
  'Review complete: {teamName} are denied.',
  '{teamName} thought they had it, but it is overturned.',
  'The goal does not stand for {teamName}.',
  'Call corrected: {teamName} are pulled back.',
  'That strike is disallowed for {teamName}.',
  '{teamName} have a goal overturned after checks.',
  'Reversal confirmed: no goal for {teamName}.',
  '{teamName} are pegged back by the decision.',
  'Score correction applied against {teamName}.',
  'The referee overturns it, {teamName} lose out.',
  'The crowd reacts as {teamName} lose that goal.',
  'Momentum shift: {teamName} have a goal ruled out.',
  'Re-check done, goal removed for {teamName}.',
  'Goal chalked off for {teamName}.',
  'Overturned after review, {teamName} are denied.',
  '{teamName} will not count that finish.',
  'Final verdict: goal overturned for {teamName}.'
];

const KICKOFF_OPENERS = [
  'The whistle goes!',
  'We are underway!',
  'Kickoff confirmed!',
  'The game is live!',
  'Action begins now!',
  'Matchday energy is on!',
  'The contest has started!',
  'First-half football begins!',
  'The battle starts here!',
  'Let the football flow!',
  'The opening phase is active!',
  'It starts right now!',
  'The first whistle has sounded!',
  'Game tempo starts building!',
  'The opening exchanges begin!',
  'We have lift-off!',
  'First touches are in!',
  'The stadium rises together!',
  'Here we go!',
  'The opener is in motion!'
];

const KICKOFF_MIDDLES = [
  '{homeTeam} and {awayTeam} are both probing early.',
  '{homeTeam} and {awayTeam} settle into shape.',
  '{homeTeam} push forward while {awayTeam} hold firm.',
  '{awayTeam} press the ball as {homeTeam} build from deep.',
  '{homeTeam} and {awayTeam} are testing each other quickly.',
  '{homeTeam} look to control, {awayTeam} look to break.',
  '{awayTeam} and {homeTeam} trade early territory.',
  '{homeTeam} and {awayTeam} are feeling out the pace.',
  '{homeTeam} start with possession, {awayTeam} stay compact.',
  '{awayTeam} chase an early opening against {homeTeam}.',
  '{homeTeam} and {awayTeam} are straight into duels.',
  '{homeTeam} and {awayTeam} begin with intent.'
];

const KICKOFF_CLOSERS = [
  'The tone is set for a huge contest.',
  'Every touch already matters.',
  'Early intensity is obvious.',
  'Momentum is up for grabs.',
  'Both teams want first blood.',
  'The crowd is fully locked in.',
  'No one is holding back.',
  'The tactical chess match begins.',
  'This one is alive from the start.',
  'The first chapter is underway.'
];

const SECOND_HALF_OPENERS = [
  'Second half begins!',
  'We are back for the second half!',
  'Play resumes after the break!',
  'The restart whistle sounds!',
  'Half two is now live!',
  'The second period starts now!',
  'Action is back underway!',
  'Teams return and we continue!',
  'The match resumes for half two!',
  'The second-half chapter opens!',
  'Back to football after the interval!',
  'The game restarts for the final stretch!',
  'We are moving again after HT!',
  'The next 45 is now in motion!',
  'Second-half intensity begins!',
  'Players are back and ready!',
  'Half-time is over, play continues!',
  'The second-half whistle has gone!',
  'It is live again after the break!',
  'Restart complete, second half active!'
];

const SECOND_HALF_MIDDLES = [
  '{homeTeam} and {awayTeam} return with fresh urgency.',
  '{homeTeam} try to control the pace while {awayTeam} press high.',
  '{awayTeam} look to turn the game as {homeTeam} stay disciplined.',
  '{homeTeam} and {awayTeam} are straight into key duels.',
  '{awayTeam} and {homeTeam} are pushing for the next big moment.',
  '{homeTeam} and {awayTeam} continue where they left off.',
  '{homeTeam} search for control while {awayTeam} chase a swing.',
  '{awayTeam} attack quickly as {homeTeam} reorganize.',
  '{homeTeam} and {awayTeam} resume with tactical adjustments.',
  '{homeTeam} and {awayTeam} are battling for midfield command.',
  '{homeTeam} and {awayTeam} resume with clear intent.',
  '{homeTeam} and {awayTeam} restart with everything to play for.'
];

const SECOND_HALF_CLOSERS = [
  'The next phase could decide everything.',
  'Pressure rises with every minute.',
  'The result is still there to be claimed.',
  'This is where control matters most.',
  'The game opens up again.',
  'One moment can change the story.',
  'Both benches will watch every move.',
  'The tempo is ready to spike.',
  'The decisive stretch is underway.',
  'No room for errors now.'
];

const GOAL_COMBINATION_COUNT = GOAL_OPENERS.length * GOAL_MIDDLES.length * GOAL_CLOSERS.length;
const KICKOFF_COMBINATION_COUNT = KICKOFF_OPENERS.length * KICKOFF_MIDDLES.length * KICKOFF_CLOSERS.length;
const SECOND_HALF_COMBINATION_COUNT = SECOND_HALF_OPENERS.length * SECOND_HALF_MIDDLES.length * SECOND_HALF_CLOSERS.length;

const interpolate = (template, params = {}) => {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
};

export const getNarrationBucket = ({ phase, homeScore, awayScore }) => {
  if (phase === 'halftime') {
    if (homeScore === 0 && awayScore === 0) return { group: 'ht', bucket: 'goalless' };
    if (homeScore === awayScore) return { group: 'ht', bucket: 'scoringDraw' };
    return homeScore > awayScore
      ? { group: 'ht', bucket: 'homeLead' }
      : { group: 'ht', bucket: 'awayLead' };
  }

  if (homeScore === awayScore) return { group: 'ft', bucket: 'draw' };
  return homeScore > awayScore
    ? { group: 'ft', bucket: 'homeWin' }
    : { group: 'ft', bucket: 'awayWin' };
};

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeGoalParams = (params = {}) => ({
  ...params,
  teamName: params.teamName || params.homeTeam || params.awayTeam || 'A team',
  scorerName: params.scorerName || 'The scorer',
  homeScore: params.homeScore ?? 0,
  awayScore: params.awayScore ?? 0
});

const resolveGoalDynamicText = (params = {}) => {
  const normalized = normalizeGoalParams(params);
  const seed = `${normalized.teamName}:${normalized.scorerName}:${normalized.minute}:${normalized.homeScore}-${normalized.awayScore}`;
  const rawVariant = Number.isFinite(Number(normalized.variantIndex))
    ? Number(normalized.variantIndex)
    : hashString(seed);
  const variant = Math.abs(rawVariant) % GOAL_COMBINATION_COUNT;

  const openerIndex = variant % GOAL_OPENERS.length;
  const middleIndex = Math.floor(variant / GOAL_OPENERS.length) % GOAL_MIDDLES.length;
  const closerIndex = Math.floor(variant / (GOAL_OPENERS.length * GOAL_MIDDLES.length)) % GOAL_CLOSERS.length;

  const sentence = `${GOAL_OPENERS[openerIndex]} ${GOAL_MIDDLES[middleIndex]} ${GOAL_CLOSERS[closerIndex]}`;
  return interpolate(sentence, normalized).replace(/\s+/g, ' ').trim();
};

const normalizeGoalOverturnedParams = (params = {}) => ({
  ...params,
  teamName: params.teamName || params.homeTeam || params.awayTeam || 'A team',
  homeScore: params.homeScore ?? 0,
  awayScore: params.awayScore ?? 0
});

const resolveGoalOverturnedText = (params = {}) => {
  const normalized = normalizeGoalOverturnedParams(params);
  const seed = `${normalized.teamName}:${normalized.minute}:${normalized.homeScore}-${normalized.awayScore}:overturned`;
  const rawVariant = Number.isFinite(Number(normalized.variantIndex))
    ? Number(normalized.variantIndex)
    : hashString(seed);
  const variant = Math.abs(rawVariant) % GOAL_OVERTURNED_TEMPLATES.length;
  return interpolate(GOAL_OVERTURNED_TEMPLATES[variant], normalized).replace(/\s+/g, ' ').trim();
};

const normalizeTransitionParams = (params = {}) => ({
  ...params,
  homeTeam: params.homeTeam || 'Home',
  awayTeam: params.awayTeam || 'Away'
});

const resolveKickoffDynamicText = (params = {}) => {
  const normalized = normalizeTransitionParams(params);
  const seed = `${normalized.homeTeam}:${normalized.awayTeam}:kickoff`;
  const rawVariant = Number.isFinite(Number(normalized.variantIndex))
    ? Number(normalized.variantIndex)
    : hashString(seed);
  const variant = Math.abs(rawVariant) % KICKOFF_COMBINATION_COUNT;

  const openerIndex = variant % KICKOFF_OPENERS.length;
  const middleIndex = Math.floor(variant / KICKOFF_OPENERS.length) % KICKOFF_MIDDLES.length;
  const closerIndex = Math.floor(variant / (KICKOFF_OPENERS.length * KICKOFF_MIDDLES.length)) % KICKOFF_CLOSERS.length;

  const sentence = `${KICKOFF_OPENERS[openerIndex]} ${KICKOFF_MIDDLES[middleIndex]} ${KICKOFF_CLOSERS[closerIndex]}`;
  return interpolate(sentence, normalized).replace(/\s+/g, ' ').trim();
};

const resolveSecondHalfDynamicText = (params = {}) => {
  const normalized = normalizeTransitionParams(params);
  const seed = `${normalized.homeTeam}:${normalized.awayTeam}:second_half`;
  const rawVariant = Number.isFinite(Number(normalized.variantIndex))
    ? Number(normalized.variantIndex)
    : hashString(seed);
  const variant = Math.abs(rawVariant) % SECOND_HALF_COMBINATION_COUNT;

  const openerIndex = variant % SECOND_HALF_OPENERS.length;
  const middleIndex = Math.floor(variant / SECOND_HALF_OPENERS.length) % SECOND_HALF_MIDDLES.length;
  const closerIndex = Math.floor(variant / (SECOND_HALF_OPENERS.length * SECOND_HALF_MIDDLES.length)) % SECOND_HALF_CLOSERS.length;

  const sentence = `${SECOND_HALF_OPENERS[openerIndex]} ${SECOND_HALF_MIDDLES[middleIndex]} ${SECOND_HALF_CLOSERS[closerIndex]}`;
  return interpolate(sentence, normalized).replace(/\s+/g, ' ').trim();
};

export const pickNarrationVariantIndex = ({
  fixtureId,
  phase,
  homeScore,
  awayScore,
  variantCount = DEFAULT_VARIANT_COUNT
}) => {
  const seed = `${fixtureId || 'fixture'}:${phase}:${homeScore}-${awayScore}`;
  const safeCount = Number.isInteger(variantCount) && variantCount > 0 ? variantCount : DEFAULT_VARIANT_COUNT;
  return hashString(seed) % safeCount;
};

export const buildSystemCommentaryEvent = ({
  fixtureId,
  phase,
  minute,
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  createdAt = new Date().toISOString()
}) => {
  const { group, bucket } = getNarrationBucket({ phase, homeScore, awayScore });
  const variantIndex = pickNarrationVariantIndex({
    fixtureId,
    phase,
    homeScore,
    awayScore
  });

  return {
    id: `system-${phase}-${fixtureId || 'fixture'}-${homeScore}-${awayScore}`,
    type: 'system_commentary',
    isSystem: true,
    minute,
    createdAt,
    templateKey: `match.narration.${group}.${bucket}`,
    templateParams: {
      homeTeam: homeTeamName || 'Home',
      awayTeam: awayTeamName || 'Away',
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      minute,
      variantIndex
    },
    transitionPhase: phase
  };
};

export const resolveSystemCommentaryText = (event, t) => {
  if (!event || !event.isSystem || event.type !== 'system_commentary') return null;

  const params = event.templateParams || {};
  if (event.templateKey === GOAL_DYNAMIC_KEY || event.transitionPhase === 'goal') {
    return resolveGoalDynamicText(params);
  }
  if (event.templateKey === GOAL_OVERTURNED_DYNAMIC_KEY || event.transitionPhase === 'goal_overturned') {
    return resolveGoalOverturnedText(params);
  }
  if (event.templateKey === KICKOFF_DYNAMIC_KEY || event.transitionPhase === 'kickoff') {
    return resolveKickoffDynamicText(params);
  }
  if (event.templateKey === SECOND_HALF_DYNAMIC_KEY || event.transitionPhase === 'second_half_start') {
    return resolveSecondHalfDynamicText(params);
  }

  const templates = t(event.templateKey);

  if (Array.isArray(templates) && templates.length > 0) {
    const index = Math.abs(Number(params.variantIndex) || 0) % templates.length;
    return interpolate(templates[index], params);
  }

  const fallback = t(FALLBACK_KEY);
  if (typeof fallback === 'string') {
    return interpolate(fallback, params);
  }

  return `${params.homeTeam || 'Home'} ${params.homeScore ?? 0}-${params.awayScore ?? 0} ${params.awayTeam || 'Away'}`;
};
