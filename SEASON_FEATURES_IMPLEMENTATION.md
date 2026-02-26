# Season Features Implementation Plan

## Scope
Changes to support:
- Allow multiple seasons to be active concurrently (especially in the admin seasons management view).
- Enable manual creation/editing of knockout fixtures directly on the Edit Season page (in addition to auto-seeding).
- Ensure season group tables display accurate standings derived from group fixtures, with correct goal difference.
- Add season logo uploads (use trophy emoji only when logo is absent).

## Current State (as observed)
- `seasonsCollection.setActive` deactivates all seasons before activating one; `FootballContext` stores a single `activeSeason` and fetches `getActive()` which returns only one record.
- `SeasonDetail` groups tab renders `group.standings` and does not recompute from fixtures; `SeasonStandings` component already calculates standings from fixtures with GD/points logic.
- Knockout data is populated only via `seasonsCollection.seedKnockoutStage` (called from `SeasonDetail`), not editable on `EditSeason`.
- No season logo field or upload flow; UI falls back to a trophy icon.

## Plan by Feature

### 1) Multiple Active Seasons
- Data/API
  - Add `getActiveList` to `seasonsCollection` (returns all `isActive === true`).
  - Replace `setActive` with `setActiveState` that toggles a single season's `isActive` without deactivating others; optionally add `setExclusiveActive` if we need the previous behavior for legacy callers.
  - Update any server-side/collection helpers that assume a single active season (e.g., `FootballContext` loaders) to use the list; expose both `activeSeasons` (array) and `primaryActiveSeason` (first/most recent) for legacy UI that expects one.
- State/Context
  - In `FootballContext`, store `activeSeasons` array; keep a derived `activeSeason` for backward compatibility until all consumers are migrated.
  - Update caching keys accordingly (`football:activeSeasons`).
- UI
  - `AdminSeasons`: allow toggling active flag per row (Activate/Deactivate); show count of active seasons; avoid forcing exclusivity.
  - Season detail header: show "Active" badge if active; ensure logic works when multiple are active.
- Migration
  - One-time script or admin action to preserve current active season(s); no destructive change required.
- QA
  - Multiple concurrent activations visible in the grid; toggling one does not unset others; `SeasonDetail` and public views still function with `primaryActiveSeason` derived from the list.

### 2) Manual Knockout Fixture Editing on Edit Season Page
- Data model
  - Continue using `season.knockoutConfig.rounds[*].matches[*]` structure; ensure matches accept home/away team references `{ teamId, team }` plus optional metadata (date/time, venue, leg info, status).
- UI/UX (Edit Season)
  - Add a Knockout tab/step with round list: create round, rename, reorder, delete.
  - Per round, support adding matches by selecting home/away teams from season teams (grouped by group), with validation (no duplicate pairing unless explicitly allowed).
  - Allow editing match fields: leg number, date/time, venue, status, scores (optional for pre-seeding), and a "TBD" option.
  - Provide "Auto-seed from standings" button that runs existing seeding logic to prefill rounds, then allow manual tweaks before saving.
- Persistence
  - Save knockout structure via `seasonsCollection.update` (or new `updateKnockout`) when the season is saved.
  - Ensure `SeasonDetail` knockout tab renders manual matches as saved (respecting logos and names).
- QA
  - Create round/match, save, reload: data persists.
  - Auto-seed then edit: edits persist and are shown in detail view.

### 3) Accurate Group Standings (GD & points)
- Calculation source
  - Reuse `SeasonStandings` computation that derives standings from fixtures (GF/GA/GD/points, qualifiers sorting) as the single source of truth.
  - If no completed fixtures, fall back to stored `group.standings` or initial zeroed rows.
- Implementation options
  - Option A: Render `SeasonStandings` in `SeasonDetail` groups tab using `season` + `seasonFixtures` already loaded there.
  - Option B: Extract the calculation from `SeasonStandings` into a shared utility and have both `SeasonStandings` and `SeasonDetail` tables call it.
- Data flow
  - Ensure fixtures used include `groupId` and `status === 'completed'`; coerce numeric scores safely; compute GD as `goalsFor - goalsAgainst`.
- QA
  - After recording match results, GD and points update correctly; standings order matches expected sorting; qualifiers highlight remains correct.

### 4) Season Logo Upload
- Data/API
  - Add `logo` field to season documents. Upload path: `seasons/{seasonId}/logo.{ext}` in Firebase Storage.
- UI
  - Create Season & Edit Season: add logo uploader (image preview, replace/remove, progress, validation for size/type). Save uploads before persisting season doc, store the download URL in `logo`.
  - Admin cards, detail header, and standings/knockout views: display season logo when present; fallback to trophy emoji when absent.
- Storage handling
  - Reuse existing storage helpers if available (same pattern as team logos); otherwise, add a small utility to upload/delete season logos.
- QA
  - Upload new logo, save, reload: logo appears everywhere; removing logo reverts to trophy emoji.

## Rollout & Testing
- Unit/Integration: verify context derives active season(s) correctly; standings util returns expected GD/points; knockout editor saves/loads data.
- Manual flows: activate multiple seasons, create manual knockout matches, verify group table updates after entering scores, upload/remove logo.
- Migration note: existing seasons remain valid; optional backfill to set `logo: null` explicitly and to store current active season in the new list format.
