/* Ambient drifting soul-motes behind the whole site. */
(function () {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w, h, motes;

  const COLORS = [
    [77, 166, 255],   // blue
    [255, 102, 204],  // pink
    [217, 192, 122],  // gold
    [200, 215, 255],  // moonlight
  ];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeMote() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -0.04 - Math.random() * 0.14,
      c,
      tw: Math.random() * Math.PI * 2,
      tws: 0.008 + Math.random() * 0.02,
    };
  }

  function init() {
    resize();
    const count = Math.min(70, Math.floor(w * h / 22000));
    motes = Array.from({ length: count }, makeMote);
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy; m.tw += m.tws;
      if (m.y < -10 || m.x < -10 || m.x > w + 10) {
        m.x = Math.random() * w; m.y = h + 8;
      }
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(m.tw));
      const [r, g, b] = m.c;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
      ctx.shadowBlur = 8;
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', init);
  init();
  tick();
})();
