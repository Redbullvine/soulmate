# SOULMATE — Story Bible & Chapter Structure

## Levels vs. chapters: the decision

SOULMATE uses **chapters, not levels** — because the game spans a lifetime, and
lifetimes don't have levels. Each chapter is a **life stage** the two reborn souls
live through in parallel. Inside every chapter are 2–4 **Overlaps** — the moments
where both players' worlds sync (same chapter, same area, same time) and a memory
fragment plays. Overlaps are the checkpoint/save unit (the `progress` table keys),
chapters are the story unit. Nobody "beats level 3" — they "reach each other in
Chapter 3."

The whole game is one question asked seven ways: **how do you recognize someone
your soul knows but your eyes have never seen?**

---

## The spine

Two souls made a promise. The Gateway tore it in half. Each player carries half a
promise through an entire human life, and every chapter gives them one more way to
test the people they meet against it. The final answer is always the promise:

> "Promise me you will always be the best part of me."
> "Only if you promise me you will always be the best part of me."

False matches can *know* the words. Only the true soulmate *answers* them.

---

## Core mechanics (introduced across chapters)

- **Resonance** — when both players are in the same chapter + area at the same
  real time, the edges of both screens begin to glow faintly in the other's color.
  It never says *where* — only *near*. Grows from a whisper (Ch. 1) to a heartbeat
  pulse (Ch. 6).
- **The Test** — a dialogue action: speak the first half of the promise to any
  character. Their answer tells you everything. NPCs get *closer* to the right
  reply every chapter, which makes the Test scarier the more you need it.
- **Memory fragments** — Overlap rewards. Each replays a shard of the orb life
  (the flight, the laugh, the gate falling). Collected fragments rebuild the intro
  cinematic piece by piece in the pause menu — by the finale, the couple owns the
  whole memory again.
- **Couch-talk puzzles** — asymmetric co-op: blue sees the melody, pink sees the
  colors; blue has the map, pink has the street names. The game *requires* the
  real couple to describe things out loud to each other. Talking isn't cheating —
  it's the engine.
- **Near-miss events** — scripted heartbreaks: the players occupy the same place
  minutes apart, and the world shows it (a still-warm cup, a door swinging, pink
  petals on a bus seat that just left).
- **The Whisper** — hint system in fiction: the Echo of the orb life. Stand still
  30 seconds and the wind leans you the right way.

---

## The Crossroads — life paths, careers, and test situations

*(the Game of Life homage — chosen at the end of Chapter 2, age 18)*

At the end of the teenage chapter, the road out of town literally splits into
three glowing forks, styled like floating board-game tiles — a loving nod to the
LIFE spinner moment. Each player chooses **independently and secretly**:

- **COLLEGE** — the long road: four years, big loans, a title
- **WORK** — the straight road: boots on day one, calluses, a trade
- **SPARK** — the wild road: invent something and bet on yourself

The choice reshapes everything downstream: which neighborhoods your chapters
happen in, what your daily loop looks like, what your clues are made of — and
most importantly your **Calling**: a career ability that becomes YOUR unique way
of searching for your soulmate. Your partner picked differently, sees a different
city, and searches with a different power. The couch conversation writes itself:
"Wait — what can YOU do?"

### The nine careers (three per path)

| Path | Career | Calling (search ability) |
|---|---|---|
| College | **ER Nurse** | *Pulse* — once per area, hear every heartbeat; Resonance sharpens to a direction |
| College | **Teacher** | *Crayon Radar* — kids' drawings show glimpses of the other's world |
| College | **Architect** | *Blueprints* — read the city's bones; unlock rooftops and shortcuts nobody else has |
| Work | **Tower Tech** | *Signal* — climb any tower and sweep the whole city for Resonance like radar |
| Work | **Chef** | *Comfort Food* — dishes trigger memories; feed an NPC, unlock what they've seen |
| Work | **Session Musician** | *The Lullaby* — perform in venues; the melody carries ACROSS worlds — if the other player is in the same area at the same time, they hear it |
| Spark | **App Founder** | *Ping* — ship a missed-connections app; pins you drop surface in the other's world |
| Spark | **Game Maker** | *The Demo* — build a little game about two glowing orbs; strangers who play it start reporting their dreams to you |
| Spark | **Backyard Inventor** | *The Antenna* — a ridiculous machine the neighbors mock, until it starts picking up whispers from a world one door over |

### Test situations (the "Shifts")

