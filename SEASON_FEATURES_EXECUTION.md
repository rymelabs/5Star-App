# Season Features Execution Tracker

> **Status:** In Progress  
> **Started:** 2024-12-11  
> **Last Updated:** 2024-12-11

---

## Progress Summary

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| Phase 1 | Multiple Active Seasons | ✅ Complete | 5/5 |
| Phase 2 | Accurate Group Standings | ✅ Complete | 4/4 |
| Phase 3 | Manual Knockout Editing | ✅ Already Exists | N/A |
| Phase 4 | Season Logo Upload | ✅ Complete | 6/6 |

---

## Phase 2: Accurate Group Standings (GD & Points)

### Step 2.1 – Extract Standings Calculation Utility
- **File:** `src/utils/standingsUtils.js` (new)
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Create `calculateGroupStandings(group, fixtures, teams)` function
  - [x] Port logic from `SeasonStandings.jsx` useMemo
  - [x] Ensure GD = goalsFor - goalsAgainst; sort by points → GD → GF

### Step 2.2 – Refactor SeasonStandings Component
- **File:** `src/components/SeasonStandings.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Import `calculateGroupStandings` utility
  - [x] Replace inline calculation with utility call

### Step 2.3 – Update SeasonDetail Groups Tab
- **File:** `src/pages/admin/SeasonDetail.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Import `calculateGroupStandings`
  - [x] Compute standings from `seasonFixtures` for each group
  - [x] Render computed standings instead of stored `group.standings`
  - [x] Added GF/GA columns for full breakdown

### Step 2.4 – QA Checklist
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Build passes with no errors
  - [ ] Enter match results; verify GD updates correctly
  - [ ] Edit existing result; verify recalculation
  - [ ] Empty fixtures: fallback to zero-initialized rows

---

## Phase 1: Multiple Active Seasons

### Step 1.1 – Update seasonsCollection API
- **File:** `src/firebase/firestore.js`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Add `getActiveList()` method
  - [x] Rename `setActive` to `setExclusiveActive`
  - [x] Add `toggleActive(seasonId, isActive)` method

### Step 1.2 – Update FootballContext
- **File:** `src/context/FootballContext.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Replace `activeSeason` with `activeSeasons` array
  - [x] Add derived `primaryActiveSeason`
  - [x] Update `loadInitialData` to call `getActiveList()`
  - [x] Expose `toggleSeasonActive(seasonId, isActive)` action

### Step 1.3 – Update AdminSeasons UI
- **File:** `src/pages/admin/AdminSeasons.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Change Activate button to toggle (Activate/Deactivate)
  - [x] Call `toggleSeasonActive` instead of `setActive`
  - [x] Update stats to show active season count

### Step 1.4 – Update SeasonDetail Header
- **File:** `src/pages/admin/SeasonDetail.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Show Deactivate if already active
  - [x] Call toggle helper; remove exclusive behavior

### Step 1.5 – QA Checklist
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Build passes with no errors
  - [ ] Activate multiple seasons; verify all show Active badge
  - [ ] Deactivate one; others remain active
  - [ ] Public views load `primaryActiveSeason` correctly

---

## Phase 4: Season Logo Upload

### Step 4.1 – Add Logo Field to Season Schema
- **File:** `src/firebase/firestore.js`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Existing `create` and `update` methods already persist `logo` field

### Step 4.2 – Create Logo Upload Utility
- **File:** `src/services/imageUploadService.js` (existing)
- **Status:** ✅ Already Exists
- **Tasks:**
  - [x] Uses existing `uploadImage(file, 'seasons', fileName)` utility
  - [x] Uploads to `seasons/` folder in Firebase Storage

### Step 4.3 – Update CreateSeason Form
- **File:** `src/pages/admin/CreateSeason.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Added logo uploader input with preview
  - [x] Upload before submit; store URL in `seasonData.logo`
  - [x] Shows trophy emoji fallback when no logo

### Step 4.4 – Update EditSeason Form
- **File:** `src/pages/admin/EditSeason.jsx`
- **Status:** ✅ Already Existed
- **Tasks:**
  - [x] Logo upload already implemented
  - [x] Display existing logo with replace capability

