# SOULMATE: The Forbidden Gateway
## Game Concept + Technical Prototype Plan
*Created 2026-07-02 — vertical slice plan for a two-player couples adventure*

---

## 1. Concept

**One-liner:** Two souls who promised each other forever are torn apart by the Forbidden Gateway and reborn into separate lives. Playing on two devices with a private couple code, real-life partners must find their way back to each other — past false matches, through overlapping worlds — and prove it with the promise only they know.

**Genre:** Cinematic emotional adventure / cooperative mystery
**Players:** 2 (real-life couples, each on their own device) — or 1, playing alongside the **Echo Soul**, a computer-controlled companion orb (see §6b)
**Platform:** Browser first (desktop + mobile), later installable PWA
**Session shape:** Episodic levels (~15–30 min each), designed to be played together in the same room or apart on a call

### Design pillars
1. **This is a love story, not a game show.** No scores, no winners, no relationship tests. The only "win" is finding each other.
2. **Separation is the mechanic.** Players see different worlds, different clues, different characters. Their views only merge when they're in the same level + same area + same time.
3. **The promise is the key.** "Promise me you will always be the best part of me." / "Only if you promise me you will always be the best part of me." False matches never say it right.
4. **Awesome graphics on a browser budget.** Dark fantasy, fog, wet reflective ground, blue/pink soul glow, soft bloom. Achieved with shaders and post-processing, not heavy assets.

### Story spine (full game)
- **Prologue (the slice):** Two orbs playing, laughing, flying. The promise. The Forbidden Gateway. The gate falls off its hinges ("Look — meant to be"). The wormhole tears them apart. Two dark gooey worlds. Rebirth choice (boy/girl baby per player).
- **Acts 1–3 (future):** Reborn lives in real-world-flavored scenarios (a city, a school, a job, a crowd). Each level, players hunt clues and meet NPC "possible soulmates" — most are false. Memory fragments unlock when the couple syncs up in the same place at the same time.
- **Finale (future):** The real meeting. The promise spoken back correctly. The orbs re-ignite.

---

## 2. Tech stack (recommendation)

| Layer | Choice | Why |
|---|---|---|
| Build/UI | **Vite + React** | As specified; fast dev, Netlify-native |
| 3D | **Three.js via @react-three/fiber** | Declarative scenes as React components; huge ecosystem. Beats Babylon here because `drei` + `@react-three/postprocessing` give bloom, reflections, camera rigs, and 3D text out of the box |
| Helpers | **@react-three/drei** | `MeshReflectorMaterial` (wet ground), `Text3D` (gate sign), `Float`, `Sparkles`, `PositionalAudio`, camera controls |
| Post FX | **@react-three/postprocessing** | Bloom (the soul glow), Vignette, Noise, ChromaticAberration (wormhole) |
| State | **zustand** | Tiny store for scene machine + partner state |
| Backend | **Supabase** | Anonymous auth, Postgres for durable state, Realtime (presence + broadcast) for live sync |
| Audio | **howler.js** (2D/UI) + drei `PositionalAudio` (3D) | Laughter intro, gate crash, wormhole rumble, world ambience |
| Deploy | **Netlify** | Static build + env vars, SPA redirect |

Key packages:
```
npm create vite@latest soulmate -- --template react
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i @supabase/supabase-js zustand howler
```

---

## 3. File structure

