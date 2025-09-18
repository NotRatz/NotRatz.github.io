# Agent.MD — Strive / Naraka Suite (Landing + NarakaTweaks + EGL Planner + Scoring)

## Mission
Deliver a unified, modern site for the Strive ecosystem with three pillars:
1) **NarakaTweaks** (free optimization hub)  
2) **EGL Scrim Planner** (scheduling/rosters)  
3) **Tournament Scoring** (CSV-driven, pick/ban, dynamic scoring)

Keep Tailwind + vanilla JS. Motion feels premium but never blocks usability. UX roughly mirrors Pantheon’s “create tournament → configure → run pick/ban → publish/live scoreboard” flow.

---

## Tech Guardrails
- **Styling:** Tailwind CSS with extended tokens (OKLCH colors, glow shadows, radii, fonts).
- **Runtime:** Vanilla JS (ESM). No React/Vue.
- **Motion:** Motion One (micro-interactions), Lenis (optional smooth scroll), View Transitions API (page morphs).
- **Hosting:** GitHub Pages (static) with optional serverless adapters (Cloudflare Workers preferred; Netlify/Vercel OK).
- **Auth:** Discord OAuth2 (PKCE) via serverless; mock login for pure static dev mode.
- **Persistence v1:** `localStorage`/IndexedDB keyed by Discord ID; optional cloud sync via KV/D1 as v1.1.

> Generate two builds behind flags: **pure static** (offline-capable) and **serverless-enabled**.

---

## Information Architecture
- `/` — Landing (hero, product cards, announcements)  
- `/naraka-tweaks/` — NarakaTweaks hub (guides, toggles, exports)  
- `/egl/` — EGL Scrim Planner (calendar/grid, rosters)  
- `/scoring/` — Tournament hub  
  - `/scoring/admin/` — Admin console (create/edit tournaments)  
  - `/scoring/t/:slug/` — Public tournament (registration + standings)  
  - `/scoring/t/:slug/admin/` — Admin room (pick/ban, scoring)

All pages share header/nav, tokens, motion rules.

---

## Visual & Motion System

### Tokens (Tailwind `extend`)
- **Colors (OKLCH):**  
  `bg.base = oklch(10% 0.02 260)`  
  `bg.panel = oklch(19% 0.02 260)`  
  `brand.cyan.400/500 = oklch(80% 0.14 205) / oklch(74% 0.16 205)`  
  `brand.pink.400/500 = oklch(80% 0.18 350) / oklch(74% 0.21 350)`  
  `brand.lime.400/500 = oklch(86% 0.18 125) / oklch(80% 0.20 125)`
- **Shadow:** `shadow-glow = 0 0 0 1px color-mix(in oklab, var(--glow), black 70%), 0 10px 30px -10px var(--glow)`
- **Radius:** `2xl = 1.25rem`
- **Fonts:** Display = Rajdhani (or Orbitron); UI = Inter

### Components (shared)
- Glass nav (sticky, blurred), hero with gradient blobs + grid, CTA buttons, radial-lit cards, modals/drawers/toasts (accessible).

### Motion Rules
- **Micro:** 160–220 ms cubic-bezier(.2,.8,.2,1); hover lifts 2–4 px; glow intensifies via `--glow`.  
- **Macro:** staggered hero entrance, scroll-driven header glass, View Transitions between pages.  
- **A11y:** honor `prefers-reduced-motion`; site setting “Motion: Minimal / Full”.

---

## Functional Specs

### A) NarakaTweaks
- Categories: GPU/CPU/OS/Network tweaks with descriptions, copy buttons for scripts/configs, “revert” snippets.
- Presets: save/load named presets, export/import JSON.  
- Search: instant filter.  
- Persistence: per-Discord-ID (if logged in) and offline fallback.

### B) EGL Scrim Planner
- Planner grid: date/time slots; team list; role/hero notes; attendance.  
- Roster tools: assign squads, export CSV/JSON; copy Discord-formatted schedule.  
- Notes: markdown-lite with auto-save; shareable read-only link (URL fragment).

### C) Tournament Scoring Suite
**Core flow:** Create tournament → configure rounds/maps/rules → registration → pick/ban → ingest CSV each round → live standings → publish.  

#### 1) Auth (Discord)
- Serverless: OAuth2 PKCE endpoints `/api/auth/discord/*`; on success, store `{discordUserId, username, avatar}` session.  
- Static: Dev Login modal asks for Discord ID; clearly labeled as mock.

#### 2) Admin Console `/scoring/admin/`
- **Tournament meta:** name, slug (unique), region, visibility, start date.  
- **Rounds:** user-selectable number of rounds (default **6**), per-round **map selection** (e.g., Morus Isle, Holoroth, Perdoria).  
- **Scoring config (corrected):**  
  - **Formula:**  
    **per-round score = placementPoints[placement] + (kills × placementKillMultiplier_for_that_round)**  
    **tournament total = sum(per-round scores)**  
  - Placement table editor (1..N)  
  - Per-round kill multiplier editor (default 1.0; finals often >1.0)  
  - Optional bonuses (first blood, most kills)
