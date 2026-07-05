/* SOULMATE: Gateway Run -- real-time playable vertical slice.
   Local-only canvas game: no accounts, no location, no network calls. */
window.SoulRun = (function () {
  'use strict';

  const KEY = 'soulmate_gateway_run_v1';
  const BG = new Image();
  BG.src = 'assets/soulmate-cosmic-background.png';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  let root = null;
  let canvas = null;
  let ctx = null;
  let raf = null;
  let resizeObserver = null;
  let last = 0;
  let W = 960;
  let H = 540;
  let dpr = 1;

  let state = null;
  let keys = Object.create(null);
  let pointer = { active: false, x: 0, y: 0 };
  let boostHeld = false;

  const COLOR = {
    blue: [77, 166, 255],
    pink: [255, 102, 204],
    gold: [217, 192, 122],
    teal: [99, 229, 204],
    ember: [255, 120, 92],
  };

  function bestScore() {
    try { return Number(localStorage.getItem(KEY) || 0); } catch (e) { return 0; }
  }

  function saveBest(score) {
    try {
      if (score > bestScore()) localStorage.setItem(KEY, String(score));
    } catch (e) { /* localStorage unavailable */ }
  }

  function fresh() {
    const px = W * 0.22;
    const py = H * 0.52;
    return {
      mode: 'ready',
      score: 0,
      best: bestScore(),
      time: 0,
      shards: 0,
      targetShards: 8,
      integrity: 100,
      resonance: 0,
      boost: 78,
      combo: 1,
      comboClock: 0,
      invuln: 0,
      shake: 0,
      slowMo: 0,
      objective: 'collect',
      player: { x: px, y: py, vx: 0, vy: 0, r: 18, phase: 0 },
      partner: { x: W * 0.14, y: H * 0.36, vx: 0, vy: 0, phase: rand(0, 6.28), r: 14 },
      portal: { x: W * 0.84, y: H * 0.42, open: false, phase: 0 },
      shardsField: [],
      hazards: [],
      sparks: [],
      trails: [],
      stars: [],
      beams: [],
    };
  }

  function seedScene() {
    state.shardsField.length = 0;
    state.hazards.length = 0;
    state.sparks.length = 0;
    state.trails.length = 0;
    state.stars = Array.from({ length: Math.max(80, Math.floor(W * H / 5600)) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: rand(0.18, 1),
      tw: rand(0, 6.28),
    }));
    state.beams = Array.from({ length: 8 }, () => ({
      x: rand(-W * 0.2, W * 1.1),
      y: rand(-H * 0.1, H * 0.9),
      len: rand(W * 0.18, W * 0.42),
      a: rand(-0.6, 0.4),
      c: Math.random() > 0.5 ? COLOR.teal : COLOR.gold,
      alpha: rand(0.025, 0.07),
      drift: rand(2, 8),
    }));
    for (let i = 0; i < 12; i++) spawnShard(true);
    for (let i = 0; i < 7; i++) spawnHazard(true);
  }

  function spawnShard(anywhere) {
    const palette = Math.random() < 0.55 ? 'gold' : Math.random() < 0.5 ? 'blue' : 'pink';
    state.shardsField.push({
      x: anywhere ? rand(W * 0.18, W * 0.9) : W + rand(50, W * 0.2),
      y: rand(H * 0.18, H * 0.82),
      vx: rand(-18, -5),
      vy: rand(-8, 8),
      r: rand(10, 15),
      phase: rand(0, 6.28),
      spin: rand(-1.2, 1.2),
      color: COLOR[palette],
      value: palette === 'gold' ? 160 : 110,
    });
  }

  function spawnHazard(anywhere) {
    const large = Math.random() > 0.72;
    state.hazards.push({
      x: anywhere ? rand(W * 0.35, W * 0.96) : W + rand(40, 220),
      y: rand(H * 0.14, H * 0.86),
      vx: large ? rand(-38, -24) : rand(-62, -32),
      vy: rand(-16, 16),
      r: large ? rand(24, 34) : rand(17, 25),
      spin: rand(-1.8, 1.8),
      phase: rand(0, 6.28),
      hit: 0,
    });
  }

  function mount(el) {
    stop();
    root = el;
    root.innerHTML = `
      <div class="playIntro">
        <div>
          <div class="kicker">Gateway Run</div>
          <h2 class="viewTitle">Find the Signal</h2>
          <p class="viewSub">A fast playable slice: collect memory shards, keep the Veil off your soul, and hit the open signal before it collapses.</p>
        </div>
        <div class="playIntroActions">
          <button class="btn btn-primary btn-pulse" id="srStartTop">Start Run</button>
          <a class="btn" href="#paths">Life Paths</a>
        </div>
      </div>

      <div class="arcadeShell">
        <div class="arcadeStage">
          <canvas id="soulRunCanvas" aria-label="Gateway Run playable canvas"></canvas>
          <div class="arcadeHud" aria-hidden="true">
            <div class="hudStat"><span>Memory</span><strong id="srScore">0</strong></div>
            <div class="hudStat"><span>Shards</span><strong id="srShards">0/8</strong></div>
            <div class="hudStat"><span>Best</span><strong id="srBest">0</strong></div>
          </div>
          <div class="arcadeMeters" aria-hidden="true">
            <label><span>Veil</span><i><b id="srIntegrity"></b></i></label>
            <label><span>Boost</span><i><b id="srBoost"></b></i></label>
            <label><span>Signal</span><i><b id="srResonance"></b></i></label>
          </div>
          <button class="boostPad" id="srBoostPad" aria-label="Boost">BOOST</button>
          <div class="arcadeOverlay" id="srOverlay">
            <div class="overlayPanel">
              <div class="kicker">Cinematic Arcade Mode</div>
              <h3>Gateway Run</h3>
              <p>Collect 8 shards. Protect your Veil. Reach the open signal.</p>
              <button class="btn btn-primary btn-pulse" id="srStart">Start Run</button>
            </div>
          </div>
        </div>
        <div class="arcadeDeck">
          <div class="objectiveStrip">
            <span class="signalLight"></span>
            <strong id="srObjective">Signal dormant</strong>
            <span id="srObjectiveText">Memory shards are scattering through the Rift.</span>
          </div>
          <div class="arcadeActions">
            <button class="btn btn-tiny" id="srRestart">Restart</button>
            <a class="btn btn-tiny" href="#world">World Map</a>
          </div>
        </div>
      </div>`;

    canvas = document.getElementById('soulRunCanvas');
    ctx = canvas.getContext('2d');
    state = fresh();
    wire();
    resize();
    seedScene();
    updateHud();
    draw(0);
    raf = requestAnimationFrame(loop);
  }

  function wire() {
    document.getElementById('srStart').onclick = startRun;
    document.getElementById('srStartTop').onclick = startRun;
    document.getElementById('srRestart').onclick = () => {
      state = fresh();
      resize();
      seedScene();
      startRun();
    };

    const pad = document.getElementById('srBoostPad');
    const hold = (v) => {
      boostHeld = v;
      pad.classList.toggle('held', v);
    };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); hold(true); });
    pad.addEventListener('pointerup', () => hold(false));
    pad.addEventListener('pointercancel', () => hold(false));
    pad.addEventListener('pointerleave', () => hold(false));

    canvas.addEventListener('pointerdown', point);
    canvas.addEventListener('pointermove', point);
    canvas.addEventListener('pointerup', () => { pointer.active = false; });
    canvas.addEventListener('pointercancel', () => { pointer.active = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);
  }

  function keyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Shift') boostHeld = true;
      if (state && state.mode === 'ready') startRun();
      e.preventDefault();
    }
  }

  function keyUp(e) {
    keys[e.key.toLowerCase()] = false;
    if (e.key === ' ' || e.key === 'Shift') boostHeld = false;
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    pointer.active = e.buttons > 0 || e.type === 'pointerdown';
    pointer.x = (e.clientX - r.left) * (W / r.width);
    pointer.y = (e.clientY - r.top) * (H / r.height);
    if (state && state.mode === 'ready') startRun();
  }

  function resize() {
    if (!canvas) return;
    const box = canvas.parentElement.getBoundingClientRect();
    const oldW = W;
    const oldH = H;
    W = Math.max(320, Math.floor(box.width));
    H = Math.max(280, Math.floor(box.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state && oldW && oldH) {
      const sx = W / oldW;
      const sy = H / oldH;
      scaleObj(state.player, sx, sy);
      scaleObj(state.partner, sx, sy);
      scaleObj(state.portal, sx, sy);
      state.shardsField.forEach(o => scaleObj(o, sx, sy));
      state.hazards.forEach(o => scaleObj(o, sx, sy));
      state.sparks.forEach(o => scaleObj(o, sx, sy));
      state.trails.forEach(o => scaleObj(o, sx, sy));
    }
  }

  function scaleObj(o, sx, sy) {
    o.x *= sx;
    o.y *= sy;
  }

  function startRun() {
    if (!state || state.mode === 'running') return;
    state.mode = 'running';
    state.score = 0;
    state.time = 0;
    state.shards = 0;
    state.integrity = 100;
    state.resonance = 0;
    state.boost = 78;
    state.combo = 1;
    state.comboClock = 0;
    state.objective = 'collect';
    state.portal.open = false;
    state.player.x = W * 0.22;
    state.player.y = H * 0.52;
    state.player.vx = 0;
    state.player.vy = 0;
    seedScene();
    showOverlay(false);
    updateHud();
  }

  function loop(t) {
    const dt = Math.min(0.033, (t - last || 16) / 1000);
    last = t;
    update(dt);
    draw(t / 1000);
    raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    if (!state) return;
    if (state.mode !== 'running') {
      state.time += dt * 0.35;
      driftAttract(dt);
      return;
    }

    state.time += dt;
    state.invuln = Math.max(0, state.invuln - dt);
    state.shake = Math.max(0, state.shake - dt * 18);
    state.comboClock -= dt;
    if (state.comboClock <= 0) state.combo = Math.max(1, state.combo - dt * 1.5);

    updatePlayer(dt);
    updatePartner(dt);
    updateFields(dt);
    updateSparks(dt);
    updateObjective();
    updateHud();
  }

  function driftAttract(dt) {
    const p = state.player;
    p.x += Math.sin(state.time * 1.2) * dt * 16;
    p.y += Math.cos(state.time * 0.9) * dt * 10;
    updateFields(dt * 0.5);
    updateSparks(dt);
  }

  function updatePlayer(dt) {
    const p = state.player;
    let ax = 0;
    let ay = 0;
    if (keys.arrowleft || keys.a) ax -= 1;
    if (keys.arrowright || keys.d) ax += 1;
    if (keys.arrowup || keys.w) ay -= 1;
    if (keys.arrowdown || keys.s) ay += 1;
    if (pointer.active) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const m = Math.hypot(dx, dy);
      if (m > 8) {
        ax += dx / m;
        ay += dy / m;
      }
    }
    const mag = Math.hypot(ax, ay) || 1;
    ax /= mag;
    ay /= mag;

    const boosting = boostHeld && state.boost > 4 && (Math.abs(ax) + Math.abs(ay) > 0.05);
    const accel = boosting ? 1150 : 680;
    const maxSpeed = boosting ? 430 : 265;
    if (boosting) {
      state.boost = Math.max(0, state.boost - dt * 34);
      state.resonance = Math.min(100, state.resonance + dt * 2.3);
      addTrail(p.x, p.y, COLOR.blue, 0.46, p.r * 1.2);
    } else {
      state.boost = Math.min(100, state.boost + dt * 11);
    }

    p.vx += ax * accel * dt;
    p.vy += ay * accel * dt;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxSpeed) {
      p.vx = p.vx / sp * maxSpeed;
      p.vy = p.vy / sp * maxSpeed;
    }
    p.vx *= Math.pow(0.08, dt);
    p.vy *= Math.pow(0.08, dt);
    p.x = clamp(p.x + p.vx * dt, p.r + 10, W - p.r - 10);
    p.y = clamp(p.y + p.vy * dt, p.r + 10, H - p.r - 10);

    if (Math.random() < 0.85) addTrail(p.x - p.vx * 0.02, p.y - p.vy * 0.02, COLOR.blue, 0.32, p.r);
  }

  function updatePartner(dt) {
    const p = state.player;
    const e = state.partner;
    e.phase += dt;
    const target = {
      x: p.x - 86 + Math.sin(e.phase * 1.7) * 34,
      y: p.y - 42 + Math.cos(e.phase * 1.3) * 44,
    };
    e.vx += (target.x - e.x) * dt * 5.5;
    e.vy += (target.y - e.y) * dt * 5.5;
    e.vx *= Math.pow(0.05, dt);
    e.vy *= Math.pow(0.05, dt);
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (dist(p, e) < 138) state.resonance = Math.min(100, state.resonance + dt * 2.8);
    if (Math.random() < 0.5) addTrail(e.x, e.y, COLOR.pink, 0.24, e.r);
  }

  function updateFields(dt) {
    for (const s of state.shardsField) {
      s.phase += dt * 2.4;
      s.x += s.vx * dt;
      s.y += Math.sin(s.phase) * dt * 10 + s.vy * dt;
      if (s.x < -40) {
        s.x = W + rand(30, 180);
        s.y = rand(H * 0.16, H * 0.84);
      }
      if (state.mode === 'running' && dist(s, state.player) < s.r + state.player.r + 5) collectShard(s);
    }

    for (const h of state.hazards) {
      h.phase += dt;
      h.hit = Math.max(0, h.hit - dt);
      h.x += h.vx * dt;
      h.y += (h.vy + Math.sin(h.phase * 1.8) * 16) * dt;
      if (h.x < -80 || h.y < -70 || h.y > H + 70) resetHazard(h);
      if (state.mode === 'running' && state.invuln <= 0 && dist(h, state.player) < h.r + state.player.r - 2) hitHazard(h);
    }

    if (state.portal.open) {
      state.portal.phase += dt;
      const d = Math.hypot(state.player.x - state.portal.x, state.player.y - state.portal.y);
      if (d < 52) finishRun();
    }
  }

  function collectShard(s) {
    const gain = Math.round(s.value * clamp(state.combo, 1, 8));
    state.score += gain;
    state.shards += 1;
    state.combo = Math.min(8, state.combo + 0.55);
    state.comboClock = 2.8;
    state.resonance = Math.min(100, state.resonance + 13);
    state.boost = Math.min(100, state.boost + 9);
    burst(s.x, s.y, s.color, 18, 180);
    s.x = W + rand(60, 260);
    s.y = rand(H * 0.16, H * 0.84);
  }

  function hitHazard(h) {
    state.integrity = Math.max(0, state.integrity - 14);
    state.resonance = Math.max(0, state.resonance - 8);
    state.combo = 1;
    state.comboClock = 0;
    state.invuln = 0.9;
    state.shake = 14;
    h.hit = 0.45;
    const dx = state.player.x - h.x;
    const dy = state.player.y - h.y;
    const m = Math.hypot(dx, dy) || 1;
    state.player.vx += dx / m * 260;
    state.player.vy += dy / m * 260;
    burst(state.player.x, state.player.y, COLOR.ember, 24, 230);
    if (state.integrity <= 0) failRun();
  }

  function resetHazard(h) {
    h.x = W + rand(50, 280);
    h.y = rand(H * 0.14, H * 0.86);
    h.vx = rand(-72, -32);
    h.vy = rand(-18, 18);
    h.r = rand(17, 33);
  }

  function updateObjective() {
    const ready = state.shards >= state.targetShards || state.resonance >= 100;
    if (ready && !state.portal.open) {
      state.portal.open = true;
      state.objective = 'portal';
      state.shake = 8;
      burst(state.portal.x, state.portal.y, COLOR.teal, 36, 260);
    }
  }

  function finishRun() {
    state.mode = 'won';
    state.score += Math.round(state.integrity * 45 + state.boost * 18 + state.resonance * 30);
    saveBest(state.score);
    state.best = bestScore();
    burst(state.portal.x, state.portal.y, COLOR.gold, 70, 360);
    showOverlay(true, 'Signal Reached', 'The two glows lock together. The Gateway remembers your promise.', 'Run Again');
    updateHud();
  }

  function failRun() {
    state.mode = 'lost';
    saveBest(state.score);
    state.best = bestScore();
    showOverlay(true, 'The Veil Closed', 'The signal scattered, but the memory trail remains warm.', 'Try Again');
    updateHud();
  }

  function showOverlay(visible, title, copy, button) {
    const overlay = document.getElementById('srOverlay');
    if (!overlay) return;
    overlay.classList.toggle('hidden', !visible);
    if (visible && title) {
      overlay.querySelector('h3').textContent = title;
      overlay.querySelector('p').textContent = copy;
      overlay.querySelector('#srStart').textContent = button;
    }
  }

  function addTrail(x, y, c, alpha, size) {
    state.trails.push({
      x, y,
      r: size * rand(0.55, 1.1),
      c,
      a: alpha,
      life: rand(0.28, 0.55),
      max: 0.55,
    });
    if (state.trails.length > 90) state.trails.splice(0, state.trails.length - 90);
  }

  function burst(x, y, c, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(speed * 0.18, speed);
      state.sparks.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        r: rand(1.5, 4.5),
        c,
        life: rand(0.45, 0.95),
        max: 0.95,
      });
    }
  }

  function updateSparks(dt) {
    for (const p of state.sparks) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.05, dt);
      p.vy *= Math.pow(0.05, dt);
    }
    for (const p of state.trails) p.life -= dt;
    state.sparks = state.sparks.filter(p => p.life > 0);
    state.trails = state.trails.filter(p => p.life > 0);
  }

  function updateHud() {
    if (!state) return;
    text('srScore', Math.max(0, Math.round(state.score)).toLocaleString());
    text('srBest', state.best.toLocaleString());
    text('srShards', `${Math.min(state.shards, state.targetShards)}/${state.targetShards}`);
    width('srIntegrity', state.integrity);
    width('srBoost', state.boost);
    width('srResonance', state.resonance);
    text('srObjective', state.portal.open ? 'Signal open' : 'Signal dormant');
    text('srObjectiveText', state.portal.open ? 'The Rift is folding. Reach the signal now.' : 'Memory shards are scattering through the Rift.');
  }

  function text(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function width(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = clamp(value, 0, 100) + '%';
  }

  function draw(t) {
    if (!ctx || !state) return;
    const sx = state.shake ? rand(-state.shake, state.shake) : 0;
    const sy = state.shake ? rand(-state.shake, state.shake) : 0;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.translate(sx, sy);
    drawBackground(t);
    drawBeams(t);
    drawPortal(t);
    drawFields(t);
    drawTether();
    drawSoul(state.partner, COLOR.pink, t, 0.78);
    drawSoul(state.player, COLOR.blue, t, state.invuln > 0 ? 0.55 + Math.sin(t * 30) * 0.25 : 1);
    drawSparks();
    drawVignette();
    ctx.restore();
  }

  function drawBackground(t) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#07131f');
    g.addColorStop(0.48, '#140d24');
    g.addColorStop(1, '#090707');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (BG.complete && BG.naturalWidth) {
      const scale = Math.max(W / BG.naturalWidth, H / BG.naturalHeight);
      const iw = BG.naturalWidth * scale;
      const ih = BG.naturalHeight * scale;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(BG, (W - iw) / 2, (H - ih) / 2, iw, ih);
      ctx.restore();
    }

    for (const s of state.stars) {
      const x = (s.x - t * 18 * s.z + W * 4) % W;
      const tw = 0.2 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + s.tw));
      ctx.fillStyle = `rgba(220,235,255,${tw * s.z})`;
      ctx.fillRect(x, s.y, 1.2 + s.z * 1.6, 1.2 + s.z * 1.6);
    }

    const floor = ctx.createLinearGradient(0, H * 0.55, 0, H);
    floor.addColorStop(0, 'rgba(5, 7, 12, 0)');
    floor.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);
  }

  function drawBeams(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const b of state.beams) {
      const [r, g, bl] = b.c;
      ctx.save();
      ctx.translate((b.x - t * b.drift + W * 2) % (W * 1.25) - W * 0.12, b.y);
      ctx.rotate(b.a);
      const grd = ctx.createLinearGradient(-b.len, 0, b.len, 0);
      grd.addColorStop(0, `rgba(${r},${g},${bl},0)`);
      grd.addColorStop(0.5, `rgba(${r},${g},${bl},${b.alpha})`);
      grd.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(-b.len, -24, b.len * 2, 48);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPortal(t) {
    if (!state.portal.open && state.resonance < 55) return;
    const p = state.portal;
    const charge = state.portal.open ? 1 : state.resonance / 100;
    const radius = 34 + 20 * charge + Math.sin(t * 5) * 3;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(99,229,204,${0.12 + charge * 0.12})`;
      ctx.lineWidth = 2 + i;
      ctx.setLineDash([12 + i * 4, 10]);
      ctx.lineDashOffset = -t * (30 + i * 18);
      ctx.arc(p.x, p.y, radius + i * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 1.7);
    g.addColorStop(0, `rgba(207,255,239,${0.2 + charge * 0.28})`);
    g.addColorStop(0.45, `rgba(99,229,204,${0.12 + charge * 0.18})`);
    g.addColorStop(1, 'rgba(99,229,204,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFields(t) {
    for (const tr of state.trails) drawGlow(tr.x, tr.y, tr.r, tr.c, tr.a * (tr.life / tr.max));

    for (const h of state.hazards) drawHazard(h, t);
    for (const s of state.shardsField) drawShard(s, t);
  }

  function drawShard(s, t) {
    const [r, g, b] = s.color;
    const y = s.y + Math.sin(t * 3 + s.phase) * 4;
    const rot = t * s.spin + s.phase;
    ctx.save();
    ctx.translate(s.x, y);
    ctx.rotate(rot);
    ctx.globalCompositeOperation = 'screen';
    drawGlow(0, 0, s.r * 3.2, s.color, 0.13);
    const grd = ctx.createLinearGradient(-s.r, -s.r, s.r, s.r);
    grd.addColorStop(0, `rgba(255,255,255,0.95)`);
    grd.addColorStop(0.28, `rgba(${r},${g},${b},0.9)`);
    grd.addColorStop(1, `rgba(${Math.max(0, r - 90)},${Math.max(0, g - 90)},${Math.max(0, b - 90)},0.7)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, -s.r);
    ctx.lineTo(s.r * 0.72, 0);
    ctx.lineTo(0, s.r * 1.25);
    ctx.lineTo(-s.r * 0.72, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,0.35)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawHazard(h, t) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(t * h.spin);
    ctx.globalCompositeOperation = 'source-over';
    const alpha = h.hit > 0 ? 0.95 : 0.72;
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, h.r * 2.2);
    g.addColorStop(0, `rgba(255,120,92,${0.18 * alpha})`);
    g.addColorStop(0.45, `rgba(70,15,35,${0.32 * alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, h.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255,120,92,${0.32 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const rr = h.r * (0.65 + (i % 3) * 0.22);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = `rgba(8,5,10,${0.72 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, h.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTether() {
    const d = dist(state.player, state.partner);
    if (d > 190) return;
    const a = clamp(1 - d / 190, 0, 1);
    const g = ctx.createLinearGradient(state.player.x, state.player.y, state.partner.x, state.partner.y);
    g.addColorStop(0, `rgba(77,166,255,${0.2 * a})`);
    g.addColorStop(0.5, `rgba(217,192,122,${0.28 * a})`);
    g.addColorStop(1, `rgba(255,102,204,${0.2 * a})`);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + a * 2.5;
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y);
    ctx.quadraticCurveTo(
      (state.player.x + state.partner.x) / 2,
      (state.player.y + state.partner.y) / 2 - 38,
      state.partner.x,
      state.partner.y,
    );
    ctx.stroke();
    ctx.restore();
  }

  function drawSoul(s, c, t, alpha) {
    const [r, g, b] = c;
    const pulse = 1 + Math.sin(t * 4 + s.phase) * 0.06;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'screen';
    drawGlow(s.x, s.y, s.r * 4.8 * pulse, c, 0.24);
    drawGlow(s.x, s.y, s.r * 2.2 * pulse, c, 0.38);
    const core = ctx.createRadialGradient(s.x - s.r * 0.32, s.y - s.r * 0.36, 0, s.x, s.y, s.r * 1.25);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.34, `rgba(${r},${g},${b},0.98)`);
    core.addColorStop(1, `rgba(${r},${g},${b},0.05)`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,0.36)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * (1.22 + Math.sin(t * 5) * 0.06), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGlow(x, y, r, c, a) {
    const [rr, gg, bb] = c;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rr},${gg},${bb},${a})`);
    g.addColorStop(0.42, `rgba(${rr},${gg},${bb},${a * 0.45})`);
    g.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSparks() {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const p of state.sparks) {
      const a = clamp(p.life / p.max, 0, 1);
      drawGlow(p.x, p.y, p.r * 4, p.c, 0.18 * a);
      const [r, g, b] = p.c;
      ctx.fillStyle = `rgba(${r},${g},${b},${0.9 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W * 0.52, H * 0.45, H * 0.22, W * 0.52, H * 0.5, W * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.74, 'rgba(0,0,0,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0.68)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    canvas = null;
    ctx = null;
    root = null;
    state = null;
    keys = Object.create(null);
    pointer = { active: false, x: 0, y: 0 };
    boostHeld = false;
  }

  return { mount, stop };
})();
