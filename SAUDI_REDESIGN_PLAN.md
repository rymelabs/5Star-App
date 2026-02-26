# Saudi League Visual Redesign – Implementation Plan

This plan turns the provided redesign brief into actionable engineering steps while respecting the existing Fivescore architecture (Home, Fixtures, Teams, News, Stats). Each phase can be shipped independently and guarded behind a feature flag if desired.

---

## Phase 0 – Foundation & Tooling (Week 0)

1. **Feature Flag / Config Toggle**
   - Add a `uiTheme` flag (e.g., `classic` vs `saudi`) in `src/context/FeatureFlags` so we can roll out per route or per user.

2. **Tailwind & Token Updates**
   - Extend `tailwind.config.cjs` with the new palette:
     - `colors.app`, `colors.elevated`, `colors.primary`, `colors.brandRed`, `colors.accentGreen`, `colors.neutral`.
     - Map current `dark-###` tokens to the closest new colors to avoid breaking legacy components.
   - Define typography utilities for `display-xl`, `headline-lg`, `title-md`, `body`, `label-xs` via `@layer components` in `src/index.css`.

3. **Global Styles**
   - Update `body` background to the deep navy gradient (`#050816` → `#0B1020`).
   - Refresh scrollbar styling and default shadows to match the new aesthetic.

Deliverable: tokens + global styles toggled by the feature flag.

---

## Phase 1 – UI Primitives (Week 1)

Create reusable components inside `src/components/ui`:

| Component | Key Props | Notes |
| --- | --- | --- |
| `AppShell` | `activeTab`, `title?`, `children` | Wraps every page; renders frosted header + floating bottom nav. |
| `BottomNav` | `items`, `activeId`, `onChange` | Re-skin current nav with purple active state + glow animation. |
| `SurfaceCard` | `padding`, `elevated`, `interactive` | Base container for every card-like element. |
| `PillChip` | `label`, `tone`, `active`, `variant` | Used for filters, W/D/L, status tags. |
| `TabBar` | `items`, `activeId`, `variant ('pill'/'underline')` | For date filters, match detail tabs, team tabs. |
| `IconButton`, `Badge`, `Avatar`, `Skeleton`, `StatBar` | Small primitives reused everywhere. |

Implementation tips:
- Build each component with Tailwind classes referencing the new tokens.
- Provide Storybook-like examples (or a `/playground` route) to verify variants early.

Deliverable: documented primitives ready for composition.

---

## Phase 2 – Home Tab (Week 2)

1. Wrap `Latest.jsx` content with `<AppShell activeTab="home">`.
2. Replace the current hero + bento grid with:
   - `TabBar` for date filters.
   - `MatchHeroCard` (new domain component) using existing featured match data.
   - Section label + list of upcoming fixtures rendered via `MatchListRow`.
   - Quick stats row using `StatTile` (top scorer, clean sheets, etc.).
   - `NewsHeroCard` + `NewsListItem` preview at the bottom.
3. Add skeleton states using the new `Skeleton` primitives.

Deliverable: redesigned Home experience behind the feature flag.

---

## Phase 3 – Fixtures & Match Detail (Weeks 3–4)

1. **Fixtures list**
   - Introduce filter chips (`PillChip`) for dates/competitions.
   - Group fixtures by day using `MatchListRow` rows under a `SectionLabel`.
   - Horizontal scroll of live matches using a condensed `MatchHeroCard` variant.

2. **Match Detail page**
   - Build `LiveMatchDetailHeader` component (large scoreboard, team badges, status badge).
   - Add `TabBar` for Info / Stats / Line-ups / Odds / H2H.
   - Implement `MatchStatsBlock`, `Timeline` (reuse existing data but restyled).

Deliverable: fixtures route fully Saudi-styled, including match detail.

---

## Phase 4 – Teams (Weeks 5–6)

1. **Teams grid**
   - Replace existing cards with `TeamGridCard` (SurfaceCard + crest gradient, metadata, follow button).
   - Add filters (league, alphabetical) using `PillChip` row.

2. **Team detail**
   - Create `TeamHeroHeader` showing crest, team info, follow CTA.
   - Use `TabBar` for Overview / Fixtures / Squad / Stats / News.
   - Overview tab: `StatTile` grid (wins, goals, form) + recent results list.
   - Squad tab: `PlayerListRow` list with avatars and roles.

Deliverable: Teams list + detail aligned with new aesthetic.

---

## Phase 5 – News & Stats (Weeks 7–8)

**News:**
- Header with search + `NewsCategoryTabs`.
- `NewsHeroCard` at top (full-bleed image, gradient overlay).
- `NewsListItem` stack for trending articles.

**Stats:**
- Selector chips for metric type (Players, Teams, Goals, Assists, Cards).
- Row of `StatTile` hero metrics.
- `LeaderboardList` sections for each metric.

Deliverable: News and Stats tabs complete.

---

## Phase 6 – Polish & QA (Week 9)

1. **Animations & Micro-interactions**
   - Add `transition-all duration-200` to interactive components.
   - Implement bottom-nav dot animation and card hover glows.

2. **Accessibility & Responsiveness**
   - Verify contrast ratios with the new palette.
   - Test mobile/desktop breakpoints (Tailwind `sm`, `md`, `lg`).

3. **QA checklist**
   - Guest vs authenticated flows (follow buttons, notifications, auth prompt).
   - Navigation via header/bottom nav, deep links to match/team/news detail.
   - Localization (LanguageContext strings still fit new designs).

---

## Dependencies & Coordination

- **Design/System tokens** must ship before any page-level work (Phase 0).
- **UI primitives** (Phase 1) are prerequisites for every later phase.
- Each tab refactor (Phases 2–5) can run in parallel once primitives are ready.
- Keep `CURRENT_APP_LOOK.md` updated after each major release to document the new visual baseline.

---

## Suggested Branching Strategy

1. `feature/saudi-theme-foundation`
2. `feature/saudi-home`
3. `feature/saudi-fixtures`
4. `feature/saudi-teams`
5. `feature/saudi-news`
6. `feature/saudi-stats`

Use the feature flag to merge early and test in staging without disrupting production users.

---

## Tracking & Acceptance Criteria

- ✅ Tailwind token update merged (flagged).
- ✅ UI primitives exported from `src/components/ui/index.js`.
- ✅ Each tab satisfies: new header, new cards, responsive layout, skeleton states.
- ✅ All existing data flows still work: fixtures, teams, news, stats, auth prompts.
- ✅ Lighthouse/Performance parity with current build.

Once all phases are delivered and QA’d, flip the feature flag to make "Saudi league" visuals the default theme.
