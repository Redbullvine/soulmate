/* SOULMATE platform — MVP. All presence is simulated; state lives in localStorage.
   No GPS, no real locations, everything opt-in, default Invisible. */
(function () {
  'use strict';

  // ---------------- state ----------------
  const KEY = 'soulmate_state_v1';
  const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  const DEFAULTS = {
    soul: null,                    // 'blue' | 'pink'
    myCode: null,                  // code I created
    bond: null,                    // { code, mySoul, partnerSoul, at }
    soloStarted: false,
    groups: [],                    // { id, name, type, code, members, mine }
    visibility: {
      mode: 'invisible',           // invisible | soulmate | groups | nearby | public | temp
      groupsOn: {},                // groupId -> bool
      tempUntil: null,             // timestamp | 'manual'
      prevMode: 'invisible',
    },
    pauseAlerts: false,
    hidePublic: false,
  };

  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(structuredClone(DEFAULTS), JSON.parse(raw));
    } catch (e) { /* fresh start */ }
    return structuredClone(DEFAULTS);
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

  function makeCode(len = 6) {
    let c = '';
    for (let i = 0; i < len; i++) c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    return c;
  }
  function validCode(c) { return /^[A-Z2-9]{6}$/.test(c); }

  // ---------------- toasts ----------------
  const toasts = document.getElementById('toasts');
  function toast(msg, ms = 4200) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(() => el.classList.add('gone'), ms - 600);
    setTimeout(() => el.remove(), ms);
  }

  // ---------------- visibility model ----------------
  const MODES = {
    invisible: { label: 'Invisible Mode', icon: '🌑', desc: 'The cloak at full strength. No soul can see you — anywhere. This is the default.' },
    soulmate:  { label: 'Partner Only', icon: '💞', desc: 'Only the soul bound to your Code could ever sense your glow.' },
    groups:    { label: 'Circle Only', icon: '✨', desc: 'Choose exactly which of your circles may sense you.' },
    nearby:    { label: 'Echo Sense', icon: '🌙', desc: 'Familiar souls may feel an echo when you pass near. Never where — only near.' },
    public:    { label: 'Public Glow', icon: '🌟', desc: 'Appear in the World of Echoes as one anonymous glow among many.' },
    temp:      { label: 'Timed Glow', icon: '⏳', desc: 'Lower the cloak for a set time. When it ends, the cloak returns on its own.' },
  };

  function modeLabel() {
    const m = MODES[S.visibility.mode];
    let extra = '';
    if (S.visibility.mode === 'temp' && S.visibility.tempUntil && S.visibility.tempUntil !== 'manual') {
      extra = ' · ' + remainingText();
    }
    return `${m.icon} ${m.label}${extra}`;
  }
  function remainingText() {
    const ms = S.visibility.tempUntil - Date.now();
    if (ms <= 0) return 'ending…';
    const mm = Math.floor(ms / 60000), hh = Math.floor(mm / 60);
    return hh > 0 ? `${hh}h ${mm % 60}m left` : `${mm + 1}m left`;
  }

  function isPubliclyVisible() {
    return S.visibility.mode === 'public' && !S.hidePublic;
  }

  function setMode(mode) {
    if (mode !== 'temp') S.visibility.tempUntil = null;
    if (mode === 'temp' && !S.visibility.tempUntil) S.visibility.tempUntil = 'manual';
    S.visibility.prevMode = S.visibility.mode;
    S.visibility.mode = mode;
    save();
    renderStatus();
    if (current === 'privacy') renderPrivacy();
    if (current === 'world') syncWorldSelf();
    toast(`${MODES[mode].icon} Visibility set to ${MODES[mode].label}`);
  }

  // temp share expiry watcher
  setInterval(() => {
    const v = S.visibility;
    if (v.mode === 'temp' && v.tempUntil && v.tempUntil !== 'manual' && Date.now() > v.tempUntil) {
      v.mode = 'invisible';
      v.tempUntil = null;
      save();
      renderStatus();
      if (current === 'privacy') renderPrivacy();
      if (current === 'world') syncWorldSelf();
      toast('🌑 Your live share ended. You are Invisible again.');
    } else if (v.mode === 'temp') {
      renderStatus();
    }
  }, 20000);

  // ---------------- status chip ----------------
  const chip = document.getElementById('statusChip');
  function renderStatus() { chip.textContent = modeLabel(); }
  chip.addEventListener('click', () => { location.hash = '#privacy'; });

  // ---------------- router ----------------
  const VIEWS = ['home', 'solo', 'couple', 'groups', 'world', 'privacy', 'paths', 'play', 'dream'];
  let current = 'home';

  function route() {
    let v = (location.hash || '#home').slice(1);
    if (!VIEWS.includes(v)) v = 'home';
    current = v;
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    document.querySelectorAll('[data-nav]').forEach(a =>
      a.classList.toggle('active', a.dataset.nav === v));
    window.scrollTo(0, 0);

    if (v === 'solo') renderSolo();
    if (v === 'couple') renderCouple();
    if (v === 'groups') renderGroups();
    if (v === 'privacy') renderPrivacy();
    if (v === 'paths') LifePaths.renderPaths();
    if (v === 'play') {
      if (LifePaths.hasActiveTimeline && LifePaths.hasActiveTimeline()) {
        if (window.SoulRun) SoulRun.stop();
        LifePaths.renderPlay();
      } else if (window.SoulRun) {
        SoulRun.mount(document.getElementById('playContent'));
      } else {
        LifePaths.renderPlay();
      }
    } else if (window.SoulRun) {
      SoulRun.stop();
    }
    if (v === 'dream') LifePaths.renderDream();
    if (v === 'world') renderWorld(); else SoulWorld.stop();

    const video = document.getElementById('introVideo');
    if (video) { if (v === 'home') video.play().catch(() => {}); else video.pause(); }
  }
  window.addEventListener('hashchange', route);

  // ---------------- home ----------------
  document.getElementById('enterBtn').addEventListener('click', () => { location.hash = '#solo'; });
  document.getElementById('createSoulBtn').addEventListener('click', () => { location.hash = '#couple'; });
  document.getElementById('soundBtn').addEventListener('click', () => {
    const v = document.getElementById('introVideo');
    v.muted = false; v.currentTime = 0; v.play();
    toast('♪ I\'ll Find You Again — Alana Jordan');
  });
  // While muted (ambient background), loop before the baked-in end title card —
  // the page shows its own title. Unmuted "Watch with sound" plays the full trailer.
  document.getElementById('introVideo').addEventListener('timeupdate', function () {
    if (this.muted && this.currentTime > 27.1) this.currentTime = 0;
  });

  // ---------------- solo ----------------
  function renderSolo() {
    const box = document.getElementById('soloContent');
    const soul = document.getElementById('soloSoul');
    soul.classList.toggle('pinkSoul', S.soul === 'pink');
    if (!S.soloStarted) {
      box.innerHTML = `
        <div class="panel">
          <h3>The realms are waiting.</h3>
          <p class="hint">Every soul wakes in the dark place beyond the Gateway — no name, no map,
          one promise it can almost remember. Demo quests for now; the realms open soon.</p>
          <div class="rowActions"><button class="btn btn-primary btn-pulse" id="beginSolo">Begin Solo Quest</button></div>
        </div>`;
      document.getElementById('beginSolo').addEventListener('click', () => {
        S.soloStarted = true; save(); renderSolo();
        toast('✦ The compass stirs. Your quest begins…');
      });
    } else {
      box.innerHTML = `
        <div class="panel">
          <h3>Quest log</h3>
          <div class="journeySteps">
            <div class="jstep"><span class="n">✦</span> Prologue — The Forbidden Gateway <span class="s">READY (DEMO)</span></div>
            <div class="jstep"><span class="n">✦</span> Find the First Memory Shard <span class="s">ACTIVE</span></div>
            <div class="jstep locked"><span class="n">🔒</span> Decode the Promise Echo <span class="s">LOCKED</span></div>
            <div class="jstep locked"><span class="n">🔒</span> Reach the Forbidden Gateway <span class="s">LOCKED</span></div>
          </div>
          <div class="rowActions">
            <button class="btn" id="playPrologue">Relive the Prologue</button>
            <button class="btn btn-ghost btn-tiny" id="resetSolo">Abandon quest</button>
          </div>
        </div>`;
      document.getElementById('playPrologue').addEventListener('click', () => { location.hash = '#home'; });
      document.getElementById('resetSolo').addEventListener('click', () => {
        S.soloStarted = false; save(); renderSolo();
      });
    }
  }

  // ---------------- couple ----------------
  function renderCouple() {
    const box = document.getElementById('coupleContent');

    if (S.bond) {
      const mine = S.bond.mySoul, theirs = S.bond.partnerSoul;
      box.innerHTML = `
        <div class="panel">
          <div class="bondStage bonded">
            <div class="bondOrb blue"></div>
            <div class="bondOrb pink"></div>
          </div>
          <p class="bondPromise">&ldquo;Promise me you will always be the best part of me.&rdquo;<br>
          &ldquo;Only if you promise me you will always be the best part of me.&rdquo;</p>
          <p class="muted" style="text-align:center">
            Bonded with Soul Code <span class="gcode" style="letter-spacing:4px;color:var(--gold)">${S.bond.code}</span>
            &middot; you are the <strong>${mine}</strong> soul &middot; your soulmate glows <strong>${theirs}</strong></p>
          <div class="rowActions" style="justify-content:center">
            <button class="btn btn-tiny" id="copyBond">Copy code</button>
            <button class="btn btn-tiny btn-danger" id="unbond">Release bond</button>
          </div>
          <div class="fadedLinks" style="text-align:center">
            <button data-block>Block</button><button data-report>Report</button>
          </div>
        </div>`;
      document.getElementById('copyBond').addEventListener('click', () => copy(S.bond.code));
      document.getElementById('unbond').addEventListener('click', () => {
        if (confirm('Release this bond? Your Soul Code will remain yours.')) {
          S.bond = null; save(); renderCouple();
          toast('The bond fades — for now.');
        }
      });
      wireSafety(box);
      return;
    }

    box.innerHTML = `
      <div class="panel">
        <h3>Choose your soul</h3>
        <p class="hint">Your color is your identity across the whole world.</p>
        <div class="soulPick">
          <button class="pickBlue ${S.soul === 'blue' ? 'sel' : ''}" data-soul="blue">💙 Blue Soul</button>
          <button class="pickPink ${S.soul === 'pink' ? 'sel' : ''}" data-soul="pink">💗 Pink Soul</button>
        </div>
      </div>
      <div class="panel">
        <h3>Create a Soul Code</h3>
        <p class="hint">Make a private code and share it with your person — no one else.</p>
        ${S.myCode ? `<div class="codeBig">${S.myCode.split('').join(' ')}</div>
          <div class="rowActions" style="justify-content:center">
            <button class="btn btn-tiny" id="copyCode">Copy</button>
            <button class="btn btn-tiny btn-ghost" id="newCode">New code</button>
          </div>` :
          `<div class="rowActions"><button class="btn btn-primary" id="createCode">Create my Soul Code</button></div>`}
      </div>
      <div class="panel">
        <h3>Join with a Soul Code</h3>
        <p class="hint">Your soulmate made a code? Enter it here and find them.</p>
        <div class="formRow">
          <input type="text" id="joinInput" maxlength="6" placeholder="e.g. GLOW42"
            autocapitalize="characters" autocomplete="off" spellcheck="false">
          <button class="btn btn-pink" id="joinBtn">Join</button>
        </div>
        <p class="muted" id="joinMsg" style="margin-top:8px"></p>
      </div>`;

    box.querySelectorAll('[data-soul]').forEach(b => b.addEventListener('click', () => {
      S.soul = b.dataset.soul; save(); renderCouple();
      toast(S.soul === 'blue' ? '💙 You are the blue soul.' : '💗 You are the pink soul.');
    }));
    const cc = document.getElementById('createCode');
    if (cc) cc.addEventListener('click', () => {
      S.myCode = makeCode(); save(); renderCouple();
      toast('✦ Your Soul Code is born. Share it with only one person.');
    });
    const cp = document.getElementById('copyCode');
    if (cp) cp.addEventListener('click', () => copy(S.myCode));
    const nc = document.getElementById('newCode');
    if (nc) nc.addEventListener('click', () => { S.myCode = makeCode(); save(); renderCouple(); });

    const join = () => {
      const inp = document.getElementById('joinInput');
      const msg = document.getElementById('joinMsg');
      const code = inp.value.trim().toUpperCase();
      if (!validCode(code)) {
        msg.textContent = 'A Soul Code is 6 letters/numbers — like GLOW42.';
        return;
      }
      if (!S.soul) { S.soul = 'pink'; }  // joiner defaults pink if unpicked
      const partner = S.soul === 'blue' ? 'pink' : 'blue';
      S.bond = { code, mySoul: S.soul, partnerSoul: partner, at: Date.now() };
      save(); renderCouple();
      toast('💞 Two souls, one code. The bond is made.');
    };
    document.getElementById('joinBtn').addEventListener('click', join);
    document.getElementById('joinInput').addEventListener('keydown', e => { if (e.key === 'Enter') join(); });
  }

  // ---------------- groups ----------------
  const GROUP_TYPES = ['Friends', 'Family', 'Work Crew', 'Event Group'];

  function renderGroups() {
    const box = document.getElementById('groupsContent');
    const list = S.groups.map(g => `
      <div class="groupItem" data-gid="${g.id}">
        <div class="gicon"></div>
        <div>
          <div class="gname">${esc(g.name)}</div>
          <span class="chip on">${g.type}</span>
          <span class="chip">code <span class="gcode">${g.code}</span></span>
          <span class="chip">${g.members} souls</span>
        </div>
        <div class="gactions">
          <button class="btn btn-tiny" data-copy="${g.code}">Copy code</button>
          <button class="btn btn-tiny btn-danger" data-leave="${g.id}">Leave</button>
        </div>
        <div class="gmeta">${g.mine ? 'You created this circle.' : 'You joined this circle.'}
          <button style="background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;text-decoration:underline" data-report>Report</button>
        </div>
      </div>`).join('');

    box.innerHTML = `
      <div class="panel">
        <h3>Create a circle</h3>
        <div class="formRow">
          <input type="text" id="gName" maxlength="28" placeholder="Name it — 'The Campfire', 'The Night Watch'…">
          <select id="gType">${GROUP_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
          <button class="btn btn-primary" id="gCreate">Create Circle</button>
        </div>
      </div>
      <div class="panel">
        <h3>Join a circle</h3>
        <div class="formRow">
          <input type="text" id="gJoin" maxlength="6" placeholder="Circle code" autocapitalize="characters">
          <button class="btn" id="gJoinBtn">Join</button>
        </div>
      </div>
      <h3 style="font-family:var(--serif);font-weight:400;letter-spacing:1.5px;margin:26px 0 12px">
        Your circles ${S.groups.length ? `(${S.groups.length})` : ''}</h3>
      ${list || '<p class="muted">No circles yet. Souls glow brighter together.</p>'}`;

    document.getElementById('gCreate').addEventListener('click', () => {
      const name = document.getElementById('gName').value.trim();
      if (!name) { toast('Give your circle a name first.'); return; }
      S.groups.push({
        id: 'g' + Date.now(), name, type: document.getElementById('gType').value,
        code: makeCode(), members: 1, mine: true,
      });
      save(); renderGroups();
      toast(`✨ "${name}" is lit. Share its code with your people.`);
    });
    const gj = () => {
      const code = document.getElementById('gJoin').value.trim().toUpperCase();
      if (!validCode(code)) { toast('Group codes are 6 letters/numbers.'); return; }
      if (S.groups.some(g => g.code === code)) { toast('You are already in that circle.'); return; }
      const names = ['The Night Owls', 'Kindred', 'The Lantern Circle', 'Glowmakers', 'The Found'];
      S.groups.push({
        id: 'g' + Date.now(), name: names[Math.floor(Math.random() * names.length)],
        type: GROUP_TYPES[Math.floor(Math.random() * GROUP_TYPES.length)],
        code, members: 3 + Math.floor(Math.random() * 12), mine: false,
      });
      save(); renderGroups();
      toast('✨ You slipped into the circle. Familiar souls all around.');
    };
    document.getElementById('gJoinBtn').addEventListener('click', gj);
    document.getElementById('gJoin').addEventListener('keydown', e => { if (e.key === 'Enter') gj(); });

    box.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy)));
    box.querySelectorAll('[data-leave]').forEach(b => b.addEventListener('click', () => {
      const g = S.groups.find(x => x.id === b.dataset.leave);
      if (g && confirm(`Leave "${g.name}"?`)) {
        S.groups = S.groups.filter(x => x.id !== g.id);
        delete S.visibility.groupsOn[g.id];
        save(); renderGroups();
      }
    }));
    wireSafety(box);
  }

  // ---------------- world ----------------
  function renderWorld() {
    syncWorldBanner();
    SoulWorld.start({ showSelf: isPubliclyVisible(), selfColor: S.soul || 'blue' });
    const hideBtn = document.getElementById('worldHideBtn');
    hideBtn.textContent = S.hidePublic ? 'Rejoin Public World' : 'Hide From Public World';
    hideBtn.onclick = () => {
      S.hidePublic = !S.hidePublic; save();
      renderWorld();
      toast(S.hidePublic ? '🌑 You are hidden from the Public World.' : 'Your glow may appear again — if Public Glow is on.');
    };
    wireSafety(document.getElementById('view-world'));
  }
  function syncWorldSelf() {
    SoulWorld.setSelf(isPubliclyVisible(), S.soul || 'blue');
    syncWorldBanner();
  }
  function syncWorldBanner() {
    const b = document.getElementById('worldBanner');
    if (isPubliclyVisible()) {
      b.innerHTML = `<strong>🌟 Public Glow is on.</strong> You appear below as one anonymous glow — no name, no place, no trace.
        <a href="#privacy" style="color:var(--blue)">Change</a>`;
    } else {
      b.innerHTML = `<strong>${modeLabel()}.</strong> You are watching the world unseen. Every glow below is a simulation.
        <a href="#privacy" style="color:var(--blue)">Who can see my soul?</a>`;
    }
  }

  // ---------------- privacy ----------------
  function renderPrivacy() {
    const box = document.getElementById('privacyContent');
    const v = S.visibility;

    const modeRow = (key) => {
      const m = MODES[key];
      const dis = key === 'soulmate' && !S.bond ? ' <span class="chip">bond first</span>' : '';
      return `
      <label class="pmode ${v.mode === key ? 'sel' : ''}">
        <input type="radio" name="pmode" value="${key}" ${v.mode === key ? 'checked' : ''}>
        <div><div class="pname">${m.icon} ${m.label}${dis}</div>
        <div class="pdesc">${m.desc}</div></div>
      </label>
      ${v.mode === key ? subPanel(key) : ''}`;
    };

    function subPanel(key) {
      if (key === 'groups') {
        if (!S.groups.length) return `<div class="subPanel muted">You have no circles yet — <a href="#groups" style="color:var(--blue)">create one</a>.</div>`;
        return `<div class="subPanel">${S.groups.map(g => `
          <label style="display:flex;gap:10px;align-items:center;margin:6px 0;font-size:14px">
            <input type="checkbox" data-gtoggle="${g.id}" ${v.groupsOn[g.id] ? 'checked' : ''}
              style="accent-color:var(--gold)"> ${esc(g.name)} <span class="chip">${g.type}</span>
          </label>`).join('')}</div>`;
      }
      if (key === 'nearby') {
        return `<div class="subPanel muted">Friends will only ever feel that <em>&ldquo;a familiar soul is nearby.&rdquo;</em>
          Never a distance. Never a place.</div>`;
      }
      if (key === 'temp') {
        const opts = [
          ['15', '15 minutes'], ['60', '1 hour'], ['480', '8 hours'], ['manual', 'Until I turn it off'],
        ];
        const active = v.tempUntil === 'manual' ? 'manual'
          : v.tempUntil ? String(Math.round((v.tempUntil - Date.now()) / 60000)) : null;
        return `<div class="subPanel">
          <div class="quickRow">${opts.map(([val, label]) =>
            `<button class="btn btn-tiny ${String(active) === val || (val !== 'manual' && active && Math.abs(active - val) < val * 0.2) ? 'btn-primary' : ''}"
              data-temp="${val}">${label}</button>`).join('')}</div>
          ${v.tempUntil && v.tempUntil !== 'manual' ? `<p class="muted" style="margin-top:10px">⏳ ${remainingText()} — then you fade back to Invisible.</p>` : ''}
          ${v.tempUntil === 'manual' ? `<p class="muted" style="margin-top:10px">⏳ Sharing until you turn it off.</p>` : ''}
        </div>`;
      }
      return '';
    }

    box.innerHTML = `
      ${['invisible', 'soulmate', 'groups', 'nearby', 'public', 'temp'].map(modeRow).join('')}
      <div class="panel">
        <h3>Quick controls</h3>
        <div class="quickRow">
          <button class="btn btn-tiny ${v.mode === 'invisible' ? 'btn-primary' : ''}" id="qInvisible">🌑 Go Invisible</button>
          <button class="btn btn-tiny ${S.pauseAlerts ? 'btn-primary' : ''}" id="qPause">${S.pauseAlerts ? '🔕 Alerts paused' : '🔔 Pause Nearby Alerts'}</button>
          <button class="btn btn-tiny ${S.hidePublic ? 'btn-primary' : ''}" id="qHide">${S.hidePublic ? '🙈 Hidden from Public World' : 'Hide From Public World'}</button>
        </div>
      </div>
      <div class="panel">
        <h3>Safety</h3>
        <p class="hint">Block and report are always one tap away, on every screen.</p>
        <div class="quickRow">
          <button class="btn btn-tiny" data-block>Block a soul</button>
          <button class="btn btn-tiny" data-report>Report a soul</button>
        </div>
      </div>
      <div class="safetyNote">✦ No real location is collected or shown in this demo — every glow is an echo.
      If real presence ever crosses the Veil, it will be off by default and require your permission
      <em>and</em> mutual opt-in from both souls. No exact places. No distances. Ever, without you.</div>`;

    box.querySelectorAll('input[name=pmode]').forEach(r => r.addEventListener('change', () => setMode(r.value)));
    box.querySelectorAll('[data-gtoggle]').forEach(cb => cb.addEventListener('change', () => {
      S.visibility.groupsOn[cb.dataset.gtoggle] = cb.checked; save();
      toast(cb.checked ? '✨ Circle can now sense your glow.' : 'Circle can no longer sense you.');
    }));
    box.querySelectorAll('[data-temp]').forEach(b => b.addEventListener('click', () => {
      const val = b.dataset.temp;
      S.visibility.tempUntil = val === 'manual' ? 'manual' : Date.now() + Number(val) * 60000;
      S.visibility.mode = 'temp'; save();
      renderPrivacy(); renderStatus();
      toast(val === 'manual' ? '⏳ Live share on — until you end it.' : `⏳ Live share on for ${b.textContent.trim()}.`);
    }));
    document.getElementById('qInvisible').addEventListener('click', () => setMode('invisible'));
    document.getElementById('qPause').addEventListener('click', () => {
      S.pauseAlerts = !S.pauseAlerts; save(); renderPrivacy();
      toast(S.pauseAlerts ? '🔕 Nearby alerts paused.' : '🔔 Nearby alerts resumed.');
    });
    document.getElementById('qHide').addEventListener('click', () => {
      S.hidePublic = !S.hidePublic; save(); renderPrivacy(); syncWorldSelf();
      toast(S.hidePublic ? '🙈 You will not appear in the Public World.' : 'Public World hiding is off.');
    });
    wireSafety(box);
  }

  // ---------------- shared helpers ----------------
  function esc(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(() => toast('Copied: ' + text))
      .catch(() => toast('Code: ' + text));
  }
  function wireSafety(scope) {
    scope.querySelectorAll('[data-block]').forEach(b => b.onclick = () =>
      toast('🛡 Block is coming with real profiles — noted as a placeholder.'));
    scope.querySelectorAll('[data-report]').forEach(b => b.onclick = () =>
      toast('🛡 Report received (placeholder). Safety ships before location ever does.'));
  }

  // ---------------- simulated nearby alerts ----------------
  const ALERTS = [
    '✦ A familiar soul is nearby.',
    '✦ Someone from your group is in the area.',
    '✦ Your soulmate signal is close.',
  ];
  setInterval(() => {
    if (S.pauseAlerts) return;
    if (S.visibility.mode === 'invisible') return;      // invisible souls rest undisturbed
    if (current !== 'world' && current !== 'groups') return;
    let pool = [ALERTS[0]];
    if (S.groups.length) pool.push(ALERTS[1]);
    if (S.bond) pool.push(ALERTS[2]);
    toast(pool[Math.floor(Math.random() * pool.length)], 5200);
  }, 34000);

  // ---------------- boot ----------------
  renderStatus();
  route();
})();
