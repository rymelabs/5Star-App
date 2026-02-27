# Match Playtime, Auto-Clock, Dynamic Facts, and Goal Celebration - Execution Plan

## Summary
Implement match timing defaults with precedence `league -> season -> fixture`, add a server-authoritative live clock with automatic halftime/fulltime transitions, persist localized system commentary in fixture events (120+ variants), display live minute/HT states in fixture detail, and add goal celebration animation on fixture detail.  
This plan is execution-ready and should be written to `docs/match-playtime-execution-plan.md` before implementation.

## Execution File Map
1. [src/firebase/firestore.js](/Users/mac/5Star-App/src/firebase/firestore.js)
2. [src/context/FootballContext.jsx](/Users/mac/5Star-App/src/context/FootballContext.jsx)
3. [src/pages/admin/CreateLeague.jsx](/Users/mac/5Star-App/src/pages/admin/CreateLeague.jsx)
4. [src/pages/admin/EditLeague.jsx](/Users/mac/5Star-App/src/pages/admin/EditLeague.jsx)
5. [src/pages/admin/CreateSeason.jsx](/Users/mac/5Star-App/src/pages/admin/CreateSeason.jsx)
6. [src/pages/admin/EditSeason.jsx](/Users/mac/5Star-App/src/pages/admin/EditSeason.jsx)
7. [src/pages/admin/AdminFixtures.jsx](/Users/mac/5Star-App/src/pages/admin/AdminFixtures.jsx)
8. [src/pages/admin/SeasonDetail.jsx](/Users/mac/5Star-App/src/pages/admin/SeasonDetail.jsx)
9. [functions/index.js](/Users/mac/5Star-App/functions/index.js)
10. [src/utils/helpers.js](/Users/mac/5Star-App/src/utils/helpers.js)
11. [src/pages/FixtureDetail.jsx](/Users/mac/5Star-App/src/pages/FixtureDetail.jsx)
12. [src/locales/en.json](/Users/mac/5Star-App/src/locales/en.json)
13. [src/locales/yo.json](/Users/mac/5Star-App/src/locales/yo.json)
14. [src/locales/ig.json](/Users/mac/5Star-App/src/locales/ig.json)
15. [src/locales/ha.json](/Users/mac/5Star-App/src/locales/ha.json)
16. `scripts/migrations/backfill-match-timing.mjs` (new)
17. `src/utils/matchTiming.js` (new)
18. `src/utils/matchNarration.js` (new)
19. `src/components/GoalCelebrationOverlay.jsx` (new)

## Public APIs, Interfaces, and Type Contract Changes
1. `leagues` documents add:
`matchTimingDefaults: { regulationMinutes: number, breakRatio: number }`
2. `seasons` documents add:
`matchTimingOverride: { regulationMinutes: number | null }`
3. `fixtures` documents add frozen timing snapshot:
`matchTiming: { regulationMinutes, halfMinutes, breakMinutes, breakRatio, source }`
4. `fixtures` documents add live clock state:
`liveClock: { phase, phaseStartedAt, currentMinute, adminPause, holdSecondHalf, lastTransitionKey }`
5. `fixtures.events[]` supports system commentary:
`{ id, type: "system_commentary", isSystem: true, templateKey, templateParams, minute, createdAt }`
6. Canonical fixture statuses become:
`scheduled | live | completed | postponed | cancelled`
with adapters mapping legacy `upcoming/playing/finished`.

