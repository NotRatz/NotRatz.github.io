# Strive Suite Memento

_Last updated: 2025-09-18 20:58 UTC_

## 1. Current Snapshot
- **Information architecture**: `/` (landing), `/naraka-tweaks/`, `/egl/`, and `/tournaments/` are live HTML entry points using the shared app shell. The tournaments page now covers CSV upload + standings; deeper admin/public flows from the original scoring spec remain to be built.
- **Shared runtime**: `src/js/app-shell.js` injects the global nav, footer, auth modal, toast system, feature toggles, and service worker registration across every page. Motion helpers (`src/js/motion.js`) lazily load Motion One & Lenis based on stored user preferences.
- **State & auth**: `src/js/storage.js` persists per-identity state (mock Discord ID or `local`) in `localStorage` with BroadcastChannel fan-out. `src/js/auth.js` only exposes a developer login modal; no real Discord OAuth flow is wired yet.
- **Data sources**: Structured JSON lives under `assets/data/` (`announcements.json`, `tweaks.json`). Hero/heroine art for the future scoring UI is pre-seeded under `assets/`.

## 2. Completed Work by Surface
### Landing page (`/index.html` + `src/js/landing-page.js`)
- Glassmorphism hero with CTA buttons to each pillar and dual feature cards.
- Announcement feed hydrates from `assets/data/announcements.json` and animates cards on scroll.
- Product pillar cards, community section, and reusable chips/dividers live in Tailwind + `src/styles/base.css`.

### NarakaTweaks hub (`/naraka-tweaks/index.html` + `src/js/naraka-tweaks.js`)
- Category pills, instant search, and tweak cards sourced from `tweaks.json`.
- Selection queue with removal controls and preset manager (save, apply, export/import JSON).
- Per-user persistence via `storage.js`; multi-tab sync through BroadcastChannel subscription.
- Modal viewer for tweak details, clipboard helpers (script & revert), and animated surfaces.

### EGL Scrim Planner (`/egl/index.html` + `src/js/egl-planner.js`)
- Weekly grid rendered from configurable days & times; slot clicks open a modal for scrim creation.
- Squad roster manager with member roles/substitutes, attendance tracking, and planner metrics.
- Notes panel with autosave debounce, JSON/CSV exports, Discord summary generator, and share-link encoder (URL hash → read-only mode).
- BroadcastChannel keeps multi-tab selections in sync; share mode locks down editing.

### Styling & tokens (`src/styles/base.css`)
- OKLCH brand palette, glow shadows, chip styles, toast/modal scaffolding, and EGL-specific cards.
- Reduced-motion fallbacks and `.motion-minimal` hooks tied to user settings.

## 3. Outstanding Work / TODOs
### Tournament Scoring Suite
- Extend the tournaments experience with the advanced admin/public flows (creation, scoring config, pick/ban desk, live standings, registration, exports) originally scoped for the `/scoring/...` routes. Decide whether to keep `/tournaments/` naming or alias legacy paths.
- Implement scoring data models, CSV ingestion wizard, deterministic computation helpers, and hero pool UI using the seeded assets.
- Wire storage sync for tournaments + CSV mappings in `storage.js` (stubs exist but unused).

### Auth & Serverless
- Replace the mock login with real Discord OAuth when `FEATURE_SERVERLESS` is true (REST endpoints + cookie handling). Add safe fallbacks for static mode messaging.
- Persist presets/planner/tournament data to remote KV/D1 when serverless is enabled; design merge/conflict UX.

### Motion & Accessibility
- Implement the motion toggle indicator across pages (currently only updates nav label/toast).
- Audit keyboard focus order inside modals/dialogs and ensure `aria` roles for dynamic content (cards, forms, tables).

### Planner Enhancements
- Drag-to-resize scrim durations and drag-to-move between slots (spec reference). Right now durations are select inputs only.
- Conflict detection/visual warnings when two squads overlap or double-book members.
- Shared snapshot viewer should expose tournament staff name + timestamp inside read-only UI.

### NarakaTweaks Improvements
- Populate knowledge-base accordion with real FAQ copy; currently lorem-style placeholders.
- Add revert-script availability indicator and optional multi-select export by category.
- When Discord auth exists, sync presets to serverless backend (currently local-only).

### Build & Deployment
- Introduce a reproducible build (Vite/Vite MPA or similar) so Tailwind config can be centralized instead of inline script tags. Generate static + serverless bundles gated by `FEATURE_*` flags.
- Create `service-worker.js` to satisfy `app-shell` registration; decide on offline caching scope.
- Update `README.md` with setup instructions and new architecture overview.

## 4. Known Issues / Risks
- **Missing service worker**: `app-shell` registers `../../service-worker.js` but the file does not exist, leading to a 404 warning in console.
- **View transitions**: Global click interceptor starts transitions for all internal links; audit anchor buttons with hashes/downloads to avoid unintended navigation blocks.
- **Share encoding**: `egl-planner` relies on `btoa`/`atob` plus `escape/unescape` which are deprecated in some environments. Consider `TextEncoder`/`TextDecoder` replacements.
- **Legacy artifacts**: `ScrimPrep/` remains from the previous site and may need migration or archival.

## 5. Testing & Tooling
- No automated tests or linting configured. Manual smoke testing has been ad-hoc via the static HTML files.
- Recommend standing up a simple static server (`npx serve` or `python -m http.server`) to exercise modules with `localStorage`.
- Before launch, add CI to run formatting checks, unit tests (for scoring math), and linting once the toolchain is defined.

## 6. Quick Start for Next Agent
1. Serve the repo locally (see testing note above) so ES modules load with correct origins.
2. Use the nav "Dev login" button to set a mock Discord ID, then verify NarakaTweaks preset persistence and EGL planner share mode.
3. Stub out `/scoring/index.html` first so nav links stop 404ing, then iteratively add admin/public flows.
4. Decide on build tooling early—current Tailwind CDN setup is fine for prototyping but not maintainable for the multi-route suite.

## 7. Reference Map
```
/ index.html              → landing shell & hero
/naraka-tweaks/index.html → tweaks hub markup
/egl/index.html           → scrim planner markup
/assets/data/*.json       → static content feeds
/src/js/*                 → shared runtime + page controllers
/src/styles/base.css      → global tokens/components
```

---
Please keep `Agent.md` expectations in mind when planning follow-up work (Tailwind + vanilla JS, motion discipline, dual static/serverless build, Discord auth strategy).
