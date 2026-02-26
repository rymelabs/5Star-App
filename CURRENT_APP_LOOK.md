# Current App Look

## Theme & Atmosphere
- Global dark mode base (`dark-900`) with faint scarlet/emerald radial textures makes every screen feel like a stadium-night dashboard.
- Tailwind palette highlights a hot red primary (#ef4444) and a vibrant green accent (#22c55e), contrasted against charcoal cards (`dark-800` with `dark-700` borders).
- Typography sticks to Tailwind's sans stack; body copy is soft white, subtext a cool gray, and stats pop in accent colors.

## Global Layout & Navigation
- Layout sandwiches content between a translucent fixed header and a floating bottom nav dock (`src/components/layout`).
- Header houses the glowing 5Star logo, circular icon buttons (search, notifications with red badges, avatar), and retains a frosted glass look via `bg-black/30 backdrop-blur-md`.
- Bottom navigation is a rounded pill hovering above the bottom margin, with animated `.nav-item` halos/pulse dots making mobile tabs tactile.

## Components & Surface Language
- Cards share the `bg-dark-800 border-dark-700 rounded-xl` style with soft drop shadows. Highlight cards stretch to 16:9 ratios with gradient overlays.
- Buttons: solid primary red CTAs plus muted dark-outline toggles. Follow buttons flip from red "Follow" pills to graphite "Following" states with `UserPlus`/`UserMinus` icons and inline spinners.
- Inputs use `.input-field` (dark fill, thin glow focus) and force 16px fonts for iOS accessibility.

## Latest Page Experience
- Home (`src/pages/Latest.jsx`) reads like a sports hub: rotating headline cards with large imagery, gradient text overlays, and CTA chips.
- Upcoming fixtures render as horizontal match-up cards with club avatars (via `TeamAvatar`), bold team names, and status chips (LIVE, Scheduled). Completed matches show color-coded result bubbles (W/L/D) beside the scoreboard.
- Bento grids (`.latest-bento-grid`, `.news-bento-grid`) arrange modules for standings, scorers, and Instagram posts with consistent 1.25–2rem spacing.

## Teams & Team Detail
- Teams grid uses trading-card panels showing crest, city, follower count, and CTA buttons, with shimmering skeleton loaders while data fetches.
- Team detail hero pairs a large badge with metadata (city, founded year, stadium) and follow controls (pills + notification indicator). Tabs (Overview/Fixtures/Squad/Stats/News) are pill toggles with accent backgrounds when active.
- Content sections mix stat grids, player lists with avatar initials, timeline-style recent/upcoming fixtures, and news cards filtered per team.

## News & Articles
- News cards feature 16:9 cover images, two-line headline clamps, excerpt text, and metadata chips. Article detail pages adopt a two-column layout on desktop (main article + related side rail) and stack on mobile.

## Fixtures & Stats Modules
- Fixture pages apply the same card language but emphasize chronology: date separators, progress pills, and scoreboard typography. Lineups and events reuse icons from Lucide (Calendar, Trophy, etc.).
- Stats tiles show scoreboard-like blocks with alternating backgrounds and bright accent numbers; tables use alternating row shading and thin dividers for legibility.

## Modals & Prompts
- Search/Profile modals borrow the `ConfirmationModal` shell: centered dark glass with rounded corners, icon badges, and dual-action buttons.
- `AuthPromptModal` reuses that shell but injects bullet-point benefits (e.g., match alerts) to encourage sign-in from guest state.
- Toasts and inline alerts use accent borders (red for errors, green for success) and short copy.

## Micro-interactions
- Buttons/icons have scale/color transitions (`transition-all duration-200`). Navigation icons pulse, while cards glow subtly on hover due to `.nav-item` and `.card` definitions.
- Loading states: small circular spinners inside action buttons, plus full skeleton grids mirroring final layout.
- Scrollbars are custom styled (thin, rounded) to blend into the dark theme; text selection/zoom is disabled for a native-app feel.

## Responsiveness
- Tailwind breakpoints reorganize grids: multi-column layouts collapse gracefully, horizontal scroll is enabled for tabs on smaller widths.
- Header stays fixed; bottom nav remains docked. Content sections use generous padding to maintain touch targets on phones.

## Iconography & Imagery
- Lucide icons (Search, Bell, Users, Trophy, etc.) keep stroke-weight consistent with typography.
- Team avatars fall back to colored initials when images fail, preserving visual balance.
- Hero imagery is darkened via gradients to keep overlaid text legible without dulling visuals.

## Notifications & UX Polish
- Admin notification modal (triggered for signed-in users on Latest) appears after a timed delay with dismiss controls, matching the modal design language.
- Badges cap counts at "9+" to protect layout. Follower counts, likes, and views update inline with smooth transitions.

Overall, the app feels like a premium, night-mode sports companion: translucent chrome edges, richly detailed cards in the middle, animated navigation for mobile friendliness, and cohesive color/styling injected across news, fixtures, teams, and admin tools.