## Implementation Plan
1. Create documentation artifact first.
Create `docs/match-playtime-execution-plan.md` with this exact content before editing feature code.
2. Add timing math and validation utilities.
Implement `resolveFixtureTiming` and `validateRegulationMinutes` in `src/utils/matchTiming.js`.
Apply fixed formula:
`halfMinutes = regulationMinutes / 2`
`breakMinutes = max(1, round(regulationMinutes * (15/90)))`
Rules: integer, even, range `30-240`.
3. Extend League and Season admin forms.
League create/edit: add `regulationMinutes` input and live preview of half/break.
Season create/edit: add optional override input; blank means inherit league.
Persist new fields through `leaguesCollection` and `seasonsCollection`.
4. Extend Fixture creation/edit and generation paths.
Admin fixture create/edit: optional fixture override for `regulationMinutes`; resolve final timing and save `matchTiming`.
Season fixture generation/manual creation: always write resolved `matchTiming`.
Apply same resolver across all fixture write paths to avoid drift.
5. Add server-authoritative live clock engine in Cloud Functions.
Add scheduled function every 1 minute in `functions/index.js`.
Transitions:
scheduled kickoff -> first_half
first_half duration reached -> halftime
halftime break reached and `holdSecondHalf=false` -> second_half
second_half duration reached -> full_time + `status=completed`
Persist both `liveClock.currentMinute` and legacy `fixture.minute`.
Use transactions + `lastTransitionKey` for idempotency.
6. Add admin runtime controls in fixtures management.
Add actions: `Pause`, `Resume`, `Hold 2nd Half`, `Start 2nd Half`, `End Match`.
Behavior:
`Pause` freezes clock at current minute.
`Resume` continues paused phase.
`Hold 2nd Half` blocks auto-resume during HT.
`Start 2nd Half` clears hold and begins second half immediately.
7. Add system commentary generation for facts/events.
Generate and persist commentary events at HT and FT.
Commentary selection inputs: phase, scoreline, leader side, fixture id seed.
Dedupe by phase key per fixture so scheduler reruns do not duplicate entries.
8. Add 120+ dynamic narration variants for all locales.
Add narration arrays under `match.narration` in `en`, `yo`, `ig`, `ha`.
Minimum 120 templates per locale, covering:
goalless HT, scoring draw HT, home-leading HT, away-leading HT, FT outcomes.
Store `templateKey + params` in events; render localized text client-side.
9. Update live-state helpers and Fixture Detail display.
Refactor `isFixtureLive` to prioritize `liveClock`, with safe fallback to legacy behavior.
Fixture detail badge rules:
first/second half -> `LIVE • {minute}'`
halftime -> `LIVE • HT`
admin pause -> `LIVE • PAUSED`
Render `system_commentary` rows distinctly in the timeline/facts section.
Normalize event team resolution to support both `event.team` and `event.teamId`.
10. Add goal celebration animation on fixture detail.
Create `GoalCelebrationOverlay` with rolling ball + confetti.
Trigger once per newly detected goal event while fixture is live.
Restrict scope to fixture detail only.
Respect `prefers-reduced-motion` with reduced/no-motion fallback.
11. Backfill existing data.
Create `scripts/migrations/backfill-match-timing.mjs`.
Backfill `matchTiming` and `liveClock` for existing fixtures.
Map legacy statuses to canonical statuses.
Infer live phase for old live fixtures from minute and resolved duration.
12. Keep notification behavior compatible.
Retain existing `match_live`, `score_update`, `match_finished` notification flow.
Ensure halftime transition does not emit false “match started” events.

## Test Cases and Scenarios
1. Timing precedence resolves correctly for league-only, season override, and fixture override.
2. Duration math validates 30->15/5, 60->30/10, 120->60/20, and rejects odd durations.
3. Scheduled fixture auto-starts at kickoff and minute increments server-side.
4. First half auto-transitions to HT at exact half duration.
5. HT auto-resumes unless hold is enabled.
6. Admin pause/resume freezes and restores the same phase without minute jumps.
7. Second half completion marks fixture completed and writes FT commentary once.
8. HT/FT commentary events are deduplicated across repeated scheduler runs.
9. Locale rendering resolves narration templates in `en`, `yo`, `ig`, `ha` without missing keys.
10. Fixture detail badge correctly switches among minute, HT, and PAUSED.
11. Goal celebration fires once per new goal event and does not retrigger on re-render.
12. Legacy fixtures without `liveClock` still render safely with fallback behavior.

## Assumptions and Defaults
1. Regulation time only is in scope; stoppage time and extra time are out of scope.
2. Break ratio is fixed at `15/90` globally and not user-configurable.
3. Matches must have exactly two equal halves, so odd `regulationMinutes` are invalid.
4. Server clock is authoritative for transitions and minute progression.
5. System commentary is persisted in Firestore for consistency across clients.
6. Goal animation scope is fixture detail page only.
7. Locale scope in this phase is all current app locales: `en`, `yo`, `ig`, `ha`.
