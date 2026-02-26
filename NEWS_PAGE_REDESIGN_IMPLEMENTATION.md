# News Page Redesign — Implementation Guide

This document describes a premium, consistent redesign for the **News** page, aligned with the styling direction already applied to **Latest** (flat surfaces, minimal borders, strong typography hierarchy, and subtle premium interactions).

---

## Goals

- Make News feel **modern, premium, and consistent** with the app theme.
- Use **flat surfaces** (no rounded containers) for the main cards.
- Keep information hierarchy clear: **category → time → title → (optional) excerpt**.
- Ensure styling is **component-owned** (Tailwind classes), avoiding global CSS overrides.

---

## Layout Structure

### 1) Top Bar (Sticky)

**What it contains**
- Title: `News`
- Search input
- Filter toggle button

**Behavior**
- Stays visible while scrolling (optional but recommended).
- Filter chips slide open/closed below the bar.

**Suggested styling**
- Surface: `bg-elevated/80 backdrop-blur-xl`
- Border: `border-b border-white/10`
- Search: rounded pill input is fine here (it’s a control, not a content card).

---

### 2) Featured Article (Large Card)

**Goal**: A single hero story at the top that feels premium but **still flat**.

**Visual rules**
- Shape: `rounded-none`
- Borders: `border-t border-b border-white/10` (match Latest list container style)
- Background: `bg-[#0c0c0f]` or `bg-elevated` depending on contrast
- Media: full-bleed image with bottom gradient overlay

**Hierarchy**
1. Category pill + time badge
2. Title (largest text on page)
3. Optional 1–2 line excerpt
4. Small meta row (author / comments / likes)

**Interaction**
- Entire card clickable.
- Hover (desktop): slight image zoom + title accent shift.
- Tap (mobile): subtle active background change; avoid scale-jumps.

---

### 3) Feed (Articles List)

**Mobile-first rule**: default should feel like a clean feed.

**Recommended approach**
- **Mobile**: compact row cards (image left, text right).
- **Tablet/Desktop**: grid is okay (2–3 columns), but keep styling consistent.

**Visual rules**
- No radius: `rounded-none`
- Separators: `border-b border-white/5`
- Keep padding compact, consistent

**Card anatomy**
- Thumbnail: consistent square (e.g. 64–72px)
- Title: medium-bold, 2 lines max
- Meta: time + optional author/comments
- Excerpt: optional and hidden on smallest screens

---

## Styling Tokens (Theme Consistency)

Use the app’s existing theme utilities:
- Backgrounds: `bg-app`, `bg-elevated`, `bg-elevated-soft`, and `bg-[#0c0c0f]` where needed
- Borders: `border-white/10` (outer), `border-white/5` (separators)
- Accent: `brand-purple` only for focus/active/highlight (don’t flood)

Typography guidance:
- Featured title: `text-2xl sm:text-4xl font-bold`
- Feed title: `text-sm sm:text-base font-semibold`
- Meta text: `text-[11px] sm:text-xs text-white/60`

---

## Interactions (Premium but Minimal)

### Loading states
- Prefer skeletons (featured + list rows) over spinners.

### Hover / tap feedback
- Hover: small image zoom + title color shift.
- Tap: subtle background darkening (no heavy scaling).

### Accessibility
- Ensure clickable cards have visible focus ring:
  - `focus:outline-none focus:ring-2 focus:ring-brand-purple/40`

---

## Implementation Notes (Code)

### Files involved
- `src/pages/News.jsx`
- `src/pages/Latest.jsx`
- `src/compact-text.css` (avoid overriding news cards with `!important`)

### Critical rule: avoid global overrides
Historically, News styling was being overridden by `src/compact-text.css` using selectors like:
- `.news-compact-reset .news-card { ... !important }`
- `.news-card h3 { ... !important }`

**Implementation policy**
- News/Latest card styling should live inside `News.jsx` and `Latest.jsx` using Tailwind classes.
- Global CSS should not impose radius/padding/typography on News cards.

---

## Recommended Component Styling (Practical)

### Featured (Large) Card
Suggested container classes:
- `rounded-none overflow-hidden cursor-pointer`
- `bg-[#0c0c0f] border-t border-b border-white/10`
- `aspect-[16/10] sm:aspect-[21/9]`

Overlay:
- `bg-gradient-to-t from-black via-black/60 to-transparent`

---

### Feed Cards
If using `SurfaceCard`:
- Ensure `rounded-none` is included in `className`.
- Keep padding compact (`p-2` or `p-3`) and consistent.

Example rules:
- Thumbnail: `w-16 h-16` (or `w-[128px]` for grid image blocks)
- Title: `line-clamp-2`
- Meta: same style everywhere

---

## QA Checklist

- Featured card:
  - Flat edges (no rounding)
  - Top/bottom borders only
  - Image overlay readable

- Feed cards:
  - No unexpected rounding
  - Separator borders consistent
  - Typography matches Latest

- Global CSS:
  - No `!important` rules forcing `.news-card` rounding or font sizes

---

## Next Optional Enhancements

- Add a `Trending` sort (only if supported by data).
- Add a “Saved” filter/bookmarking later.
- Add read-progress indicator on `NewsArticle`.