```
soulmate/
├─ index.html
├─ package.json
├─ vite.config.js
├─ netlify.toml                  # build cmd + SPA redirect
├─ .env.local                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├─ public/
│  └─ audio/
│     ├─ laughter.mp3            # intro giggles/horseplay
│     ├─ flight-wind.mp3
│     ├─ gate-creak.mp3
│     ├─ gate-fall.mp3
│     ├─ wormhole.mp3
│     ├─ world-drips.mp3         # gooey world ambience
│     └─ memory-chime.mp3
└─ src/
   ├─ main.jsx
   ├─ App.jsx                    # top-level: UI screens vs 3D canvas
   ├─ lib/
   │  ├─ supabase.js             # client init + anonymous sign-in
   │  ├─ coupleSession.js        # createCouple(), joinCouple(code), startSolo(), pickSoul()
   │  ├─ partnerLink.js          # partner interface (events: presence, pos, atPortal, ready)
   │  ├─ realtimePartner.js      # PartnerLink impl backed by Supabase Realtime
   │  ├─ echoSoul.js             # PartnerLink impl backed by the computer companion
   │  └─ sync.js                 # realtime channel: presence + broadcast + progress
   ├─ state/
   │  └─ gameStore.js            # zustand: { phase, soul, coupleId, partner, progress }
   ├─ content/
   │  ├─ script.js               # all dialogue lines, timed, per scene per soul
   │  └─ clues.js                # clue text per soul per level
   ├─ ui/
   │  ├─ TitleScreen.jsx         # SOULMATE title, create/join/play-computer buttons
   │  ├─ CoupleCodeScreen.jsx    # show code / enter code, waiting state
   │  ├─ SoulSelect.jsx          # blue or pink (locks the other for partner)
   │  ├─ BabySelect.jsx          # boy/girl rebirth choice
   │  ├─ DialogueOverlay.jsx     # cinematic subtitles, colored per speaker
   │  └─ Hud.jsx                 # clue display, partner-presence hint
   ├─ scenes/
   │  ├─ SceneRouter.jsx         # renders active scene from gameStore.phase
   │  ├─ IntroFlight.jsx         # orbs flying/laughing, promise dialogue
   │  ├─ ForbiddenGateway.jsx    # gate, sign, bounce, gate falls
   │  ├─ Wormhole.jsx            # tunnel shader, separation moment
   │  ├─ DarkWorld.jsx           # ONE parametrized world (tint: blue|pink)
   │  └─ OverlapMemory.jsx       # worlds merge, fragment 1 plays
   ├─ three/
   │  ├─ SoulOrb.jsx             # THE hero asset: emissive core + light + sparkles
   │  ├─ Effects.jsx             # Bloom, Vignette, Noise, fog config
   │  ├─ WetGround.jsx           # MeshReflectorMaterial plane
   │  ├─ RustyGate.jsx           # primitives + rust material, hinged for the fall
   │  ├─ GateSign.jsx            # arched Text3D: "THE FORBIDDEN GATEWAY"
   │  └─ CameraRig.jsx           # spline-follow for cinematics, orbit-ish for play
   └─ audio/
      └─ useAudio.js             # howler wrapper, preload + scene cue map
```

---

## 4. Main components

- **`SoulOrb`** — the signature visual. Small sphere with high `emissiveIntensity` (blue `#4da6ff` / pink `#ff66cc`), a child `pointLight` so it lights the fog and wet ground, drei `Sparkles` trail, gentle `Float` bob. Bloom in `Effects` turns emissive into glow. Build this first; every scene reuses it.
- **`Effects`** — `<EffectComposer>` with `Bloom` (luminanceThreshold ~0.6, soft), `Vignette`, light film `Noise`. Scene fog via `<fogExp2 color="#05070d" density={0.06}>`. This one component *is* the art direction.
- **`SceneRouter`** — a state machine keyed on `gameStore.phase`: `title → code → soulSelect → intro → gateway → wormhole → babySelect → darkWorld → overlap`. Cinematic scenes advance on timers/dialogue completion; playable scenes advance on triggers.
- **`DialogueOverlay`** — reads timed lines from `content/script.js`; blue lines tinted blue, pink lines tinted pink. Same script file drives both players so cinematics stay in lockstep.
- **`DarkWorld`** — one component, tinted per soul. Wet reflective floor, gooey mounds (displaced spheres, dark glossy material), fog, drips audio, a clue object to touch, and a distant glowing portal point. Movement: WASD / touch-drag toward tap point.
- **`Wormhole`** — camera flies through a `TubeGeometry` with a scrolling shader texture + `ChromaticAberration`; the partner orb visibly pulls away and vanishes. Ends in black + silence (1.5s) before the world fades in.

---

## 5. Supabase design

### Tables

