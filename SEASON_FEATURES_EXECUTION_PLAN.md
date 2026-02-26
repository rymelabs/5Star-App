# Season Features Execution Plan

## Overview
Step-by-step execution plan for implementing the four season features outlined in `SEASON_FEATURES_IMPLEMENTATION.md`.

---

## Phase 1: Multiple Active Seasons

### Step 1.1 – Update `seasonsCollection` API
**Files:** `src/firebase/firestore.js`
- [ ] Add `getActiveList()` method returning all seasons where `isActive === true`.
- [ ] Rename current `setActive` to `setExclusiveActive` (for legacy/migration).
- [ ] Add `toggleActive(seasonId, isActive)` method that updates only the target season's `isActive` without touching others.

### Step 1.2 – Update FootballContext
**Files:** `src/context/FootballContext.jsx`
- [ ] Replace `activeSeason` state with `activeSeasons` (array).
- [ ] Add derived `primaryActiveSeason` (first item or most recent) for backward compat.
- [ ] Update `loadInitialData` to call `getActiveList()` and populate `activeSeasons`.
- [ ] Expose `toggleSeasonActive(seasonId, isActive)` action.

### Step 1.3 – Update AdminSeasons UI
**Files:** `src/pages/admin/AdminSeasons.jsx`
- [ ] Change "Activate" button to a toggle (Activate/Deactivate) based on `season.isActive`.
- [ ] Call `toggleSeasonActive` instead of `setActive`.
- [ ] Update stats card to show count of active seasons.

### Step 1.4 – Update SeasonDetail Header
**Files:** `src/pages/admin/SeasonDetail.jsx`
- [ ] Adjust activate button logic: show "Deactivate" if already active.
- [ ] Call toggle helper; remove exclusive activation behavior.

### Step 1.5 – QA Checklist
- [ ] Activate multiple seasons; verify all show "Active" badge.
- [ ] Deactivate one; verify others remain active.
- [ ] Public views still load `primaryActiveSeason` correctly.

---

## Phase 2: Accurate Group Standings (GD & Points)

### Step 2.1 – Extract Standings Calculation Utility
**Files:** `src/utils/standingsUtils.js` (new)
- [ ] Create `calculateGroupStandings(group, fixtures, teams)` function.
- [ ] Port logic from `SeasonStandings.jsx` `standings` useMemo.
- [ ] Ensure GD computed as `goalsFor - goalsAgainst`; sort by points → GD → GF.

### Step 2.2 – Refactor SeasonStandings Component
**Files:** `src/components/SeasonStandings.jsx`
- [ ] Import and use `calculateGroupStandings` utility.
- [ ] Remove duplicated calculation logic; keep UI rendering.

### Step 2.3 – Update SeasonDetail Groups Tab
**Files:** `src/pages/admin/SeasonDetail.jsx`
- [ ] Import `calculateGroupStandings`.
- [ ] Compute standings from `seasonFixtures` for each group.
- [ ] Render computed standings instead of stored `group.standings`.

### Step 2.4 – QA Checklist
- [ ] Enter match results; verify GD updates correctly.
- [ ] Edit an existing result; verify recalculation.
- [ ] Empty fixtures: fallback to zero-initialized rows.

---

## Phase 3: Manual Knockout Fixture Editing

### Step 3.1 – Extend Season Data Helpers
**Files:** `src/firebase/firestore.js`
- [ ] Add `updateKnockoutRounds(seasonId, rounds)` helper (or reuse `update`).

### Step 3.2 – Build Knockout Editor Component
**Files:** `src/components/KnockoutEditor.jsx` (new)
- [ ] Accept `rounds`, `allTeams`, `onChange` props.
- [ ] Render list of rounds; each round lists matches.
- [ ] Provide Add Round, Rename Round, Delete Round actions.
- [ ] Provide Add Match (select home/away team), Edit Match (date/time, venue, status), Remove Match.
- [ ] Expose "Auto-seed from standings" button calling existing seed logic, then allow edits.

### Step 3.3 – Integrate KnockoutEditor in EditSeason
**Files:** `src/pages/admin/EditSeason.jsx`
- [ ] Add step 4 or a Knockout tab after groups.
- [ ] Load existing `knockoutConfig.rounds` into state.
- [ ] Render `KnockoutEditor`; sync changes to state.
- [ ] Save rounds via `updateKnockoutRounds` or include in overall `update`.

### Step 3.4 – Update SeasonDetail Knockout Tab
**Files:** `src/pages/admin/SeasonDetail.jsx`
- [ ] Ensure knockout tab renders manually created matches (already does, verify).

### Step 3.5 – QA Checklist
- [ ] Create round and match manually; save; reload: persists.
- [ ] Auto-seed then tweak: edits saved correctly.
- [ ] Delete round/match; verify removal.

---

## Phase 4: Season Logo Upload

### Step 4.1 – Add Logo Field to Season Schema
**Files:** `src/firebase/firestore.js`
- [ ] Ensure `create` and `update` accept and persist `logo` field.

### Step 4.2 – Create Logo Upload Utility
**Files:** `src/utils/storageUtils.js` (or existing storage helper)
- [ ] Add `uploadSeasonLogo(seasonId, file)` → returns download URL.
- [ ] Add `deleteSeasonLogo(seasonId)` if logo replaced/removed.

### Step 4.3 – Update CreateSeason Form
**Files:** `src/pages/admin/CreateSeason.jsx`
- [ ] Add logo uploader input (image preview, progress indicator).
- [ ] On submit, upload logo first; store URL in `seasonData.logo`.

### Step 4.4 – Update EditSeason Form
**Files:** `src/pages/admin/EditSeason.jsx`
- [ ] Display existing logo with replace/remove options.
- [ ] Handle upload/delete; update `logo` in save payload.

### Step 4.5 – Update Season Display Components
**Files:**
- `src/pages/admin/AdminSeasons.jsx`
- `src/pages/admin/SeasonDetail.jsx`
- `src/components/SeasonStandings.jsx`
- [ ] Render `<img src={season.logo} />` when present.
- [ ] Fallback to trophy emoji `🏆` when `!season.logo`.

### Step 4.6 – QA Checklist
- [ ] Upload logo on create; appears everywhere.
- [ ] Replace logo on edit; new logo appears.
- [ ] Remove logo; trophy emoji fallback shown.

---

## Rollout Order
1. **Phase 2** (Standings accuracy) – low risk, isolated utility change.
2. **Phase 1** (Multiple active seasons) – API + context + UI, moderate scope.
3. **Phase 4** (Season logo) – storage + UI, independent.
4. **Phase 3** (Knockout editor) – new component, higher complexity; saved for last.

---

## Estimated Effort
| Phase | Effort |
|-------|--------|
| Phase 1 | ~2 hrs |
| Phase 2 | ~1 hr  |
| Phase 3 | ~3 hrs |
| Phase 4 | ~1.5 hrs |
| **Total** | ~7.5 hrs |

---

## Notes
- Each phase can be merged independently; feature flags optional.
- Existing `seedKnockoutStage` remains available; knockout editor complements it.
- No breaking changes expected; `primaryActiveSeason` maintains backward compat.
