# Knockout Penalty Handling

## Goal
Allow any knockout fixture to record the full-time result and, separately, the penalty shootout result. The UI should show both scores, update the advancing team when penalties are completed, and keep the existing data flow for league/season standings.

## Data Model
1. **Firestore `fixtures` document**
   - Add `penaltyWinnerId` (string | null), `penaltyHomeScore`, `penaltyAwayScore` fields.
   - Ensure `status` can keep values `scheduled` / `live` / `completed` even if penalties were played; penalties may only be added when `status === 'completed'` and `fixture.stage` is in a knockout phase.
   - Keep existing `homeScore`/`awayScore` as the full-time score. The penalty fields are optional but should be populated once the shootout is completed.

2. **Local data shape**
   - When loading a fixture, merge penalty fields with the fixture object so components can read `fixture.penaltyHomeScore` etc without extra lookups.
   - Populate penalty fields in `footballContext` `setFixtures` logic so caches/grids already know about them.

## Admin UI adjustments
1. **Fixture Edit UI (`FixtureDetail.jsx` or admin counterpart)**
   - Extend the fixture status form to include penalty input fields when the fixture's stage is `knockout` (or any stage flagged as requiring a winner).
   - Allow the admin to toggle “Decided on penalties” which reveals `penaltyHomeScore`, `penaltyAwayScore`, and `penaltyWinnerId`. Default `penaltyWinnerId` to whichever team won the shootout.
   - When penalties are saved, still keep the same `homeScore`/`awayScore` (FT) but update `status` to `completed` if not already.
   - Ensure validation enforces that penalty score exists only when FT was draw and that winner is one of the two teams.

2. **Display on fixture pages**
   - In `FixtureDetail.jsx`, show a secondary row or badge `Penalties: 4-3` when penalty info exists.
   - Update any `CompactFixtureRow`/list components (`Fixtures.jsx`, `Latest`) to show the penalty score beneath the FT score for knockout fixtures.

## Advancing teams logic
1. **On penalty data save**
   - Reuse existing season knockout wiring. After updating the fixture, if penalties exist, determine the advancing team id from `penaltyWinnerId`.
   - Call the same `updateSeasonStandings` (or whatever handles progression) but force the next fixture’s `homeTeamId`/`awayTeamId` with the penalty winner if the stage depends on it.
   - Ensure that the `FootballContext` `updateFixture` helper sets `fixture.winnerId` (if one exists) and triggers any snapshot/listener updates so UI reflects the advancing team.

2. **Frontend propagation**
   - When rendering bracket-style views, use `penaltyWinnerId` to highlight which club moved on even if the FT score was tied.
   - If a fixture has penalty data but no explicit knockout successor, log a warning (server-side or in UI) so admins can wire the next stage manually.

## Cache & Snapshot Integration
- Because contexts now cache data, make sure penalty fields are included in snapshots before writing to cache so reopening the page instantly reflects whether penalties were played.
- When `fixturesCollection.onSnapshot` returns updated docs, map penalty fields through `setFixtures` as part of `populatedFixtures` so there is no stale display.

## Testing & Verification
1. Create a knockout fixture with a tied FT score. Save penalty inputs and confirm:
   - UI shows both FT and penalty lines.
   - The advancing team is reflected in the next stage fixture in both Latest/Fixtures lists.
2. Load the app fresh (cache hit) and confirm penalty data persists without waiting for Firestore.
3. Edge cases: penalty info only accepted when FT draw; no penalties allowed for group-stage fixtures unless explicitly marked as knockout.

## Summary
This change keeps the existing rich fixture workflow but adds a penalty shootout layer for knockout matches. It updates the data model, admin forms, display components, and knockout progression logic while leveraging the new caching infrastructure so fans see the latest results immediately.