Every career runs **three Shifts** — playable test situations spread across
Chapters 3–5 that test you inside the job, Life-board style. Shifts never punish
the search (pillar #1: this is not a relationship test) — they shape your
character's reputation, which Overlap variant you get, and how NPCs talk about
you (which is how your soulmate hears about you before meeting you). Every Shift
ends on a beat that rhymes with the promise. Samples:

- **ER Nurse:** two call buttons, one nurse, ninety seconds. Later, the old man
  you sat with whispers: "Whoever you're looking for — don't stop."
- **Tower Tech:** storm rolling in, one dead repeater left, and it's in the dead
  zone. Climb now or climb never. (The repeater you fix is the one that carries
  the Musician's broadcast. Careers interlock.)
- **Chef:** the critic is at table twelve and the freezer died an hour ago.
  Cook the honest dish or fake the fancy one.
- **App Founder:** the investor's term sheet has one condition — sell the users'
  data, including every missed-connection pin. "It's just data." Is it?
- **Teacher:** state test day, and the quiet kid finally raised his hand — about
  something that isn't on the test. Time for exactly one of the two.
- **Session Musician:** the label loves your song. They want to cut the weird
  four-note melody from the bridge. It's just four notes. (It's the lullaby.)

### Savings & Keepsakes

Careers pay **Savings** — no economy grind, just milestones. Savings buy
**Keepsakes** (a scarf, a music box, a snow globe with a tiny gate in it) which
you place in YOUR world — and which appear at Overlap sites in THEIRS. A gift
across worlds: your partner finds a music box playing a melody they've somehow
always known, and it acts as a Resonance beacon nearby. Leaving each other gifts
you can never watch them open — that's the whole game in one mechanic.

### Second and third Crossroads

- **Chapter 4 Crossroads:** promotion vs. passion — stay safe or go deeper.
  (The Counterfeit always endorses the choice you *didn't* make in your heart.)
- **Chapter 5 Crossroads:** stay vs. start over — the burnout fork. Choosing
  "start over" is what carries you to the park with the old iron gate.

### Engine impact

Still zero schema changes: path and career are `progress` keys
(`path:college`, `career:nurse`, `shift:nurse_2:honest`), careers are content
packs (`content/careers/*.js` — scenes, Shifts, Calling config, dialogue).
The Echo Soul picks its own career in solo mode — and never tells you which
until you catch it using its Calling.

---

## Prologue — The Forbidden Gateway *(the vertical slice)*

The orb life. The promise. The gate falls off its hinges — "Look... meant to be."
The wormhole. Two dark gooey worlds. Two births (each player picks boy/girl).
**Overlap:** the portal point; fragment #1 — "Promise me..."

## Chapter 1 — First Light *(childhood, ~age 7)*

Two kids in different towns who both dream in the wrong color. Blue's player draws
pink light in crayon; pink's player hums a melody she's never heard. Gameplay is
small and warm: bedrooms, backyards, a school fair.
- **Couch-talk puzzle:** pink hears the lullaby (4 tones), blue sees 4 colored
  fireflies — the melody unlocks only if blue lights them in the order pink sings.
- **False match:** none yet. Chapter 1 is safe. It teaches hope before the game
  spends six chapters testing it.
- **Overlaps (2):** the dream-space treehouse; the fair's mirror tent.
  Fragment #2: the orbs laughing (the horseplay audio from the intro).

## Chapter 2 — The Static *(teenage years)*

High school. Crowds. Noise. First time each player meets someone with a faint
glow — and learns most glows are static, not signal.
- **New mechanic:** the Test unlocks. First NPC answers it with a blank stare;
  another laughs; one says something *almost* sweet. None answer right.
- **Couch-talk puzzle:** passing notes across worlds — blue finds half-burned
  letters, pink finds the missing halves; only reading them aloud together
  reveals the meeting place.
- **Overlaps (3):** the bleachers at night; the record store listening booth;
  the last bus. Fragment #3: "What is this?" — arriving at the gate.
- **Chapter finale:** the Crossroads. The road out of town splits into three
  glowing board-tile forks — College, Work, or Spark — and each player chooses
  their life in secret (see "The Crossroads" above).

## Chapter 3 — Crossing Paths *(young adults, the city)*

The engine chapter. Both players now live in the SAME city — first time their
maps share geography — but each lives their chosen path: campus quarter, work
district, or garage-startup row. Daily loop = career life; **Shift #1** fires
here, and each player unlocks their **Calling**. Near-miss events debut and they
hurt: same café, 40 seconds apart — and now they're career-flavored (the nurse
treats a burn from the kitchen where the chef just quit their shift).
- **New mechanic:** Resonance becomes readable — players learn to *chase* the
  glow at screen's edge in real time. Requires actually coordinating schedules:
  "I'm at the fountain NOW." Callings amplify this differently per career.
- **False match:** The Familiar — a kind barista who feels easy and right and
  answers the Test with "I promise I'll always try." Close. Not it.
- **Overlaps (3):** the fountain at noon; the rooftop during the blackout; the
  last train car. Fragment #4: "It says FORBIDDEN!"

## Chapter 4 — The Counterfeit *(the villain chapter)*

Someone has heard the promise before. A charming stranger courts each player's
character with almost-perfect words — because the Counterfeit was *there* at the
Gateway the night it broke, a third soul that slipped through behind them and has
been borrowing other souls' promises ever since. It tailors itself to your
career: the nurse meets a "doctor" who finishes her charts, the inventor meets an
"angel investor" who loves the antenna. Too perfect. **Shift #2** and the second
Crossroads (promotion vs. passion) land in this chapter — and the Counterfeit
always argues for the fork your heart didn't pick.
- **The Test fails here.** The Counterfeit answers it word-perfect. The only tell
  is a memory the words can't carry: the gate didn't open — it *fell*. In the
  confrontation, the Counterfeit says "when the gate swung open for us..." —
  and a player who's collected fragment #5 can call the lie.
- **Couch-talk puzzle:** each player sees half of the Counterfeit's story;
  the contradictions only surface when the couple compares notes out loud.
- **Overlaps (2):** the masquerade (everyone glows here — sensory overload);
  the confrontation. Fragment #5: the gate falling — "Look... meant to be."

## Chapter 5 — The Fading *(despair)*

Years pass. The world desaturates — literally; each in-game day drains color from
both screens. The souls are forgetting the orb life. The Whisper goes quiet.
Career burnout hits: **Shift #3** is each career's hardest test ("was any of it
worth it?"), and the third Crossroads — stay or start over — decides whether you
end up at the park with the old iron gate. The chapter's work is not finding
each other — it's *refusing to forget*.
- **Mechanic inversion:** collected fragments start flickering out. The couple
  must replay/rebuild them together (both players re-enact the memory's staging
  in their own worlds simultaneously — same pose, same place, same time).
- **The lowest moment:** an Overlap that *almost* doesn't happen — the game lets
  Resonance go silent for a full scene before it returns as a heartbeat.
- **Overlaps (2):** the empty gateway park; the archive of unsent letters.
  Fragment #6: the wormhole — being torn apart (this one plays in full dark).

## Chapter 6 — Resonance *(the pull)*

The membrane between worlds thins. Each player starts seeing ghost-glimpses of
the OTHER player's world — pink watches a blue silhouette pass a window that
isn't in her world; blue hears her laugh in an empty stairwell.
- **New mechanic:** Ghost-guiding — for short windows, each player appears in the
  other's world as a faint silhouette that can point, stand, and lead (no voice,
  no text — gesture only). One leads, one follows, then it flips.
