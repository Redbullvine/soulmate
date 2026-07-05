/* SOULMATE: LIFE PATHS — playable life-simulation MVP.
   Three lives, one soul. All local: no AI, no payments, no location, no accounts. */
window.LifePaths = (function () {
  'use strict';

  const LKEY = 'soulmate_lifepaths_v1';

  const STATS = [
    ['money', 'Money', '#d9c07a'], ['health', 'Health', '#6ee7a8'],
    ['love', 'Love', '#ff66cc'], ['fame', 'Fame', '#c58bff'],
    ['freedom', 'Freedom', '#4da6ff'], ['risk', 'Risk', '#ff8a5c'],
    ['purpose', 'Purpose', '#ffd166'], ['reputation', 'Reputation', '#8fd3ff'],
  ];

  /* ------------------------------------------------ paths & chapters
     choice: { t: label, fx: {stat: delta}, r: result line,
               echo: memory string|null, hid: {rec, tim, pull} } */
  const PATHS = [
    {
      id: 'teen', title: 'High School Crossroads', age: '13+', teen: true,
      desc: 'Balance school, friends, talent, pressure, and the choices that shape who you become.',
      start: { money: 40, health: 65, love: 50, fame: 40, freedom: 55, risk: 45, purpose: 50, reputation: 50 },
      chapters: [
        { title: 'The Tryout', text: 'The team list goes up Friday. The audition is the same day as the biggest study group of the term.', choices: [
          { t: 'Go to the tryout', fx: { fame: 10, health: 5, risk: 8, money: -3 }, r: 'You make the cut — barely. People start learning your name.' },
          { t: 'Choose the study group', fx: { reputation: 10, purpose: 8, freedom: -5 }, r: 'The grade comes back strong. Something else quietly does not.', echo: 'The safe choice was not free.' },
          { t: 'Skip both with your friends', fx: { freedom: 12, love: 8, reputation: -8 }, r: 'Best afternoon of the year. Monday has questions.' } ] },
        { title: 'The New Kid', text: 'Someone transfers in mid-semester. They laugh at the exact moment you do — at something nobody else found funny.', choices: [
          { t: 'Say hi first', fx: { love: 14, risk: 5 }, r: 'The conversation feels like it started years ago.', hid: { rec: 18, pull: 15 } },
          { t: 'Wait for them to come to you', fx: { freedom: 4 }, r: 'They sit with someone else. You keep noticing.', hid: { rec: 8, tim: -10 }, echo: 'You left too early.' },
          { t: 'Show off a little', fx: { fame: 8, reputation: -5, love: 4 }, r: 'They smile. You cannot tell what kind of smile.', hid: { rec: 6, pull: 5 } } ] },
        { title: 'The Big Test', text: 'Half your future rides on one exam. The kid next to you leaves their answers in plain view.', choices: [
          { t: 'Grind all week', fx: { purpose: 12, health: -8, reputation: 8 }, r: 'You earn every point. You also learn you can.' },
          { t: 'Glance at the answers', fx: { money: 4, reputation: -14, risk: 10 }, r: 'You pass. Something in you keeps the receipt.', echo: 'Money bought silence, not peace.' },
          { t: 'Wing it and trust yourself', fx: { freedom: 8, risk: 8, purpose: 4 }, r: 'B-minus. But it is YOUR B-minus.' } ] },
        { title: 'The Dance', text: 'The gym is lit up like a cheap galaxy. Someone is standing by the door like they are deciding whether to stay.', choices: [
          { t: 'Walk over and ask', fx: { love: 16, fame: 4, risk: 6 }, r: 'One song. It felt familiar — like you had heard it somewhere before everything.', hid: { rec: 15, tim: 12, pull: 12 }, echo: 'The song felt familiar.' },
          { t: 'Stay with your friends', fx: { love: 4, freedom: 5 }, r: 'A great night. Near the door, a space where someone used to be.', hid: { tim: -12 }, echo: 'You ignored the message.' },
          { t: 'Leave early', fx: { freedom: 8, health: 4, love: -6 }, r: 'The night air is cold and honest. The music follows you half a block.', hid: { tim: -18 } } ] },
        { title: 'Graduation Speech', text: 'They hand you the microphone. Four hundred people. One chance to say something true.', choices: [
          { t: 'Say the true thing', fx: { purpose: 15, reputation: 10, fame: 8, risk: 5 }, r: 'Silence, then applause. Some people find you after — one of them looks like the future.', hid: { rec: 8, pull: 8 } },
          { t: 'Play it safe and thank everyone', fx: { reputation: 5, purpose: -4 }, r: 'Nice speech, someone says. You already cannot remember it.' },
          { t: 'Skip the ceremony', fx: { freedom: 14, love: -5, reputation: -6 }, r: 'You watch the caps fly from the parking lot. It looks like a question.', echo: 'You left too early.' } ] },
      ],
    },
    {
      id: 'launch', title: 'College or Work', age: '18+', teen: false,
      desc: 'Choose college, trade school, straight to work, military, startup life, or the unknown.',
      start: { money: 35, health: 60, love: 45, fame: 35, freedom: 55, risk: 50, purpose: 50, reputation: 50 },
      chapters: [
        { title: 'The Fork', text: 'Three envelopes on the table: an acceptance letter, a trade apprenticeship, and a paycheck that starts Monday.', choices: [
          { t: 'Take the degree', fx: { money: -12, purpose: 10, reputation: 10 }, r: 'Debt now, doors later. You hope.' },
          { t: 'Learn the trade', fx: { money: 8, purpose: 8, freedom: 5 }, r: 'Your hands learn faster than lectures ever did.' },
          { t: 'Start earning Monday', fx: { money: 14, freedom: -6, purpose: -5 }, r: 'The paycheck is real. So is the ceiling.', echo: 'The safe choice was not free.' } ] },
        { title: 'The Roommate’s Idea', text: 'At 2 a.m. your roommate sketches an app on a pizza box. It is either genius or nothing.', choices: [
          { t: 'Go all in with them', fx: { risk: 15, money: -10, purpose: 12, freedom: 8 }, r: 'You quit sleep instead of your day job. The pizza box goes on the wall.' },
          { t: 'Help nights and weekends', fx: { purpose: 6, health: -6, money: 4 }, r: 'Half in. Every half-thing costs a whole night.' },
          { t: 'Pass — and keep your lane', fx: { reputation: 5, risk: -8 }, r: 'Two years later you see the app on a billboard. Maybe. It is hard to look at.', echo: 'The safe choice was not free.' } ] },
        { title: 'The Offer', text: 'A chance appears that could change everything — but taking it means leaving something behind.', choices: [
          { t: 'Take the safe path', fx: { money: 12, reputation: 6, freedom: -8 }, r: 'Stability settles over you like a warm, slightly heavy coat.', hid: { tim: -8 } },
          { t: 'Chase the dream', fx: { purpose: 15, money: -8, risk: 12, fame: 6 }, r: 'You jump. The ground is further and softer than you thought.', hid: { pull: 8 } },
          { t: 'Wait for a sign', fx: { freedom: 4, purpose: -5 }, r: 'The sign comes three weeks late. It says: it was here.', hid: { tim: -14 }, echo: 'You ignored the message.' } ] },
        { title: 'The Airport', text: 'Someone you never quite stopped thinking about is boarding a one-way flight in ninety minutes. You could make it.', choices: [
          { t: 'Drive. Now.', fx: { love: 18, risk: 12, money: -6 }, r: 'Gate B7. They see you before you see them.', hid: { rec: 20, tim: 18, pull: 15 } },
          { t: 'Send a message instead', fx: { love: 5 }, r: 'Delivered. Read. The dots appear and disappear at 30,000 feet.', hid: { rec: 10, tim: -10 }, echo: 'The airport felt important.' },
          { t: 'Let them go', fx: { freedom: 8, purpose: 4, love: -10 }, r: 'Some doors close so quietly you hear it for years.', hid: { tim: -20 }, echo: 'The airport felt important.' } ] },
        { title: 'The Five-Year Mark', text: 'You wake up exactly where you planned to be. The plan never asked if you would like it.', choices: [
          { t: 'Double down on the career', fx: { money: 15, fame: 6, health: -8, love: -6 }, r: 'The title gets longer. The apartment gets quieter.' },
          { t: 'Rebalance everything', fx: { health: 10, love: 10, money: -6, purpose: 6 }, r: 'You buy back your evenings at full price. Worth it.', hid: { pull: 6 } },
          { t: 'Quit and travel', fx: { freedom: 18, money: -14, purpose: 8, risk: 8 }, r: 'You trade the plan for a backpack. Somewhere out there, something is waiting to be recognized.', hid: { rec: 8, pull: 8 } } ] },
      ],
    },
    {
      id: 'fame', title: 'Rock Star Timeline', age: '18+', teen: false,
      desc: 'Chase the spotlight, survive the crash, and find out what fame costs.',
      start: { money: 25, health: 60, love: 50, fame: 55, freedom: 60, risk: 60, purpose: 55, reputation: 45 },
      chapters: [
        { title: 'Garage Nights', text: 'Three chords, one borrowed amp, and a crowd of five people who believe. One of them always stands in the same spot.', choices: [
          { t: 'Play every night, no matter what', fx: { fame: 12, health: -8, purpose: 8 }, r: 'Your voice goes hoarse. Your name does not.' },
          { t: 'Write instead of perform', fx: { purpose: 12, fame: 4, love: 5 }, r: 'One of the songs is about the person in the same spot. You do not tell them.', hid: { rec: 12, pull: 10 } },
          { t: 'Keep the day job, gig weekends', fx: { money: 10, fame: -4, freedom: -5 }, r: 'Sensible. The amp gathers a little dust between Fridays.' } ] },
        { title: 'The Deal', text: 'A label wants the band — minus the drummer who started it all with you. Sign, and the road opens.', choices: [
          { t: 'Sign it', fx: { fame: 18, money: 15, love: -10, reputation: -8 }, r: 'The contract weighs two hundred grams and one friendship.', echo: 'Someone knew you before the fame.', hid: { pull: -8 } },
          { t: 'Refuse — everyone or no one', fx: { reputation: 14, purpose: 10, money: -8, fame: -5 }, r: 'The label walks. The band stays. Some nights you wonder; most nights you do not.' },
          { t: 'Negotiate for the drummer', fx: { reputation: 8, risk: 8, fame: 6 }, r: 'You win — mostly. The label remembers you fight back.' } ] },
        { title: 'The Tour', text: 'Forty cities in fifty nights. In one of them, someone holds up a sign with the words of a song you never released.', choices: [
          { t: 'Stop the show and ask', fx: { fame: 8, love: 10, risk: 6 }, r: 'The crowd goes quiet. The sign says the words in YOUR handwriting.', hid: { rec: 22, pull: 18 }, echo: 'The promise almost returned.' },
          { t: 'Finish the set — find them after', fx: { fame: 6, reputation: 4 }, r: 'After the encore, the spot by the rail is empty.', hid: { rec: 12, tim: -14 }, echo: 'You left too early.' },
          { t: 'Ignore it — signs are just signs', fx: { fame: 8, health: -5, love: -6 }, r: 'Forty cities. They start to look the same.', hid: { tim: -12, pull: -6 } } ] },
        { title: 'The Crash', text: 'The bus, the rain, the guardrail. Everyone walks away — but the tour is over, and so is the noise.', choices: [
          { t: 'Rest until you are actually whole', fx: { health: 16, fame: -8, purpose: 8 }, r: 'Silence turns out to have a sound. You had not heard it in years.', hid: { rec: 8 } },
          { t: 'Back on stage in six weeks', fx: { fame: 12, health: -15, money: 8 }, r: 'The show goes on. Something in you stays at the guardrail.', echo: 'Money bought silence, not peace.' },
          { t: 'Disappear to a small town', fx: { freedom: 12, fame: -12, love: 8, health: 8 }, r: 'Nobody there knows the songs. Someone there hums one anyway.', hid: { rec: 14, pull: 10 }, echo: 'The song felt familiar.' } ] },
        { title: 'The Comeback', text: 'One night. One stage. Everyone who ever mattered is either in the crowd, or gone, or — possibly — both.', choices: [
          { t: 'Play the new songs — the honest ones', fx: { purpose: 15, fame: 10, love: 8 }, r: 'You sing the promise you almost forgot. Someone in the third row mouths every word.', hid: { rec: 15, tim: 10, pull: 12 } },
          { t: 'Play the hits', fx: { money: 14, fame: 8, purpose: -6 }, r: 'The crowd sings for you. It is easier and emptier than you remember.' },
          { t: 'Walk off before the encore', fx: { freedom: 15, fame: -10, purpose: 6 }, r: 'You leave them wanting. You leave you wondering.', hid: { tim: -10 } } ] },
      ],
    },
    {
      id: 'crisis', title: 'Middle Age Restart', age: '30+', teen: false,
      desc: 'Lose the plan, find the fire, and rebuild from the middle of the storm.',
      start: { money: 55, health: 45, love: 40, fame: 35, freedom: 35, risk: 40, purpose: 35, reputation: 60 },
      chapters: [
        { title: 'The Letter', text: 'Twenty years of showing up, folded into one paragraph: the position no longer exists. Neither, suddenly, does the plan.', choices: [
          { t: 'Update the resume that night', fx: { money: 8, reputation: 6, purpose: -4 }, r: 'You land interviews for a life you are not sure you want back.' },
          { t: 'Take the severance and breathe', fx: { health: 10, freedom: 10, money: -8 }, r: 'For the first time in decades, Tuesday belongs to you.', hid: { pull: 6 } },
          { t: 'Burn the plan on the grill', fx: { freedom: 14, risk: 10, reputation: -5 }, r: 'The neighbors watch. One of them applauds.', echo: 'The safe choice was not free.' } ] },
        { title: 'The Empty House', text: 'The kids are grown, the halls are quiet, and the person across the table feels like a photograph of someone you knew.', choices: [
          { t: 'Plan one honest dinner', fx: { love: 14, purpose: 6 }, r: 'Two hours. No phones. You find each other roughly where you left off.', hid: { rec: 12, pull: 10 } },
          { t: 'Give each other space', fx: { freedom: 8, love: -8 }, r: 'The house gets quieter, politely.', hid: { tim: -10 } },
          { t: 'Fill the silence with projects', fx: { money: 6, health: -4, love: -4 }, r: 'The deck is beautiful. The table is still quiet.', echo: 'Money bought silence, not peace.' } ] },
        { title: 'The Old Dream', text: 'In a box in the garage: the thing you were going to be before you became what you are.', choices: [
          { t: 'Pick it back up, seriously', fx: { purpose: 16, money: -6, health: 5 }, r: 'Your hands remember. Your calendar complains. You outvote it.', hid: { pull: 8 } },
          { t: 'Frame it and let it go', fx: { health: 6, purpose: 4 }, r: 'Peace, mostly. On rainy days it hums from the wall.' },
          { t: 'Sell it all online', fx: { money: 10, purpose: -8 }, r: 'The buyer says: I always wanted one of these. So did you.', echo: 'You ignored the message.' } ] },
        { title: 'The Reunion', text: 'Thirty years later, a name tag across the gym says a name your chest recognizes before your eyes do.', choices: [
          { t: 'Cross the room', fx: { love: 15, risk: 8 }, r: 'You talk until the janitor flicks the lights. Some conversations just pause, not end.', hid: { rec: 22, tim: 15, pull: 15 }, echo: 'The promise almost returned.' },
          { t: 'Nod from a distance', fx: { reputation: 4 }, r: 'They nod back. The room stays exactly the size it is.', hid: { rec: 10, tim: -12 }, echo: 'You left too early.' },
          { t: 'Leave before dessert', fx: { freedom: 6, love: -6 }, r: 'The parking lot again. You are becoming an expert on parking lots.', hid: { tim: -18 } } ] },
        { title: 'The Rebuild', text: 'The storm passes. What stands is what you chose to hold. What rises is up to you.', choices: [
          { t: 'Build the second act', fx: { purpose: 15, money: 8, fame: 5 }, r: 'They call it a late start. You call it perfect timing.', hid: { pull: 8 } },
          { t: 'Build the smaller, truer life', fx: { health: 12, love: 10, money: -5, freedom: 8 }, r: 'Less house, more home.', hid: { rec: 8, pull: 8 } },
          { t: 'Chase what you lost', fx: { risk: 14, love: 6, health: -6 }, r: 'Some of it comes back. Some of it teaches you why it left.' } ] },
      ],
    },
    {
      id: 'island', title: 'Island Ending', age: '60+', teen: false,
      desc: 'Retire rich, peaceful, forgotten, wild, or alone on your own island.',
      start: { money: 70, health: 45, love: 45, fame: 40, freedom: 60, risk: 30, purpose: 45, reputation: 60 },
      chapters: [
        { title: 'The Last Day', text: 'They give you a cake and a plaque with your name spelled right. Forty years, four pounds of frosting.', choices: [
          { t: 'Give a speech that means it', fx: { reputation: 10, purpose: 8, love: 5 }, r: 'Even the interns cry. You mean every word, especially the goodbye.' },
          { t: 'Slip out during the toast', fx: { freedom: 12, reputation: -4 }, r: 'By the time they cut the cake you are already driving toward water.', echo: 'You left too early.' },
          { t: 'Ask to consult part-time', fx: { money: 10, freedom: -8, purpose: 4 }, r: 'Retired, asterisk.' } ] },
        { title: 'The Island Offer', text: 'A stretch of sand with your name on the deed — if you spend most of what the years saved.', choices: [
          { t: 'Buy the island', fx: { money: -20, freedom: 16, risk: 10, fame: 4 }, r: 'The deed smells like salt. The horizon is suddenly personal.' },
          { t: 'Rent a cottage there instead', fx: { money: -5, health: 8, freedom: 8 }, r: 'Same sunset, smaller paperwork.' },
          { t: 'Stay near the grandkids', fx: { love: 14, freedom: -5, purpose: 8 }, r: 'Tuesday pancakes become the axis of the week.', hid: { pull: 8 } } ] },
        { title: 'The Visitors', text: 'The dock creaks. Family, old friends, and one face you have not seen since a promise you half remember.', choices: [
          { t: 'Welcome everyone, all summer', fx: { love: 14, money: -8, health: -4 }, r: 'The island is loud and alive. The freezer is never full enough.', hid: { rec: 15, pull: 12 } },
          { t: 'One guest at a time', fx: { love: 8, freedom: 6 }, r: 'Long talks on the dock. The half-remembered face stays an extra day.', hid: { rec: 18, tim: 10, pull: 12 }, echo: 'The promise almost returned.' },
          { t: 'Guard the solitude', fx: { freedom: 12, love: -10 }, r: 'The dock stops creaking. You notice you listen for it.', hid: { tim: -14 }, echo: 'You ignored the message.' } ] },
        { title: 'The Storm', text: 'The radio says it will pass south. The sky disagrees. The boat can make one trip to the mainland.', choices: [
          { t: 'Evacuate with the photo albums', fx: { health: 8, money: -6, love: 6 }, r: 'Paper memories, dry and safe. Houses can be rebuilt.' },
          { t: 'Ride it out', fx: { risk: 16, freedom: 8, health: -10 }, r: 'The island and you come to an understanding around 3 a.m.' },
          { t: 'Make the trip twice — for the neighbor', fx: { love: 12, reputation: 12, risk: 10, health: -6 }, r: 'The second crossing is the one everyone remembers.', hid: { pull: 8 } } ] },
        { title: 'The Horizon', text: 'The water goes gold in the evening. The chair beside yours is either empty or it is not. That part was up to all of it.', choices: [
          { t: 'Write it all down', fx: { purpose: 14, fame: 6, love: 5 }, r: 'The last line takes the longest: "Promise me you will always be the best part of me."', hid: { rec: 12, pull: 10 }, echo: 'The promise almost returned.' },
          { t: 'Watch the sunset, say nothing', fx: { health: 8, freedom: 8 }, r: 'Some evenings are complete sentences.' },
          { t: 'Plan one more adventure', fx: { risk: 12, health: -5, freedom: 10 }, r: 'The map on the table is new. Your handwriting on it is not old either.' } ] },
      ],
    },
    {
      id: 'soulstory', title: 'Find You Again', age: 'Story Mode', teen: true,
      desc: 'Two souls were split beyond the Forbidden Gateway. Only one promise survived.',
      start: { money: 40, health: 55, love: 55, fame: 35, freedom: 50, risk: 45, purpose: 55, reputation: 50 },
      chapters: [
        { title: 'The Dream of Light', text: 'Every night, the same dream: two glows racing above clouds, laughing in a language you forgot when you woke up.', choices: [
          { t: 'Write the dream down', fx: { purpose: 10, love: 5 }, r: 'The notebook fills with blue and pink ink. You do not own blue and pink ink.', hid: { rec: 15, pull: 12 } },
          { t: 'Tell someone about it', fx: { love: 8, reputation: -4 }, r: 'They laugh — then stop, and ask what color the other light was.', hid: { rec: 12, pull: 8 } },
          { t: 'Dismiss it — dreams are dreams', fx: { freedom: 5, purpose: -5 }, r: 'The dream stops coming. The quiet it leaves is worse.', hid: { pull: -10, tim: -8 }, echo: 'Lost the thread of light.' } ] },
        { title: 'The Song', text: 'A song comes on in a crowded place — a melody you have never heard and somehow already know the next four notes of.', choices: [
          { t: 'Ask who is playing it', fx: { love: 8, risk: 5 }, r: 'Nobody requested it. The playlist does not contain it.', hid: { rec: 18, pull: 12 }, echo: 'The song felt familiar.' },
          { t: 'Hum along quietly', fx: { purpose: 6 }, r: 'A stranger across the room turns their head at the exact same wrong note.', hid: { rec: 14, tim: 8, pull: 10 }, echo: 'The song felt familiar.' },
          { t: 'Step outside for air', fx: { freedom: 6, health: 4 }, r: 'Through the wall, the melody plays one more chorus, just for the room you left.', hid: { tim: -14 }, echo: 'You left too early.' } ] },
        { title: 'The Message', text: 'An unknown number: "I know this sounds crazy, but were you at the gateway park tonight? I keep feeling like I just missed someone."', choices: [
          { t: 'Reply: "When?"', fx: { love: 10, risk: 8 }, r: 'The answer comes instantly: "Every night this week."', hid: { rec: 20, tim: 12, pull: 15 } },
          { t: 'Screenshot it, answer tomorrow', fx: { freedom: 4 }, r: 'Tomorrow, the number is disconnected.', hid: { tim: -16 }, echo: 'You ignored the message.' },
          { t: 'Block it — probably a scam', fx: { reputation: 4, love: -6 }, r: 'Probably. The word does a lot of work in that sentence.', hid: { pull: -12, tim: -12 }, echo: 'You ignored the message.' } ] },
        { title: 'The Gateway Park', text: 'An old iron gate between two stone posts, and the arch above it missing its sign. Locals say there used to be words up there.', choices: [
          { t: 'Wait by the gate at dusk', fx: { love: 10, purpose: 8 }, r: 'At full dark, footsteps. They stop on the other side of the gate — breathing, waiting, familiar.', hid: { rec: 22, tim: 15, pull: 18 }, echo: 'The promise almost returned.' },
          { t: 'Research the gate’s history', fx: { purpose: 10, fame: 4 }, r: 'One photo, 1904: the sign read FORBIDDEN GATEWAY. Your hands know the font.', hid: { rec: 15, pull: 10 } },
          { t: 'Come back in daylight instead', fx: { health: 5, freedom: 4 }, r: 'Daylight is safer. Whatever waits at dusk agrees, and waits.', hid: { tim: -12 } } ] },
        { title: 'The Promise', text: 'Everything converges here: the dream, the song, the message, the gate. Someone stands beneath the empty arch. They speak first: "Promise me…"', choices: [
          { t: '"…you will always be the best part of me."', fx: { love: 20, purpose: 12 }, r: 'You both finish it. The arch above you is not empty anymore.', hid: { rec: 25, tim: 15, pull: 20 } },
          { t: 'Say nothing — hold out your hand', fx: { love: 12, risk: 6 }, r: 'Some promises are older than words. The hand that takes yours glows faintly.', hid: { rec: 18, tim: 10, pull: 15 } },
          { t: 'Ask "Do I know you?"', fx: { love: 4, purpose: 4 }, r: '"Not yet," they say. "Again."', hid: { rec: 12, tim: 5, pull: 10 } } ] },
      ],
    },
  ];

  /* ------------------------------------------------ state */
  const FRESH = () => ({
    mode: 'teen', pathId: null, lifeNum: 1, chapter: 0, phase: 'idle',
    stats: null, hid: { rec: 0, tim: 0, pull: 0 },
    echoes: [], lifeResults: [], lastChoice: null, majorChoice: null, echoShown: false,
  });
  let G = load();

  function load() {
    try { const raw = localStorage.getItem(LKEY); if (raw) return Object.assign(FRESH(), JSON.parse(raw)); } catch (e) {}
    return FRESH();
  }
  function save() { localStorage.setItem(LKEY, JSON.stringify(G)); }
  function path() { return PATHS.find(p => p.id === G.pathId); }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function toastLP(msg, ms = 4600) {
    const t = document.getElementById('toasts'); if (!t) return;
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    t.appendChild(el);
    setTimeout(() => el.classList.add('gone'), ms - 600);
    setTimeout(() => el.remove(), ms);
  }

  /* ------------------------------------------------ soul status & endings */
  function soulStatus() {
    const h = G.hid;
    if (h.pull >= 55 && h.rec >= 55 && h.tim >= 40) return 'Soulmate Found';
    if (h.rec >= 50 && h.tim < 20) return 'Near Miss';
    if (G.lifeNum === 3) return 'Final Chance';
    if (G.echoShown && h.rec >= 30) return 'Remembering';
    if (h.pull <= -5) return 'Lost Signal';
    return 'Searching';
  }

  function computeEnding() {
    const s = G.stats, h = G.hid, n = G.lifeNum, E = G.echoes, p = path();
    const found = h.pull >= 55 && h.rec >= 55 && h.tim >= 40;
    if (found) return ['Soulmate Found', 'Soulmate Found'];
    if (n === 3 && E.length >= 4 && h.rec >= 50) return ['The Promise Remembered', 'Remembering'];
    if (h.rec >= 50 && h.tim < 20) return ['Missed by Minutes', 'Near Miss'];
    if (p.id === 'island') {
      if (s.money >= 65 && s.love < 45) return ['Island Alone', 'Lost Signal'];
      if (s.health >= 50 && s.love >= 50) return ['Peaceful Retirement', 'Searching'];
    }
    if (s.fame >= 72 && s.love <= 42) return ['Famous but Empty', 'Lost Signal'];
    if (s.money >= 72 && s.love <= 42) return ['Rich but Alone', 'Lost Signal'];
    if ((s.health <= 28 || s.money <= 18) && s.purpose >= 55) return ['Lost Everything, Found Yourself', 'Found Yourself Instead'];
    if (s.purpose >= 68 && s.love <= 42) return ['Built the Dream, Lost the Person', 'Searching'];
    if (s.love >= 68 && s.purpose <= 42) return ['Found the Person, Lost the Dream', 'Searching'];
    if (n === 2 && E.length >= 3) return ['Second Chance Unlocked', 'Remembering'];
    if (s.risk <= 38 && s.love < 58) return ['Safe but Wondering', 'Searching'];
    if (n === 3) return ['Final Life Complete', 'Final Chance'];
    return ['Safe but Wondering', 'Searching'];
  }

  /* ------------------------------------------------ actions */
  function setMode(m) { G.mode = m; save(); renderPaths(); }

  function startPath(id) {
    const p = PATHS.find(x => x.id === id);
    if (!p) return;
    if (G.mode === 'teen' && !p.teen) { toastLP('🔒 This path is locked in Teen Mode.'); return; }
    if (G.pathId !== id) { G.lifeNum = 1; G.lifeResults = []; G.echoes = []; }
    G.pathId = id;
    beginLife();
    location.hash = '#play';
  }

  function beginLife() {
    const p = path();
    G.stats = Object.assign({}, p.start);
    G.hid = { rec: 0, tim: 0, pull: 0 };
    G.chapter = 0; G.phase = 'chapter'; G.lastChoice = null; G.majorChoice = null; G.echoShown = false;
    // echoes carried from past lives sharpen the soul a little
    G.hid.rec += Math.min(20, G.echoes.length * 4);
    save();
  }

  function choose(i) {
    const ch = path().chapters[G.chapter];
    const c = ch.choices[i];
    const deltas = [];
    for (const k in c.fx) { G.stats[k] = clamp(G.stats[k] + c.fx[k]); deltas.push([k, c.fx[k]]); }
    if (c.hid) { G.hid.rec += c.hid.rec || 0; G.hid.tim += c.hid.tim || 0; G.hid.pull += c.hid.pull || 0; }
    if (c.echo && !G.echoes.includes(c.echo)) {
      G.echoes.push(c.echo);
      toastLP('✧ Echo Memory gained: “' + c.echo + '”');
    }
    const big = Math.max(...Object.values(c.fx).map(Math.abs));
    if (!G.majorChoice || big >= (G.majorChoice.mag || 0)) G.majorChoice = { text: c.t, chapter: ch.title, mag: big };
    G.lastChoice = { r: c.r, deltas, label: c.t };
    G.phase = 'result';
    save(); renderPlay();
  }

  function nextChapter() {
    if (G.chapter + 1 >= path().chapters.length) {
      const [ending, status] = computeEnding();
      G.lifeResults.push({
        life: G.lifeNum, ending, status,
        major: G.majorChoice, stats: Object.assign({}, G.stats),
        echoes: G.echoes.slice(),
      });
      G.phase = G.lifeNum >= 3 ? 'finale' : 'lifeEnd';
    } else {
      G.chapter++; G.phase = 'chapter'; G.lastChoice = null;
    }
    save(); renderPlay();
  }

  function nextLife() { G.lifeNum++; beginLife(); renderPlay(); }
  function reset() { G = FRESH(); save(); renderPaths(); renderPlay(); toastLP('Timeline reset. Three new lives await.'); }

  /* ------------------------------------------------ renderers */
  function statBars() {
    return `<div class="statGrid">` + STATS.map(([k, label, col]) => `
      <div class="statRow"><span class="statLabel">${label}</span>
        <span class="statTrack"><span class="statFill" style="width:${G.stats[k]}%;background:${col};box-shadow:0 0 10px ${col}"></span></span>
        <span class="statNum">${G.stats[k]}</span></div>`).join('') + `</div>`;
  }

  function lifeHeader() {
    const lifeLabel = G.lifeNum >= 3 ? 'Final Life' : `Life ${G.lifeNum} of 3`;
    return `<div class="lifeHeader">
      <span class="lifeChip ${G.lifeNum >= 3 ? 'final' : ''}">${lifeLabel}</span>
      <span class="lifeChip soul">Soul: ${soulStatus()}</span>
      <span class="lifeChip dim">${esc(path().title)}</span>
      <button class="btn btn-tiny btn-danger" id="lpReset">Reset Simulation</button>
    </div>`;
  }

  function maybeEchoHint() {
    if (G.lifeNum < 2 || !G.echoes.length) return '';
    if (G.chapter !== 1 && G.chapter !== 3) return '';
    const e = G.echoes[(G.chapter + G.lifeNum) % G.echoes.length];
    if (!G.echoShown) { G.echoShown = true; G.hid.rec += 6; save(); }
    return `<div class="echoHint">✧ Echo Memory: <em>Something about this feels familiar — “${esc(e)}”</em></div>`;
  }

  function renderPaths() {
    const el = document.getElementById('pathsContent'); if (!el) return;
    el.innerHTML = `
      <div class="modeRow">
        <span class="muted">Experience Mode:</span>
        <button class="modeBtn ${G.mode === 'teen' ? 'sel' : ''}" data-mode="teen">Teen Mode · 13+</button>
        <button class="modeBtn ${G.mode === 'adult' ? 'sel' : ''}" data-mode="adult">Adult Mode · 18+</button>
      </div>
      <div class="cards pathsGrid">
        ${PATHS.map(p => {
          const locked = G.mode === 'teen' && !p.teen;
          return `<div class="card glow-card pathCard ${locked ? 'plocked' : ''}" data-path="${p.id}">
            <div class="pathTop"><span class="badge ${locked ? '' : 'on'}">${locked ? '🔒 LOCKED' : p.age}</span></div>
            <h3>${p.title}</h3>
            <p>&ldquo;${p.desc}&rdquo;</p>
            <span class="cardBtn">${locked ? 'Locked in Teen Mode' : 'Begin This Life'}</span>
          </div>`; }).join('')}
      </div>
      ${G.phase !== 'idle' && G.pathId ? `<p class="muted" style="margin-top:18px;text-align:center">
        A timeline is in progress — <a href="#play" style="color:var(--blue)">return to ${G.lifeNum >= 3 ? 'your Final Life' : 'Life ' + G.lifeNum}</a>.</p>` : ''}`;
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
    el.querySelectorAll('[data-path]').forEach(c => c.onclick = () => startPath(c.dataset.path));
  }

  function renderPlay() {
    const el = document.getElementById('playContent'); if (!el) return;

    if (G.phase === 'idle' || !G.pathId) {
      el.innerHTML = `<h2 class="viewTitle">Play</h2>
        <p class="viewSub">No life in progress. Every soul gets three.</p>
        <div class="panel" style="text-align:center">
          <p class="hint" style="margin-bottom:14px">&ldquo;Some lives are won. Some are wasted. Some are almost found.&rdquo;</p>
          <a class="btn btn-primary btn-pulse" href="#paths">Choose a Life Path</a>
        </div>`;
      return;
    }

    const p = path();

    if (G.phase === 'chapter' || G.phase === 'result') {
      const ch = p.chapters[G.chapter];
      const body = G.phase === 'chapter'
        ? `<div class="choiceCol">${ch.choices.map((c, i) =>
            `<button class="btn choiceBtn" data-c="${i}">${esc(c.t)}</button>`).join('')}</div>`
        : `<div class="resultBox">
            <p class="resultLine">${esc(G.lastChoice.r)}</p>
            <div class="deltaRow">${G.lastChoice.deltas.map(([k, d]) => {
              const meta = STATS.find(s => s[0] === k);
              return `<span class="delta ${d > 0 ? 'up' : 'down'}" style="border-color:${meta[2]}55">${d > 0 ? '+' : ''}${d} ${meta[1]}</span>`; }).join('')}</div>
            <button class="btn btn-primary" id="lpNext">${G.chapter + 1 >= p.chapters.length ? 'See How This Life Ends' : 'Continue'}</button>
          </div>`;
      el.innerHTML = `${lifeHeader()}
        ${maybeEchoHint()}
        <div class="chapterCard">
          <div class="chapterNum">Chapter ${G.chapter + 1} of ${p.chapters.length}</div>
          <h3 class="chapterTitle">${esc(ch.title)}</h3>
          <p class="chapterText">${esc(ch.text)}</p>
          ${body}
        </div>
        ${statBars()}`;
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => choose(Number(b.dataset.c)));
      const nx = el.querySelector('#lpNext'); if (nx) nx.onclick = nextChapter;
      wireReset(el);
      return;
    }

    if (G.phase === 'lifeEnd') {
      const R = G.lifeResults[G.lifeResults.length - 1];
      el.innerHTML = `${lifeHeader()}
        <div class="chapterCard endCard">
          <div class="chapterNum">Life ${R.life} complete</div>
          <h3 class="chapterTitle">${esc(R.ending)}</h3>
          <p class="chapterText">Soul status: <strong>${esc(R.status)}</strong><br>
          Defining choice: &ldquo;${esc(R.major ? R.major.text : '—')}&rdquo; <span class="muted">(${esc(R.major ? R.major.chapter : '')})</span></p>
          ${statBars()}
          <div class="echoList">
            <h4>Echo Memories carried forward</h4>
            ${G.echoes.length ? G.echoes.map(e => `<div class="echoItem">✧ “${esc(e)}”</div>`).join('') : '<p class="muted">None yet. Some lives echo louder than others.</p>'}
          </div>
          <button class="btn btn-primary btn-pulse" id="lpNextLife">Start ${G.lifeNum + 1 >= 3 ? 'Your Final Life' : 'Life ' + (G.lifeNum + 1)}</button>
        </div>`;
      el.querySelector('#lpNextLife').onclick = nextLife;
      wireReset(el);
      return;
    }

    if (G.phase === 'finale') {
      const last = G.lifeResults[G.lifeResults.length - 1];
      el.innerHTML = `
        <div class="chapterCard endCard finale">
          <h3 class="chapterTitle">Your Three Lives Have Ended</h3>
          <p class="chapterText">The choices are written. The echoes remain. But somewhere beyond the Veil,
          another timeline is waiting.</p>
          <div class="livesRecap">
            ${G.lifeResults.map(r => `<div class="recapRow"><span class="lifeChip ${r.life >= 3 ? 'final' : ''}">Life ${r.life}</span>
              <strong>${esc(r.ending)}</strong> <span class="muted">· ${esc(r.status)}</span></div>`).join('')}
          </div>
          <p class="chapterText">Final ending: <strong>${esc(last ? last.ending : '')}</strong> ·
          Echo Memories collected: <strong>${G.echoes.length}</strong></p>
          <div class="rowActions" style="justify-content:center">
            <button class="btn btn-primary" id="lpFresh">Start New Timeline Demo</button>
            <a class="btn" href="#paths">Return to Paths</a>
          </div>
        </div>`;
      el.querySelector('#lpFresh').onclick = () => { G.phase = 'fresh'; save(); renderPlay(); };
      return;
    }

    if (G.phase === 'fresh') {
      const adult = G.mode === 'adult';
      el.innerHTML = `
        <div class="chapterCard endCard">
          <h3 class="chapterTitle">Fresh Starts</h3>
          <p class="chapterText">One more life. One more chance. Fresh Starts are not active yet,
          but this is where new timelines will begin.</p>
          ${adult ? `
          <div class="cards" style="margin:18px 0">
            <div class="card freshCard"><h3>One More Life</h3><p>A single extra timeline for this soul.</p>
              <span class="badge">DEMO</span><p class="muted" style="margin-top:8px">Demo only — payments are not active.</p></div>
            <div class="card freshCard"><h3>New Timeline</h3><p>Reset the echoes. Begin unwritten.</p>
              <span class="badge">DEMO</span><p class="muted" style="margin-top:8px">Demo only — payments are not active.</p></div>
            <div class="card freshCard"><h3>Parallel Story</h3><p>Same soul, different world.</p>
              <span class="badge">DEMO</span><p class="muted" style="margin-top:8px">Demo only — payments are not active.</p></div>
          </div>` : `
          <p class="chapterText"><span class="badge">🔒</span> Fresh Starts are locked in Teen Mode.</p>`}
          <div class="rowActions" style="justify-content:center">
            <button class="btn" disabled>Fresh Starts Coming Soon</button>
            <a class="btn" href="#paths">Return to Paths</a>
            <button class="btn btn-tiny btn-danger" id="lpReset">Reset Simulation</button>
          </div>
        </div>`;
      wireReset(el);
      return;
    }
  }

  function wireReset(scope) {
    const b = scope.querySelector('#lpReset');
    if (b) b.onclick = () => { if (confirm('Reset the whole simulation? All three lives and echoes will be cleared.')) reset(); };
  }

  /* ------------------------------------------------ mock dream generator */
  const ARCHETYPES = [
    { keys: ['rock', 'band', 'sing', 'music', 'star', 'famous', 'fame'], goal: 'Rock Star', start: 'You start in a garage band with more hope than money.', obstacle: 'The first record deal asks you to leave someone behind.', risk: 'Fame rises faster than your health can handle.', turn: 'A crash grounds the tour and forces you to choose who you are without the stage.', end: 'Comeback Album or Famous but Empty' },
    { keys: ['island', 'retire', 'beach', 'ocean', 'sail'], goal: 'Island Dreamer', start: 'You trade the noise for a stretch of sand with your name on it.', obstacle: 'Paradise has a price, and it is paid in people you left on the mainland.', risk: 'Solitude turns from a gift into a habit.', turn: 'A storm — and a visitor — arrive in the same week.', end: 'Peaceful Retirement or Island Alone' },
    { keys: ['rich', 'money', 'million', 'billion', 'business', 'startup', 'ceo'], goal: 'Empire Builder', start: 'You begin with one idea and a borrowed laptop.', obstacle: 'The first investor wants the one thing you swore you would keep.', risk: 'Every zero added to the account subtracts an evening from your life.', turn: 'The deal of a lifetime lands on the same day as a phone call you almost ignore.', end: 'Built the Dream or Rich but Alone' },
    { keys: ['love', 'soulmate', 'find', 'romance', 'promise'], goal: 'The Searcher', start: 'You begin with a dream of two lights and a promise you can almost quote.', obstacle: 'The first person who feels right knows all the words — slightly wrong.', risk: 'Every year the signal fades a little more.', turn: 'An old gate, a familiar song, and a message from an unknown number converge.', end: 'Soulmate Found or Missed by Minutes' },
    { keys: ['crash', 'survive', 'accident', 'comeback', 'recover'], goal: 'Crash Survivor', start: 'Everything is going exactly to plan — which is how the best crashes begin.', obstacle: 'Walking away is easy. Deciding who walks away is not.', risk: 'The comeback wants to happen faster than the healing.', turn: 'Grounded and quiet, you finally hear the thing the noise was covering.', end: 'The Second Rise or Lost Everything, Found Yourself' },
  ];

  function buildDream(text) {
    const t = text.toLowerCase();
    const hits = ARCHETYPES.filter(a => a.keys.some(k => t.includes(k)));
    const a = hits[0] || { goal: 'The Dreamer', start: 'You begin with nothing but the dream you just wrote down.', obstacle: 'The first door opens only if you drop something to knock.', risk: 'The dream grows teeth when it starts coming true.', turn: 'One ordinary day rearranges everything the plan assumed.', end: 'The Dream Realized or Safe but Wondering' };
    let goal = a.goal;
    if (hits.length > 1) goal = hits.map(h => h.goal.split(' ')[0]).slice(0, 2).join(' ') + ' Timeline';
    if (hits[0] === ARCHETYPES[0] && t.includes('crash')) goal = 'Rock Star Crash Survivor';
    return { goal, start: a.start, obstacle: a.obstacle, risk: hits[1] ? hits[1].risk : a.risk, turn: a.turn, end: a.end };
  }

  function renderDream() {
    const el = document.getElementById('dreamContent'); if (!el) return;
    el.innerHTML = `
      <div class="panel">
        <div class="formRow">
          <input type="text" id="dreamInput" maxlength="140"
            placeholder="Example: I want to be a rock star who survives a plane crash and makes a comeback album.">
          <button class="btn btn-primary" id="dreamBtn">Build Simulation</button>
        </div>
        <p class="hint" style="margin-top:10px">Local demo generator — nothing you type leaves this page.</p>
      </div>
      <div id="dreamOut"></div>`;
    const go = () => {
      const v = document.getElementById('dreamInput').value.trim();
      if (!v) { toastLP('Describe the life first — one sentence is enough.'); return; }
      const d = buildDream(v);
      document.getElementById('dreamOut').innerHTML = `
        <div class="chapterCard dreamCard">
          <div class="chapterNum">Custom simulation · demo</div>
          <h3 class="chapterTitle">${esc(d.goal)}</h3>
          <div class="dreamGrid">
            <div><h4>Life Goal</h4><p>&ldquo;${esc(d.goal)}&rdquo;</p></div>
            <div><h4>Starting Point</h4><p>${esc(d.start)}</p></div>
            <div><h4>First Obstacle</h4><p>${esc(d.obstacle)}</p></div>
            <div><h4>Major Risk</h4><p>${esc(d.risk)}</p></div>
            <div><h4>Turning Point</h4><p>${esc(d.turn)}</p></div>
            <div><h4>Possible Ending</h4><p>&ldquo;${esc(d.end)}&rdquo;</p></div>
          </div>
          <p class="muted" style="margin-top:14px">Custom dream simulations unlock in a future timeline. For now, choose a
          <a href="#paths" style="color:var(--blue)">Life Path</a> to play.</p>
        </div>`;
    };
    document.getElementById('dreamBtn').onclick = go;
    document.getElementById('dreamInput').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }

  return { renderPaths, renderPlay, renderDream, reset };
})();