```sql
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  code text unique,                             -- 6-char human code, e.g. GLOW42; null for solo
  mode text not null default 'couple'
    check (mode in ('couple','solo')),
  status text not null default 'waiting'
    check (status in ('waiting','active','complete')),
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null,                        -- from supabase anonymous auth
  soul text check (soul in ('blue','pink')),
  baby text check (baby in ('boy','girl')),
  scene text not null default 'lobby',
  area text,
  at_portal boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (couple_id, soul),
  unique (couple_id, user_id)
);

create table public.progress (
  couple_id uuid not null references public.couples(id) on delete cascade,
  key text not null,                            -- 'gate_fallen', 'memory_fragment_1'
  unlocked_by uuid,
  unlocked_at timestamptz not null default now(),
  primary key (couple_id, key)                  -- idempotent unlocks
);
```

### Security
- Enable **anonymous sign-in** (no accounts needed — couple code is the identity).
- RLS on all tables: players can only read/write rows for their own `couple_id`.
- Join via a `security definer` RPC `join_couple(p_code text)` so clients never scan the couples table:
  looks up code → checks couple has < 2 players → inserts player row → returns couple + partner info.
- `create_couple()` RPC generates a unique 6-char code server-side.

### What lives where
| State | Storage | Why |
|---|---|---|
| Couple, soul/baby choice, scene completion, memory fragments | **Postgres** | Durable — survives refresh/disconnect |
| Position, area, at_portal, "partner is nearby" | **Realtime presence/broadcast** | Ephemeral, low latency, free of DB write costs |

---

## 6. Player sync logic

Scenes never talk to Supabase directly — they talk to a **PartnerLink** interface (`lib/partnerLink.js`) that emits the same events regardless of who the partner is:

```js
partner.on('presence', ({ scene, area, atPortal }) => ...)
partner.on('pos', ({ x, y, z }) => ...)
partner.on('ready', (sceneId) => ...)
partner.send('pos' | 'ready' | 'presence', payload)
```

`realtimePartner.js` implements it over Supabase Realtime (couple mode); `echoSoul.js` implements it with local timers and scripted behavior (solo mode, §6b). Every scene, cinematic, and the overlap trigger work identically in both modes.

1. **Channel:** on entering the game, both clients join Realtime channel `couple:{coupleId}` with presence key = soul color.
2. **Presence payload:** `{ soul, scene, area, at_portal }` — updated on every scene/area change and portal enter/leave.
3. **Position broadcast:** only while both presences show the *same scene + area*, broadcast `pos` at ~10 Hz. Otherwise don't send (they can't see each other anyway). This is the "worlds only overlap at same level + same area + same time" rule, enforced by simply not rendering the partner orb unless presence matches.
4. **Cinematic lockstep:** intro/gateway/wormhole play locally from the shared script; a `ready:{scene}` broadcast gates scene start so neither player runs ahead ("Waiting for your soulmate…" overlay).
5. **Overlap event (slice climax):** when presence shows *both* `at_portal: true` in the same scene, the **blue client** (deterministic leader — avoids double-fire) calls the unlock RPC inserting `('memory_fragment_1')` into `progress`. Both clients subscribe to `postgres_changes` on `progress` for their couple; the insert triggers the merge cinematic + "Promise me…" fragment on both screens simultaneously.
6. **Reconnect:** on load, read `players` + `progress` rows → restore phase. Presence re-establishes automatically on channel rejoin.

---

## 6b. Play Computer — the Echo Soul (solo mode)

For players without a partner available, the title screen offers **"Play with computer."** In-fiction, the companion is an **Echo Soul** — a memory of a soulmate, so solo play never breaks the story. When a real partner is ready later, the couple starts fresh in couple mode.