- **False match, final form:** the Counterfeit returns wearing a *blue/pink glow*.
  The Test is useless. The tell is the game's oldest rule: it can't Resonate —
  screens stay dark at its approach.
- **Overlaps (3):** the mirrored hotel; the bridge of locks; the old iron gate in
  the park — which both players finally recognize at the same moment.
  Fragment #7: landing in the gooey dark, alone.

## Chapter 7 — The Best Part of Me *(reunion)*

One long scene. A festival crowd at the park gate — hundreds of people, dozens of
glows, both players in the SAME rendered world at last (full real-time co-presence,
the only chapter with it). No map. No Whisper. Just Resonance, gesture, memory,
and a couple on a couch shouting descriptions at each other.
When they find each other — and they will only be sure by walking up and giving
the Test — the answer comes back right for the first time in seven chapters:
*"Only if you promise me you will always be the best part of me."*
The glows ignite. The camera pulls up through the crowd, through the clouds,
through the dark — back to the Gateway, where the gate lifts and re-hangs itself
on its hinges. Meant to be.
- **Post-credits:** two small glows — one gold, one green — come flying up the
  same path, laughing. The Gateway waits. (Sequel hook / New Game+ with mechanics
  remixed and role-swap.)

---

## Structure summary

| Chapter | Life stage | New mechanic | False match | Overlaps | Fragment |
|---|---|---|---|---|---|
| Prologue | The orb life | — | — | 1 | The promise |
| 1 First Light | Childhood | Couch-talk puzzles | — | 2 | The laughing |
| 2 The Static | Teens | The Test | The blank crowd | 3 | Finding the gate |
| 3 Crossing Paths | Young adult | Resonance + near-misses | The Familiar | 3 | "It says FORBIDDEN!" |
| 4 The Counterfeit | Adult | Memory-as-lie-detector | The Counterfeit | 2 | The gate falls |
| 5 The Fading | The lost years | Fragment rebuilding | despair itself | 2 | The wormhole |
| 6 Resonance | The pull | Ghost-guiding | Counterfeit reborn | 3 | Landing alone |
| 7 Best Part of Me | Reunion | Full co-presence | everyone in the crowd | 1 (finale) | The whole memory |

Life-path spine across the table: Crossroads #1 closes Chapter 2, Shift #1 +
Callings unlock in Chapter 3, Shift #2 + Crossroads #2 in Chapter 4, Shift #3 +
Crossroads #3 in Chapter 5, and Keepsakes bought along the way become Resonance
beacons in Chapters 6–7.

Engine impact: zero schema changes. Chapters are `players.scene` strings, Overlaps
are `progress` keys (`ch3_overlap_fountain`), fragments are `progress` keys —
exactly the generic design GAME_PLAN.md already ships. The Echo Soul plays every
chapter solo, and in Chapters 4 and 6 the Echo *is* the Counterfeit's understudy —
solo players get the full emotional arc.