- **Hero Pick/Ban rules:** pool, bans per team, picks per team, mirror policy toggle.  
- **CSV ingestion:** upload Naraka CSV; mapping wizard for fields; preview + merge.

#### 3) Public Tournament `/scoring/t/:slug/`
- **Registration (Discord):** create/join team; captain designation.  
- **Live view:** standings (overall + per-round), round details (placement, kills, damage), read-only pick/ban timeline.  
- **Updates:** BroadcastChannel + `storage` events; serverless mode may poll JSON with `ETag`.

#### 4) Admin Room `/scoring/t/:slug/admin/`
- Pick/ban timeline: BAN → PICK → LOCK with constraint checks and audit log (timestamp + user).  
- Scoring desk: per-round CSV import, multiplier application, deterministic recompute, manual overrides with audit entries.

#### 5) Exports
- CSV: standings by team/player, per-match breakdown.  
- JSON: full tournament state (config + results + audit).  
- Share links: read-only snapshots (signed URL for serverless; URL fragment for static).

---

## Data Models (v1 JSON; flat & serializable)
```json
{
  "schemaVersion": 1,
  "slug": "tarka-heatwave-2025",
  "ownerId": "discord:1234567890",
  "name": "Tarka’s Heatwave 2025",
  "region": "NA",
  "visibility": "public",
  "status": "draft|live|final",
  "createdAt": 1736559000,
  "updatedAt": 1736562200,
  "rounds": [
    { "index": 1, "map": "Morus Isle", "killMultiplier": 1.0 },
    { "index": 2, "map": "Holoroth",   "killMultiplier": 1.0 }
  ],
  "scoring": {
    "placements": { "1": 12, "2": 9, "3": 7, "4": 5, "5": 4, "6": 3, "7": 2, "8": 1, "9": 0, "10": 0, "11": 0, "12": 0 }
  },
  "heroRules": {
    "allowMirrors": false,
    "bansPerTeam": 1,
    "picksPerTeam": 3,
    "pool": ["Tarka Ji","Matari","Kurumi","Viper Ning","Temulch","Justina Gu","Wuchen"]
  },
  "registration": {
    "isOpen": true,
    "maxTeams": 60,
    "teams": [
      { "id": "team_abc", "name": "STR Alpha", "captainId": "discord:AAA", "members": ["discord:AAA","discord:BBB","discord:CCC"] }
    ]
  },
  "roundResults": [
    {
      "round": 1,
      "matches": [
        {
          "matchId": "R1M1",
          "picks": { "team_abc": ["Tarka Ji","Matari","Kurumi"], "team_xyz": ["Viper Ning","Temulch","Justina Gu"] },
          "bans":  { "team_abc": ["Wuchen"], "team_xyz": ["Tarka Ji"] },
          "teams": [
            { "teamId": "team_abc", "placement": 1, "kills": 9, "damage": 13457 },
            { "teamId": "team_xyz", "placement": 3, "kills": 5, "damage": 10123 }
          ]
        }
      ]
    }
  ],
  "permissions": { "admins": ["discord:..."], "mods": ["discord:..."] }
}
```

**Scoring computation (deterministic):**
```
perRound(team) = placements[placement] + (kills × round.killMultiplier)
total(team) = Σ perRound(team) over configured rounds
```

---

## CSV Mapping (ingest UI)
- **Required fields (mappable):** `match_id`, `team`, `player`, `kills`, `damage`, `placement`, `timestamp`
- **Optional:** `assists`, `deaths`, `revives`, `notes`
- Persist mapping per admin & per tournament; handle duplicate `match_id` by merge dialog.

---

## Auth & Permissions
- **Static mode:** Dev Login prompts for Discord ID; marks UI “Dev Mode”.
- **Serverless:**  
  - `/api/auth/discord/start` → redirect to Discord (PKCE)  
  - `/api/auth/discord/callback` → exchange code, set httpOnly session cookie, return minimal profile  
- **Roles:** `owner` (full), `admin` (edit all), `mod` (results/pick-ban/registrations), `viewer` (read-only)

---

## Directory Layout
```
/public
  /assets
  index.html
  naraka-tweaks/index.html
  egl/index.html
  scoring/index.html
  scoring/admin/index.html
  scoring/t/[slug]/index.html
  scoring/t/[slug]/admin/index.html
/src
  /styles   (Tailwind entry + tokens)
  /js       (motion, auth, storage, csv, scoring, pickban, bus)
  /api      (serverless handlers: auth, tournaments, publish)
/tailwind.config.js
```

---

## Feature Flags
- `FEATURE_SERVERLESS=true|false`
- `FEATURE_SMOOTH_SCROLL=true|false`
- `FEATURE_VIEW_TRANSITIONS=true|false`
