# News Page Redesign — Execution Plan

This plan turns the redesign spec in `NEWS_PAGE_REDESIGN_IMPLEMENTATION.md` into a step-by-step, low-risk implementation sequence with clear checkpoints.

---

## Scope

**In scope**
- News page UI polish: featured card + feed card styling + filters/search layout.
- Ensure **no global CSS overrides** fight the page styles.
- Align News cards to the same flat, border-first aesthetic used on Latest.

**Out of scope (optional later)**
- “Trending” algorithm, saved/bookmarks, analytics-driven ranking.
- Major data model changes.

---

## Success Criteria

- Featured card is **flat**: no rounding and uses top/bottom borders.
- Feed cards (list/grid) are **flat** and consistent with Latest.
- No `!important` CSS rules globally forcing News card radius/typography.
- Visual consistency across:
  - `Latest.jsx` “Latest News” section
  - `News.jsx` feed cards
  - `News.jsx` featured card

---

## Step-by-Step Plan

### Phase 0 — Baseline & Safety (15–30 mins)

1. **Locate all News-related CSS overrides**
   - Check `src/compact-text.css` for `.news-card*` and `.news-compact-reset` selectors.
   - Check `src/index.css` for `.news-*` layout rules.

2. **Define a no-overrides rule**
   - Any styling for News cards should be done via Tailwind classes in `News.jsx` / `Latest.jsx`.
   - Global CSS can define typography for the article page (`NewsArticle`) but must not force card radius/padding.

**Checkpoint**
- Confirm no global selector is forcing border-radius for `.news-card`.

---

### Phase 1 — Featured Card Redesign (30–60 mins)

1. Update featured card container styling in `src/pages/News.jsx`
   - Use `rounded-none`
   - Use `border-t border-b border-white/10`
   - Ensure background matches the app’s surfaces (`bg-[#0c0c0f]` or `bg-elevated`).

2. Normalize hierarchy
   - Category + time badge
   - Title (largest)
   - Optional excerpt
   - Meta row (author/comments/likes)

3. Interaction polish
   - Hover: slight image zoom, title accent
   - Tap: subtle active overlay (no heavy scaling)

**Checkpoint**
- Featured card no longer looks like the old rounded hero.

---

### Phase 2 — Feed Cards (List/Grid) Parity (45–90 mins)

1. Make feed cards match Latest styling principles
   - Flat edges: `rounded-none`
   - Clean separators: `border-b border-white/5`
   - Compact spacing: `p-2` / `p-3`

2. Mobile-first layout
   - Ensure mobile feels like a feed (row layout)
   - Keep grid only for larger screens if desired

3. Typography alignment
   - Title: `text-sm sm:text-base font-semibold`
   - Meta: `text-[11px] sm:text-xs`
   - Excerpt: hidden on small screens

**Checkpoint**
- Feed cards visually match Latest secondary list.

---

### Phase 3 — Filters/Search Header Polish (20–45 mins)

1. Keep header controls premium but minimal
   - Search input can remain rounded pill (UI control)
   - Filter toggle shows/hides chips

2. Optional sticky header
   - Add `sticky top-0 z-...` if it improves UX

**Checkpoint**
- Header feels “premium” without fighting the content styling.

---

### Phase 4 — Cross-Page Consistency (30–60 mins)

1. Verify Latest “Latest News” section matches News feed
   - Same borders, radius rules, spacing

2. Verify NewsArticle page remains unaffected
   - Ensure removing News card overrides didn’t break article typography

**Checkpoint**
- Latest + News look like the same design system.

---

### Phase 5 — QA & Build Verification (20–40 mins)

1. Run dev and spot-check
   - News page: featured + feed
   - Latest page: latest news section

2. Run production build
   - Ensure no CSS import/order regressions

3. Regression checklist
   - No unexpected rounding
   - Borders appear correctly
   - Text sizes readable
   - Click targets remain accessible

---

## Deliverables

- Updated `src/pages/News.jsx` (featured + feed + header polish)
- Updated `src/pages/Latest.jsx` if needed for parity
- Updated `src/compact-text.css` to remove News card forcing rules
- (Optional) small documentation note in `README.md` or keep as MD guides only

---

## Suggested Work Order (Minimal Risk)

1. Remove/neutralize global overrides that fight the redesign.
2. Fix featured card first (largest visual win).
3. Fix feed cards next.
4. Polish header/filters.
5. QA across Latest, News, NewsArticle.

---

## Testing Commands (Windows PowerShell)

```powershell
cd D:\5Star-App
npm run dev
```

```powershell
cd D:\5Star-App
npm run build
```
