/* Public Soul World — a symbolic fantasy map with SIMULATED, anonymous soul glows.
   No real locations. No GPS. Positions are decorative fiction. */
window.SoulWorld = (function () {
  let canvas, ctx, W, H, raf = null;
  let souls = [], clusters = [], mapLayer = null;
  let showSelf = false;
  let selfSoul = null;
  let selfColor = 'blue';

  const REGIONS = [
    { name: 'Moonwell Vale', fx: 0.22, fy: 0.30 },
    { name: 'The Ember Coast', fx: 0.74, fy: 0.24 },
    { name: 'Glasslight City', fx: 0.58, fy: 0.62 },
    { name: 'The Quiet Woods', fx: 0.18, fy: 0.72 },
    { name: 'Starfall Reach', fx: 0.86, fy: 0.78 },
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function paintMap() {
    // pre-render the terrain once to an offscreen canvas
    mapLayer = document.createElement('canvas');
    mapLayer.width = W; mapLayer.height = H;
    const m = mapLayer.getContext('2d');

    // deep sea
    const sea = m.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#070a18');
    sea.addColorStop(0.5, '#0a0e22');
    sea.addColorStop(1, '#0c0a1e');
    m.fillStyle = sea;
    m.fillRect(0, 0, W, H);

    // landmasses: layered soft blobs around each region
    for (const r of REGIONS) {
      const cx = r.fx * W, cy = r.fy * H;
      for (let i = 0; i < 14; i++) {
        const bx = cx + rand(-W * 0.09, W * 0.09);
        const by = cy + rand(-H * 0.10, H * 0.10);
        const br = rand(W * 0.025, W * 0.075);
        const g = m.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, 'rgba(38, 40, 78, 0.55)');
        g.addColorStop(0.7, 'rgba(28, 30, 62, 0.35)');
        g.addColorStop(1, 'rgba(28, 30, 62, 0)');
        m.fillStyle = g;
        m.beginPath(); m.arc(bx, by, br, 0, Math.PI * 2); m.fill();
      }
      // faint shoreline glow
      const sg = m.createRadialGradient(cx, cy, W * 0.02, cx, cy, W * 0.13);
      sg.addColorStop(0, 'rgba(90, 110, 200, 0.10)');
      sg.addColorStop(1, 'rgba(90, 110, 200, 0)');
      m.fillStyle = sg;
      m.beginPath(); m.arc(cx, cy, W * 0.13, 0, Math.PI * 2); m.fill();
    }

    // moon
    const mx = W * 0.5, my = H * 0.06;
    const moon = m.createRadialGradient(mx, my, 0, mx, my, W * 0.09);
    moon.addColorStop(0, 'rgba(200, 215, 255, 0.20)');
    moon.addColorStop(1, 'rgba(200, 215, 255, 0)');
    m.fillStyle = moon;
    m.fillRect(0, 0, W, H * 0.35);

    // fog wisps
    for (let i = 0; i < 26; i++) {
      const fx = rand(0, W), fy = rand(H * 0.15, H), fr = rand(30, 110);
      const fg = m.createRadialGradient(fx, fy, 0, fx, fy, fr);
      fg.addColorStop(0, 'rgba(70, 85, 160, 0.05)');
      fg.addColorStop(1, 'rgba(70, 85, 160, 0)');
      m.fillStyle = fg;
      m.beginPath(); m.arc(fx, fy, fr, 0, Math.PI * 2); m.fill();
    }

    // region names
    m.font = `italic ${Math.max(11, W * 0.013)}px Georgia, serif`;
    m.textAlign = 'center';
    m.fillStyle = 'rgba(160, 175, 220, 0.5)';
    for (const r of REGIONS) m.fillText(r.name, r.fx * W, r.fy * H - H * 0.085);
  }

  function seedSouls() {
    souls = [];
    clusters = [];
    for (const r of REGIONS) {
      const n = 6 + Math.floor(Math.random() * 9);
      clusters.push({ region: r, count: n + Math.floor(rand(4, 18)) });
      for (let i = 0; i < n; i++) {
        const kind = Math.random();
        souls.push({
          bx: r.fx * W + rand(-W * 0.08, W * 0.08),
          by: r.fy * H + rand(-H * 0.08, H * 0.08),
          ox: 0, oy: 0,
          ph: rand(0, Math.PI * 2),
          sp: rand(0.15, 0.5),
          amp: rand(4, 16),
          r: rand(1.6, 3.2),
          color: kind < 0.42 ? '77,166,255' : kind < 0.84 ? '255,102,204' : '217,192,122',
        });
      }
    }
    selfSoul = {
      bx: REGIONS[2].fx * W + rand(-W * 0.05, W * 0.05),
      by: REGIONS[2].fy * H + rand(-H * 0.05, H * 0.05),
      ph: rand(0, Math.PI * 2),
    };
  }

  function draw(t) {
    ctx.drawImage(mapLayer, 0, 0);
    const s = t / 1000;

    for (const so of souls) {
      const x = so.bx + Math.sin(s * so.sp + so.ph) * so.amp;
      const y = so.by + Math.cos(s * so.sp * 0.8 + so.ph) * so.amp * 0.6;
      const tw = 0.45 + 0.4 * Math.sin(s * 1.4 + so.ph * 3);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${so.color},${tw})`;
      ctx.shadowColor = `rgba(${so.color},0.9)`;
      ctx.shadowBlur = 10;
      ctx.arc(x, y, so.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // gathering labels
    ctx.font = `${Math.max(10, W * 0.010)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(217,192,122,0.55)';
    for (const c of clusters) {
      ctx.fillText(`✦ a gathering of souls (${c.count})`, c.region.fx * W, c.region.fy * H + H * 0.10);
    }

    // your own anonymous glow — only in Public Glow mode
    if (showSelf && selfSoul) {
      const x = selfSoul.bx + Math.sin(s * 0.3 + selfSoul.ph) * 10;
      const y = selfSoul.by + Math.cos(s * 0.24 + selfSoul.ph) * 7;
      const pulse = 6 + 2.4 * Math.sin(s * 2);
      const col = selfColor === 'pink' ? '255,102,204' : '77,166,255';
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${col},0.5)`;
      ctx.lineWidth = 1.5;
      ctx.arc(x, y, pulse + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `rgba(${col},0.95)`;
      ctx.shadowColor = `rgba(${col},1)`;
      ctx.shadowBlur = 16;
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = `italic ${Math.max(10, W * 0.011)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(230,238,255,0.75)';
      ctx.fillText('you — anonymous glow (symbolic place, not your location)', x, y - 16);
    }

    raf = requestAnimationFrame(draw);
  }

  function start(opts) {
    canvas = document.getElementById('worldCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    const box = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = Math.max(320, Math.floor(box.width));
    H = canvas.height = Math.floor(W * 0.56);
    canvas.style.height = H + 'px';
    showSelf = !!opts.showSelf;
    selfColor = opts.selfColor || 'blue';
    paintMap();
    seedSouls();
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