- **Start:** `startSolo(soul)` calls a `create_solo()` RPC — inserts a `couples` row with `mode='solo'`, `code=null`, `status='active'` and one `players` row. No pairing screen, no waiting; the player picks their soul and the Echo takes the other color automatically. Progress still persists in `progress`, so solo runs survive refresh.
- **No realtime:** solo mode never opens a channel. `echoSoul.js` fulfills the PartnerLink contract locally:
  - **Cinematics** — emits `ready` immediately and speaks the other soul's lines from the same `content/script.js`, so the intro, gateway, and wormhole play out identically.
  - **Dark world** — the Echo is "in its own world" (invisible, exactly like couple mode). It emits ambient presence updates so the HUD can whisper hints ("You feel them moving…").
  - **Overlap** — when the player reaches the portal, the Echo waits a believable delay (20–60 s, shorter if the player found the clue fast), then emits `atPortal: true`. The same overlap code path fires and the unlock RPC writes `memory_fragment_1` just like couple mode.
- **Future levels:** the Echo also plays the false-match beats — it can *be* one of the crowd characters, and the player still has to identify it by the promise. Solo mode doubles as the tutorial for reading false matches.
- **One rule:** nothing in `scenes/` or `three/` may ever check `mode === 'solo'`. If a scene needs to know who the partner is, the abstraction is leaking — fix it inside `echoSoul.js`.

---

## 7. Vertical slice — implementation plan

**Phase 1 — Foundation (the pipes)**
Scaffold Vite + React. Supabase project: anonymous auth on, tables + RLS + RPCs above (including `create_solo()`). Build `TitleScreen → CoupleCodeScreen → SoulSelect` flow end-to-end with two browser tabs pairing successfully, plus the one-tap solo path. Define the `PartnerLink` interface now, with a stub `echoSoul.js` that just auto-readies — the full Echo behavior lands in Phase 7. Deploy to Netlify on day one so every phase is testable on two phones.

**Phase 2 — The look (the hero asset)**
`SoulOrb` + `Effects` + fog + `WetGround` in an empty test scene. Iterate until the orb glow gives chills. Everything after inherits this.

**Phase 3 — Intro cinematic**
`IntroFlight`: two orbs on a spline path over a misty landscape, laughter audio, `DialogueOverlay` playing the promise exchange. Camera rig follows.

**Phase 4 — The Forbidden Gateway**
`RustyGate` + arched `GateSign` between two poles, gloomy end-of-area lighting shift. Scripted beat: pink bounces on the gate → on the word "see" the gate breaks off its hinges and slams down (simple hinge rotation + dust particles + crash audio). "Look — meant to be."

**Phase 5 — Wormhole separation**
Tunnel fly-through, orbs forced apart, partner vanishes, hard cut to black + silence. `BabySelect` (boy/girl) plays as a short rebirth vignette, then fade into the gooey world tinted per soul.

**Phase 6 — Dark worlds + clue**
`DarkWorld` playable: move the orb, touch the clue object (each soul gets a *different* clue from `content/clues.js`), find the distant glowing portal point.

**Phase 7 — The overlap + Echo Soul**
Sync logic from §6. Both at portal → worlds visually merge (partner orb fades in through the fog) → `OverlapMemory` fragment: the promise lines replay as echoing audio + text. Slice ends on "To be continued…" Then flesh out `echoSoul.js` (§6b) — scripted dialogue playback, hint presence, timed portal arrival — and verify the whole slice plays start-to-finish solo with zero scene-code changes.

**Phase 8 — Polish + ship**
Mobile touch controls, loading screen, audio mix, perf pass (target 60fps desktop / 30fps mid phones — cap pixel ratio at 1.5, keep bloom resolution half), Netlify env vars, PWA manifest stub for later.

---

## 8. Netlify deploy

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
Env vars in Netlify UI: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable key only — never the service key).

---

## 9. Expansion hooks (built into the slice, used later)

- `progress.key` is generic → any future unlock (fragments 2–12, act completions) needs zero schema change.
- `players.scene/area` strings → new levels are just new scene components + content files.
- `content/script.js` + `clues.js` → writers can add story without touching engine code.
- False-match NPCs: an `npcs.js` content file + a dialogue check — the NPC always gets the promise *slightly wrong* ("Promise me you'll always be the best part of *us*").
- PWA: add `vite-plugin-pwa` when ready for install-to-home-screen.
