/* Public Soul World -- a symbolic fantasy map with SIMULATED, anonymous soul glows.
   No real locations. No GPS. Positions are decorative fiction. */
window.SoulWorld = (function () {
  'use strict';

  let canvas, ctx, W, H, dpr, raf = null;
  let souls = [], clusters = [], routes = [], stars = [], mapLayer = null;
  let showSelf = false;
  let selfSoul = null;
  let selfColor = 'blue';

  const REGIONS = [
    { name: 'Moonwell Vale', fx: 0.20, fy: 0.31, tint: [77, 166, 255] },
    { name: 'The Ember Coast', fx: 0.75, fy: 0.25, tint: [255, 120, 92] },
    { name: 'Glasslight City', fx: 0.58, fy: 0.62, tint: [99, 229, 204] },
    { name: 'The Quiet Woods', fx: 0.18, fy: 0.73, tint: [95, 190, 150] },
    { name: 'Starfall Reach', fx: 0.86, fy: 0.78, tint: [217, 192, 122] },
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function makeGradient(c, alpha) {
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  }

  function resizeCanvas() {
    const box = canvas.parentElement.getBoundingClientRect();
    W = Math.max(320, Math.floor(box.width));
    H = Math.floor(W * 0.56);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function paintMap() {
    mapLayer = document.createElement('canvas');
    mapLayer.width = Math.floor(W * dpr);
    mapLayer.height = Math.floor(H * dpr);
    const m = mapLayer.getContext('2d');
    m.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sky = m.createLinearGradient(0, 0, W, H);
    sky.addColorStop(0, '#06111d');
    sky.addColorStop(0.42, '#0b0d1f');
    sky.addColorStop(0.76, '#120b19');
    sky.addColorStop(1, '#070708');
    m.fillStyle = sky;
    m.fillRect(0, 0, W, H);

    const moon = m.createRadialGradient(W * 0.51, H * 0.04, 0, W * 0.51, H * 0.04, W * 0.16);
    moon.addColorStop(0, 'rgba(226,235,255,0.24)');
    moon.addColorStop(0.28, 'rgba(138,167,255,0.08)');
    moon.addColorStop(1, 'rgba(138,167,255,0)');
    m.fillStyle = moon;
    m.fillRect(0, 0, W, H * 0.42);

    drawWater(m);
    drawLand(m);
    drawRoutes(m);
    drawLabels(m);
    drawAtmosphere(m);
  }

  function drawWater(m) {
    for (let i = 0; i < 16; i++) {
      const y = H * (0.18 + i * 0.055);
      const g = m.createLinearGradient(0, y - 18, W, y + 18);
      g.addColorStop(0, 'rgba(77,166,255,0)');
      g.addColorStop(0.5, 'rgba(77,166,255,0.035)');
      g.addColorStop(1, 'rgba(77,166,255,0)');
      m.strokeStyle = g;
      m.lineWidth = 1;
      m.beginPath();
      for (let x = -20; x <= W + 20; x += 28) {
        const yy = y + Math.sin(x * 0.018 + i) * 8;
        if (x < 0) m.moveTo(x, yy); else m.lineTo(x, yy);
      }
      m.stroke();
    }
  }

  function drawLand(m) {
    for (const r of REGIONS) {
      const cx = r.fx * W, cy = r.fy * H;
      for (let layer = 0; layer < 4; layer++) {
        m.beginPath();
        const points = 34;
        for (let i = 0; i <= points; i++) {
          const a = i / points * Math.PI * 2;
          const wave = 1 + Math.sin(a * 3 + layer) * 0.12 + Math.cos(a * 5) * 0.08;
          const rx = W * (0.08 + layer * 0.014) * wave;
          const ry = H * (0.115 + layer * 0.018) * wave;
          const x = cx + Math.cos(a) * rx + Math.sin(a * 2) * W * 0.012;
          const y = cy + Math.sin(a) * ry + Math.cos(a * 3) * H * 0.012;
          if (i === 0) m.moveTo(x, y); else m.lineTo(x, y);
        }
        m.closePath();
        const grd = m.createRadialGradient(cx, cy, 0, cx, cy, W * 0.14);
        grd.addColorStop(0, `rgba(${r.tint[0]},${r.tint[1]},${r.tint[2]},${0.11 - layer * 0.015})`);
        grd.addColorStop(0.46, `rgba(28,34,54,${0.46 - layer * 0.05})`);
        grd.addColorStop(1, 'rgba(8,10,18,0)');
        m.fillStyle = grd;
        m.fill();
      }

      const rim = m.createRadialGradient(cx, cy, W * 0.04, cx, cy, W * 0.155);
      rim.addColorStop(0, 'rgba(255,255,255,0)');
      rim.addColorStop(0.55, makeGradient(r.tint, 0.045));
      rim.addColorStop(1, 'rgba(255,255,255,0)');
      m.fillStyle = rim;
      m.beginPath();
      m.arc(cx, cy, W * 0.16, 0, Math.PI * 2);
      m.fill();

      for (let i = 0; i < 5; i++) {
        const x = cx + rand(-W * 0.07, W * 0.07);
        const y = cy + rand(-H * 0.07, H * 0.07);
        const glow = m.createRadialGradient(x, y, 0, x, y, W * rand(0.018, 0.034));
        glow.addColorStop(0, makeGradient(r.tint, 0.14));
        glow.addColorStop(1, makeGradient(r.tint, 0));
        m.fillStyle = glow;
        m.beginPath();
        m.arc(x, y, W * 0.04, 0, Math.PI * 2);
        m.fill();
      }
    }
  }

  function drawRoutes(m) {
    m.save();
    m.globalCompositeOperation = 'screen';
    m.lineWidth = 1.2;
    for (const path of routes) {
      const a = REGIONS[path[0]];
      const b = REGIONS[path[1]];
      const ax = a.fx * W, ay = a.fy * H;
      const bx = b.fx * W, by = b.fy * H;
      const mx = (ax + bx) / 2 + (ay - by) * 0.12;
      const my = (ay + by) / 2 + (bx - ax) * 0.05;
      const g = m.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, makeGradient(a.tint, 0.22));
      g.addColorStop(0.5, 'rgba(217,192,122,0.18)');
      g.addColorStop(1, makeGradient(b.tint, 0.22));
      m.strokeStyle = g;
      m.setLineDash([5, 12]);
      m.beginPath();
      m.moveTo(ax, ay);
      m.quadraticCurveTo(mx, my, bx, by);
      m.stroke();
    }
    m.setLineDash([]);
    m.restore();
  }

  function drawLabels(m) {
    m.font = `italic ${Math.max(12, W * 0.014)}px Georgia, serif`;
    m.textAlign = 'center';
    m.textBaseline = 'middle';
    for (const r of REGIONS) {
      const x = r.fx * W;
      const y = r.fy * H - H * 0.105;
      m.fillStyle = 'rgba(0,0,0,0.35)';
      m.fillText(r.name, x + 1, y + 1);
      m.fillStyle = 'rgba(218,228,255,0.62)';
      m.fillText(r.name, x, y);
    }
  }

  function drawAtmosphere(m) {
    for (let i = 0; i < 34; i++) {
      const x = rand(0, W);
      const y = rand(H * 0.08, H);
      const r = rand(W * 0.035, W * 0.13);
      const fog = m.createRadialGradient(x, y, 0, x, y, r);
      fog.addColorStop(0, 'rgba(185,205,255,0.035)');
      fog.addColorStop(1, 'rgba(185,205,255,0)');
      m.fillStyle = fog;
      m.beginPath();
      m.arc(x, y, r, 0, Math.PI * 2);
      m.fill();
    }

    const vignette = m.createRadialGradient(W * 0.5, H * 0.45, H * 0.28, W * 0.5, H * 0.48, W * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.76, 'rgba(0,0,0,0.16)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
    m.fillStyle = vignette;
    m.fillRect(0, 0, W, H);
  }

  function seedSouls() {
    souls = [];
    clusters = [];
    routes = [[0, 2], [2, 4], [1, 2], [3, 2], [0, 3]];
    stars = Array.from({ length: Math.max(90, Math.floor(W * H / 5200)) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(0.5, 1.8),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.25, 1.1),
    }));

    for (const r of REGIONS) {
      const n = 9 + Math.floor(Math.random() * 11);
      clusters.push({ region: r, count: n + Math.floor(rand(8, 22)), phase: rand(0, Math.PI * 2) });
      for (let i = 0; i < n; i++) {
        const kind = Math.random();
        const tint = kind < 0.42 ? [77, 166, 255] : kind < 0.84 ? [255, 102, 204] : [217, 192, 122];
        souls.push({
          bx: r.fx * W + rand(-W * 0.082, W * 0.082),
          by: r.fy * H + rand(-H * 0.08, H * 0.08),
          ph: rand(0, Math.PI * 2),
          sp: rand(0.16, 0.56),
          amp: rand(5, 18),
          r: rand(1.7, 3.4),
          color: tint,
          trail: [],
        });
      }
    }
    selfSoul = {
      bx: REGIONS[2].fx * W + rand(-W * 0.05, W * 0.05),
      by: REGIONS[2].fy * H + rand(-H * 0.05, H * 0.05),
      ph: rand(0, Math.PI * 2),
      trail: [],
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(mapLayer, 0, 0, W, H);
    drawStars(t);
    drawRoutePulse(t);
    drawSouls(t);
    drawClusters(t);
    drawSelf(t);
    raf = requestAnimationFrame(draw);
  }

  function drawStars(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const s of stars) {
      const a = 0.08 + 0.36 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase));
      ctx.fillStyle = `rgba(220,235,255,${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRoutePulse(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < routes.length; i++) {
      const a = REGIONS[routes[i][0]];
      const b = REGIONS[routes[i][1]];
      const p = (t * 0.00008 + i * 0.21) % 1;
      const ax = a.fx * W, ay = a.fy * H;
      const bx = b.fx * W, by = b.fy * H;
      const cx = (ax + bx) / 2 + (ay - by) * 0.12;
      const cy = (ay + by) / 2 + (bx - ax) * 0.05;
      const x1 = lerp(ax, cx, p);
      const y1 = lerp(ay, cy, p);
      const x2 = lerp(cx, bx, p);
      const y2 = lerp(cy, by, p);
      const x = lerp(x1, x2, p);
      const y = lerp(y1, y2, p);
      glow(x, y, 18, [217, 192, 122], 0.18);
      ctx.fillStyle = 'rgba(255,244,204,0.7)';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSouls(t) {
    const sec = t / 1000;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const so of souls) {
      const x = so.bx + Math.sin(sec * so.sp + so.ph) * so.amp;
      const y = so.by + Math.cos(sec * so.sp * 0.82 + so.ph) * so.amp * 0.62;
      so.trail.push({ x, y, a: 1 });
      if (so.trail.length > 10) so.trail.shift();
      for (let i = 0; i < so.trail.length; i++) {
        const tr = so.trail[i];
        const a = i / so.trail.length * 0.08;
        glow(tr.x, tr.y, so.r * 5, so.color, a);
      }
      const tw = 0.45 + 0.35 * Math.sin(sec * 1.5 + so.ph * 3);
      glow(x, y, so.r * 5.8, so.color, 0.12 + tw * 0.08);
      ctx.fillStyle = makeGradient(so.color, 0.72 + tw * 0.22);
      ctx.beginPath();
      ctx.arc(x, y, so.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawClusters(t) {
    const sec = t / 1000;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(10, W * 0.0105)}px system-ui, sans-serif`;
    for (const c of clusters) {
      const x = c.region.fx * W;
      const y = c.region.fy * H + H * 0.105;
      const pulse = 0.55 + 0.45 * Math.sin(sec * 1.3 + c.phase);
      ctx.strokeStyle = makeGradient(c.region.tint, 0.16 + pulse * 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y - H * 0.105, W * 0.032 + pulse * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(217,192,122,0.62)';
      ctx.fillText(`gathering of souls (${c.count})`, x, y);
    }
    ctx.restore();
  }

  function drawSelf(t) {
    if (!showSelf || !selfSoul) return;
    const sec = t / 1000;
    const x = selfSoul.bx + Math.sin(sec * 0.33 + selfSoul.ph) * 11;
    const y = selfSoul.by + Math.cos(sec * 0.25 + selfSoul.ph) * 8;
    const col = selfColor === 'pink' ? [255, 102, 204] : [77, 166, 255];
    selfSoul.trail.push({ x, y });
    if (selfSoul.trail.length > 18) selfSoul.trail.shift();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < selfSoul.trail.length; i++) {
      const tr = selfSoul.trail[i];
      glow(tr.x, tr.y, 20, col, i / selfSoul.trail.length * 0.12);
    }
    const pulse = 15 + 5 * Math.sin(sec * 2.2);
    ctx.strokeStyle = makeGradient(col, 0.36);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    glow(x, y, 36, col, 0.24);
    ctx.fillStyle = makeGradient(col, 0.98);
    ctx.beginPath();
    ctx.arc(x, y, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.font = `italic ${Math.max(10, W * 0.011)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230,238,255,0.78)';
    ctx.fillText('you - anonymous symbolic glow', x, y - 20);
  }

  function glow(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, makeGradient(color, alpha));
    g.addColorStop(0.5, makeGradient(color, alpha * 0.36));
    g.addColorStop(1, makeGradient(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function start(opts) {
    canvas = document.getElementById('worldCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    showSelf = !!opts.showSelf;
    selfColor = opts.selfColor || 'blue';
    seedSouls();
    paintMap();
    stop();
    raf = requestAnimationFrame(draw);
  }

  function setSelf(v, color) {
    showSelf = !!v;
    if (color) selfColor = color;
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  return { start, stop, setSelf };
})();
