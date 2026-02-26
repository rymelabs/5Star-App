# Extensive Player Data V2 (EPD V2) — Execution Plan

## Overview
EPD V2 is the next evolution of player data in Fivescores, building on the foundation laid by EPD V1 (expanded profiles, match-by-match performance, Mins/Goal & Mins/Assist KPIs, and player photo support). This update introduces 16 new features across analytics, engagement, and data depth to make Fivescores the most compelling player stats platform for fans and analysts.

---

## Feature Recommendations

### 🔥 High Impact
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Player Comparison Tool** | Select 2–3 players and compare stats side-by-side (goals, assists, cards, matches) in a visual overlay or split-screen. |
| 2 | **Form Tracker / Performance Trend** | A sparkline/bar chart of the last 5–10 matches with color-coded performance rating. Answers: *"Is this player in form?"* |
| 3 | **Season Selector on Stats** | Filter player stats by season/competition for per-tournament breakdowns instead of career totals only. |
| 4 | **Player of the Match Awards** | Track and display "Player of the Match" awards from fixtures — high-engagement for fans. |

### ⚡ Medium Impact
| # | Feature | Description |
|---|---------|-------------|
| 5 | **Position Map** | A pitch graphic showing where the player primarily operates (LW, CM, etc.), useful for multi-position players. |
| 6 | **Head-to-Head Record** | Show a player's record against specific opponents (e.g., "Saka vs Chelsea: 3 goals in 5 games"). |
| 7 | **Goals/Assists Timeline** | Visual timeline showing when in a match the player typically scores (e.g., "Most dangerous 60–75 min"). |
| 8 | **Player Ratings** | Admins assign a 1–10 match rating per player per fixture. Display average and trend on profile. |
| 9 | **Social Sharing Card** | "Share Player Stats" button that generates a beautiful stat card image for social media. |

### 🎨 Polish & Engagement
| # | Feature | Description |
|---|---------|-------------|
| 10 | **Player Bio Narrative** | Free-text "About" field for admin-written biographies or scouting reports. |
| 11 | **Milestone Badges** | Auto-generated badges: "50 Goals", "100 Appearances", "Hat-trick Hero", "Clean Sheet King". |
| 12 | **Related Players** | "Similar Players" or "Teammates" section linking to players in the same team or position. |
| 13 | **Injury/Availability Status** | Status indicator (Available / Injured / Suspended / On Loan) with optional return date. |
| 14 | **Fan Voting / Player Rating** | Logged-in users rate a player's performance after each match. Display crowd-sourced ratings. |

### 📊 Data Depth (Analyst Mode)
| # | Feature | Description |
|---|---------|-------------|
| 15 | **Advanced Metrics Dashboard** | Goals per 90, assists per 90, goal contributions, win rate when starting. Toggle "Fan View" vs "Analyst View". |
| 16 | **Season-over-Season Comparison** | Bar charts comparing stats across multiple seasons to visualize growth or decline. |

---

## Phased Execution Plan

### Phase 1 — Core Analytics *(Foundation)*
> **Goal**: Give users meaningful, filterable stats and visual performance context.

| Feature | Files Affected | Effort |
|---------|---------------|--------|
| **Season Selector on Stats** (#3) | `PlayerDetail.jsx`, `FootballContext.jsx` | Medium |
| **Form Tracker / Performance Trend** (#2) | `PlayerDetail.jsx` (new chart component) | Medium |
| **Player Ratings** (#8) | `FixtureDetail.jsx`, `PlayerDetail.jsx`, Firestore schema | Medium |
| **Player of the Match Awards** (#4) | `FixtureDetail.jsx`, `PlayerDetail.jsx`, Firestore schema | Low |

**Deliverables:**
- Season/competition filter dropdown on the Statistics tab.
- Last-5-matches sparkline chart on the Overview tab.
- Admin rating input on fixture detail; average rating on player profile.
- MOTM badge selection on fixture detail; award count on player profile.

---

### Phase 2 — Engagement & Social *(Fan Features)*
> **Goal**: Drive sharing, storytelling, and fan interaction.

| Feature | Files Affected | Effort |
|---------|---------------|--------|
| **Milestone Badges** (#11) | `PlayerDetail.jsx` (new badge logic) | Low |
| **Player Bio Narrative** (#10) | `EditTeam.jsx`, `PlayerDetail.jsx` | Low |
| **Injury/Availability Status** (#13) | `EditTeam.jsx`, `PlayerDetail.jsx` | Low |
| **Social Sharing Card** (#9) | `PlayerDetail.jsx` (new share component, canvas/html2canvas) | Medium |
| **Fan Voting / Player Rating** (#14) | `PlayerDetail.jsx`, `FixtureDetail.jsx`, Firestore (new collection) | High |

**Deliverables:**
- Auto-calculated milestone badges rendered on the profile header.
- Admin-editable bio text area; rendered in the Bio tab.
- Status pill on the player header (Available / Injured / Suspended).
- Share button generating a branded stat card image.
- Post-match rating UI for logged-in users; average fan rating on profile.

---

### Phase 3 — Deep Analysis *(Power User Features)*
> **Goal**: Unlock analyst-level insights and comparison tools.

| Feature | Files Affected | Effort |
|---------|---------------|--------|
| **Player Comparison Tool** (#1) | New `PlayerComparison.jsx` page, routing | High |
| **Head-to-Head Record** (#6) | `PlayerDetail.jsx` (new section) | Medium |
| **Goals/Assists Timeline** (#7) | `PlayerDetail.jsx` (new chart component) | Medium |
| **Advanced Metrics Dashboard** (#15) | `PlayerDetail.jsx` (new tab or toggle) | Medium |
| **Season-over-Season Comparison** (#16) | `PlayerDetail.jsx` (new chart component) | Medium |

**Deliverables:**
- Dedicated `/compare` page with multi-player selection and side-by-side stat grid.
- "vs Opponent" section on the Matches tab showing per-opponent aggregated stats.
- Goal-timing bar chart (0–15, 15–30, 30–45, 45–60, 60–75, 75–90 min buckets).
- Toggle between "Fan View" (current) and "Analyst View" (per-90 metrics, win rate, etc.).
- Season comparison bar charts on the Statistics tab.

---

### Phase 4 — Visual Polish *(Premium Feel)*
> **Goal**: Elevate the UI to a premium, best-in-class experience.

| Feature | Files Affected | Effort |
|---------|---------------|--------|
| **Position Map** (#5) | `PlayerDetail.jsx` (new SVG pitch component) | Medium |
| **Related Players** (#12) | `PlayerDetail.jsx` (new section) | Low |

**Deliverables:**
- Interactive SVG pitch graphic highlighting the player's primary zone.
- "Teammates" carousel and "Similar Players" suggestions at the bottom of the profile.

---

## Phase Summary

| Phase | Features | Priority | Estimated Scope |
|-------|----------|----------|-----------------|
| **1 — Core Analytics** | #2, #3, #4, #8 | ✅ Done | 4 features |
| **2 — Engagement & Social** | #9, #10, #11, #13, #14 | ✅ Done | 5 features |
| **3 — Deep Analysis** | #1, #6, #7, #15, #16 | ✅ Done | 5 features |
| **4 — Visual Polish** | #5, #12 | ✅ Done | 2 features |

---

*Fivescores EPD V2 — Built for fans who live and breathe player stats.*