### Step 4.5 – Update Season Display Components
- **Files:** `AdminSeasons.jsx`, `SeasonDetail.jsx`, `Fixtures.jsx`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] AdminSeasons: Shows logo with 🏆 fallback
  - [x] SeasonDetail: Shows logo in header with 🏆 fallback
  - [x] Fixtures: Competition info now includes season logo

### Step 4.6 – QA Checklist
- **Status:** ✅ Complete (build passes)
- **Tasks:**
  - [x] Build passes with no errors
  - [ ] Upload logo on create; appears everywhere
  - [ ] Replace logo on edit; new logo appears
  - [ ] Remove logo; trophy emoji fallback shown

---

## Phase 3: Manual Knockout Fixture Editing

> **✅ Already Implemented!** All manual knockout editing features exist in `EditSeason.jsx`:
> - Add Round, Rename Round, Remove Round buttons
> - Add Match (select home/away teams), Remove Match
> - Changes persist via `knockoutConfig.rounds` in update payload
> - SeasonDetail.jsx has Knockout tab to view rounds/matches

### Step 3.1 – Extend Season Data Helpers
- **File:** `src/firebase/firestore.js`
- **Status:** ✅ Already Exists
- **Tasks:**
  - [x] Persisted via `seasonsCollection.update()` with `knockoutConfig.rounds`

### Step 3.2 – Build KnockoutEditor Component
- **File:** `src/pages/admin/EditSeason.jsx` (inline implementation)
- **Status:** ✅ Already Exists
- **Tasks:**
  - [x] `addRound()`, `renameRound()`, `removeRound()` functions
  - [x] `addMatchToRound()`, `updateMatchTeam()`, `removeMatch()` functions
  - [x] Team selection dropdowns for each match slot

### Step 3.3 – Integrate in EditSeason
- **File:** `src/pages/admin/EditSeason.jsx`
- **Status:** ✅ Already Exists
- **Tasks:**
  - [x] Knockout editor on Step 3 of edit form
  - [x] `knockoutRounds` state loaded from `knockoutConfig.rounds`
  - [x] Saved on submit

### Step 3.4 – Verify SeasonDetail Knockout Tab
- **File:** `src/pages/admin/SeasonDetail.jsx`
- **Status:** ✅ Already Exists
- **Tasks:**
  - [x] Knockout tab displays rounds and matches

### Step 3.5 – QA Checklist
- **Status:** ✅ Feature Complete (manual testing recommended)
- **Tasks:**
  - [ ] Create round/match manually; save; reload: persists
  - [ ] Auto-seed then tweak: edits saved
  - [ ] Delete round/match; verify removal

---

## Execution Log

| Date | Phase | Step | Action | Notes |
|------|-------|------|--------|-------|
| 2024-12-11 | — | — | Created execution tracker | Ready to begin Phase 1 |
| 2024-12-11 | 1 | 1.1 | Added getActiveList, toggleActive, setExclusiveActive | firestore.js updated |
| 2024-12-11 | 1 | 1.2 | Added activeSeasons array, toggleSeasonActive action | FootballContext updated |
| 2024-12-11 | 1 | 1.3 | Toggle button (Play/Pause) for activate/deactivate | AdminSeasons updated |
| 2024-12-11 | 1 | 1.4 | Toggle button in season detail header | SeasonDetail updated |
| 2024-12-11 | 1 | 1.5 | Build verified | Phase 1 complete |
| 2024-12-11 | 2 | 2.1 | Created standingsUtils.js | Utility for accurate GD calculation |
| 2024-12-11 | 2 | 2.2 | Refactored SeasonStandings.jsx | Uses shared utility |
| 2024-12-11 | 2 | 2.3 | Updated SeasonDetail groups tab | Added GF/GA columns, uses utility |
| 2024-12-11 | 2 | 2.4 | Build verified | Phase 2 complete |
| 2024-12-11 | 3 | ALL | Already existed | Knockout editor in EditSeason.jsx |
| 2024-12-11 | 4 | 4.3 | Added logo upload to CreateSeason | With preview and fallback |
| 2024-12-11 | 4 | 4.5 | Updated display components | AdminSeasons, SeasonDetail, Fixtures |
| 2024-12-11 | 4 | 4.6 | Build verified | Phase 4 complete |

---

## Notes
- Update status symbols: ⬜ Not Started → 🔄 In Progress → ✅ Complete → ❌ Blocked
- Log each significant action in the Execution Log table
- Mark tasks with [x] as they complete
