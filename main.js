/* RK Turenakx Talent Solutions — main.js
   No storage APIs. No third-party calls except the Web3Forms endpoint the form posts to. */

/* ─────────────────────────────────────────────────────────────────────────
   Web3Forms access key. Replace with the key emailed to rkturenakx@gmail.com.
   ───────────────────────────────────────────────────────────────────────── */
const WEB3FORMS_ACCESS_KEY = '6b67ec25-86a6-44c2-9a4d-e0a92702b9ae';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Sticky header state ────────────────────────────────────────────────── */
(function header() {
  const el = document.getElementById('site-header');
  const hero = document.getElementById('top');
  if (!el) return;
  if (!hero) { el.classList.add('is-scrolled'); return; }  // pages without a dark hero

  // A sentinel pinned to the bottom edge of the hero decides the state, so it is
  // independent of scroll-event delivery.
  const sentinel = document.createElement('span');
  sentinel.className = 'header-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  hero.appendChild(sentinel);

  const setState = () => {
    const past = sentinel.getBoundingClientRect().top <= el.offsetHeight;
    el.classList.toggle('is-scrolled', past);
  };

  setState();
  window.addEventListener('scroll', setState, { passive: true });
  window.addEventListener('resize', setState);
  window.addEventListener('load', setState);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(setState, { threshold: [0, 1] }).observe(sentinel);
  }
})();

/* ── Mobile menu ────────────────────────────────────────────────────────── */
(function mobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const close = () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.removeProperty('overflow');
  };
  const open = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') close();
    else open();
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && !menu.hidden) close();
  });
})();

/* ── Section entry animation (once, at 15% visibility) ──────────────────── */
(function reveals() {
  const items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-static'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  items.forEach((el) => io.observe(el));
})();

/* ── Compliance tabs: hash routing, arrow keys ──────────────────────────── */
(function complianceTabs() {
  const tablist = document.querySelector('.tablist');
  if (!tablist) return;

  const tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
  const hashes = tabs.map((t) => t.dataset.hash);

  function select(hash, opts) {
    const options = opts || {};
    const index = hashes.indexOf(hash);
    if (index < 0) return false;

    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });

    if (options.focus) tabs[index].focus();
    if (options.updateHash && history.replaceState) {
      history.replaceState(null, '', '#' + hash);
    }
    return true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => select(tab.dataset.hash, { updateHash: true }));
  });

  tablist.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next].dataset.hash, { focus: true, updateHash: true });
  });

  // Deep links, and in-page links that point at a policy
  const fromHash = (hash) => select(hash.replace(/^#/, ''), {});
  if (location.hash && fromHash(location.hash)) {
    // deep link: bring the compliance section into view once layout settles
    window.addEventListener('load', () => {
      const section = document.getElementById('compliance');
      if (!section) return;
      window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 80, behavior: 'auto' });
    });
  }
  window.addEventListener('hashchange', () => { if (location.hash) fromHash(location.hash); });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href').slice(1);
    if (hashes.indexOf(hash) < 0) return;
    e.preventDefault();
    select(hash, { updateHash: true });
    const section = document.getElementById('compliance');
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    }
  });
})();

/* ── The journey figure: plays once when it comes into view ─────────────── */
(function journey() {
  const fig = document.getElementById('journey');
  if (!fig) return;
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;  // CSS holds the finished frame
  fig.classList.add('is-armed');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      fig.classList.add('is-playing');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  io.observe(fig);
})();

/* ── Contact form (Web3Forms, inline states, never redirects) ───────────── */
(function contactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const submit = document.getElementById('form-submit');
  if (!form || !status || !submit) return;

  const setStatus = (message, kind) => {
    status.textContent = message;
    status.classList.remove('is-error', 'is-success');
    if (kind) status.classList.add(kind);
  };

  const required = ['name', 'email', 'phone', 'i_am_a', 'message'];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.elements.botcheck && form.elements.botcheck.checked) return;

    let firstBad = null;
    required.forEach((name) => {
      const field = form.elements[name];
      if (!field) return;
      const bad = !field.value.trim();
      field.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !firstBad) firstBad = field;
    });

    const consent = form.elements.consent;
    if (!consent.checked) {
      consent.setAttribute('aria-invalid', 'true');
      if (!firstBad) firstBad = consent;
    } else {
      consent.setAttribute('aria-invalid', 'false');
    }

    const email = form.elements.email;
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      email.setAttribute('aria-invalid', 'true');
      if (!firstBad) firstBad = email;
      setStatus('Please enter a valid email address.', 'is-error');
      email.focus();
      return;
    }

    if (firstBad) {
      setStatus(firstBad === consent
        ? 'Please give your consent so we can respond to your enquiry.'
        : 'Please complete the required fields.', 'is-error');
      firstBad.focus();
      return;
    }

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: 'Website enquiry — RK Turenakx Talent Solutions',
      from_name: 'RK Turenakx website',
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      i_am_a: form.elements.i_am_a.value,
      organisation: form.elements.organisation.value.trim(),
      message: form.elements.message.value.trim(),
      consent: 'Given — Privacy Policy referenced at submission',
      botcheck: ''
    };

    submit.disabled = true;
    setStatus('Sending…', null);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        form.reset();
        setStatus('Thank you — your enquiry has reached us. You will get a reply.', 'is-success');
      } else {
        setStatus('We could not send that. Please email rkturenakx@gmail.com directly.', 'is-error');
      }
    } catch (err) {
      setStatus('We could not send that. Please email rkturenakx@gmail.com directly.', 'is-error');
    } finally {
      submit.disabled = false;
    }
  });
})();

/* ─────────────────────────────────────────────────────────────────────────
   HERO — drifting point field, connections drawn between near neighbours.
   Hand-written WebGL: one POINTS draw call, one LINES draw call, spatial
   hash grid for neighbour detection. No third-party library is fetched or
   vendored. Subtle by design; it must never compete with the headline.
   ───────────────────────────────────────────────────────────────────────── */
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const hero = document.getElementById('top');
  if (!canvas || !hero) return;

  if (REDUCED_MOTION) { canvas.remove(); return; }

  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: window.innerWidth >= 768, depth: false,
    premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power'
  });
  if (!gl) { canvas.remove(); return; }   // static gradient fallback

  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 2000 : 7000;
  const MAX_LINES = isMobile ? 1200 : 5000;
  const THRESHOLD = isMobile ? 0.95 : 0.62;
  const HX = 9, HY = 5.2, HZ = 6;

  /* Geometry ------------------------------------------------------------- */
  const pos = new Float32Array(COUNT * 3);
  const vel = new Float32Array(COUNT * 3);
  const glow = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * HX;
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * HY;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * HZ;
    vel[i * 3] = (Math.random() * 2 - 1) * 0.045;
    vel[i * 3 + 1] = (Math.random() * 2 - 1) * 0.03;
    vel[i * 3 + 2] = (Math.random() * 2 - 1) * 0.045;
    glow[i] = Math.random() < 0.05 ? 1 : 0;
  }

  const linePos = new Float32Array(MAX_LINES * 6);
  const lineAlpha = new Float32Array(MAX_LINES * 2);

  /* Spatial hash grid ---------------------------------------------------- */
  const cell = THRESHOLD;
  const nx = Math.ceil((HX * 2) / cell), ny = Math.ceil((HY * 2) / cell), nz = Math.ceil((HZ * 2) / cell);
  const nCells = nx * ny * nz;
  const counts = new Int32Array(nCells);
  const starts = new Int32Array(nCells + 1);
  const items = new Int32Array(COUNT);
  const cellOf = new Int32Array(COUNT);
  const NEIGHBOURS = [
    1, 0, 0, -1, 1, 0, 0, 1, 0, 1, 1, 0,
    -1, -1, 1, 0, -1, 1, 1, -1, 1,
    -1, 0, 1, 0, 0, 1, 1, 0, 1,
    -1, 1, 1, 0, 1, 1, 1, 1, 1
  ];

  function buildGrid() {
    counts.fill(0);
    for (let i = 0; i < COUNT; i++) {
      let ix = ((pos[i * 3] + HX) / cell) | 0;
      let iy = ((pos[i * 3 + 1] + HY) / cell) | 0;
      let iz = ((pos[i * 3 + 2] + HZ) / cell) | 0;
      if (ix < 0) ix = 0; else if (ix >= nx) ix = nx - 1;
      if (iy < 0) iy = 0; else if (iy >= ny) iy = ny - 1;
      if (iz < 0) iz = 0; else if (iz >= nz) iz = nz - 1;
      const c = ix + nx * (iy + ny * iz);
      cellOf[i] = c;
      counts[c]++;
    }
    let acc = 0;
    for (let c = 0; c < nCells; c++) { starts[c] = acc; acc += counts[c]; }
    starts[nCells] = acc;
    const cursor = starts.slice(0, nCells);
    for (let i = 0; i < COUNT; i++) items[cursor[cellOf[i]]++] = i;
  }

  function buildLines() {
    let lines = 0;
    const t2 = THRESHOLD * THRESHOLD;

    const tryPair = (a, b) => {
      const dx = pos[a * 3] - pos[b * 3];
      const dy = pos[a * 3 + 1] - pos[b * 3 + 1];
      const dz = pos[a * 3 + 2] - pos[b * 3 + 2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > t2) return;
      const falloff = 1 - Math.sqrt(d2) / THRESHOLD;
      const o = lines * 6;
      linePos[o] = pos[a * 3]; linePos[o + 1] = pos[a * 3 + 1]; linePos[o + 2] = pos[a * 3 + 2];
      linePos[o + 3] = pos[b * 3]; linePos[o + 4] = pos[b * 3 + 1]; linePos[o + 5] = pos[b * 3 + 2];
      lineAlpha[lines * 2] = falloff; lineAlpha[lines * 2 + 1] = falloff;
      lines++;
    };

    for (let iz = 0; iz < nz && lines < MAX_LINES; iz++) {
      for (let iy = 0; iy < ny && lines < MAX_LINES; iy++) {
        for (let ix = 0; ix < nx && lines < MAX_LINES; ix++) {
          const c = ix + nx * (iy + ny * iz);
          const s = starts[c], e = starts[c + 1];
          if (s === e) continue;

          for (let p = s; p < e && lines < MAX_LINES; p++) {
            for (let q = p + 1; q < e && lines < MAX_LINES; q++) tryPair(items[p], items[q]);
          }

          for (let n = 0; n < NEIGHBOURS.length && lines < MAX_LINES; n += 3) {
            const jx = ix + NEIGHBOURS[n], jy = iy + NEIGHBOURS[n + 1], jz = iz + NEIGHBOURS[n + 2];
            if (jx < 0 || jy < 0 || jz < 0 || jx >= nx || jy >= ny || jz >= nz) continue;
            const c2 = jx + nx * (jy + ny * jz);
            const s2 = starts[c2], e2 = starts[c2 + 1];
            for (let p = s; p < e && lines < MAX_LINES; p++) {
              for (let q = s2; q < e2 && lines < MAX_LINES; q++) tryPair(items[p], items[q]);
            }
          }
        }
      }
    }
    return lines;
  }

  /* Matrices ------------------------------------------------------------- */
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }
  function viewMatrix(yaw, pitch, dist) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    // R = Rx(pitch) * Ry(yaw), then translate by -dist in z
    return new Float32Array([
      cy, sp * sy, -cp * sy, 0,
      0, cp, sp, 0,
      sy, -sp * cy, cp * cy, 0,
      0, 0, -dist, 1
    ]);
  }

  /* Shaders -------------------------------------------------------------- */
  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }
  function program(vsSrc, fsSrc) {
    const vs = compile(gl.VERTEX_SHADER, vsSrc), fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  const pointProg = program(
    'attribute vec3 a_pos; attribute float a_glow;' +
    'uniform mat4 u_view; uniform mat4 u_proj; uniform float u_size;' +
    'varying float v_glow;' +
    'void main(){ vec4 v = u_view * vec4(a_pos, 1.0); gl_Position = u_proj * v;' +
    ' gl_PointSize = u_size / max(0.5, -v.z); v_glow = a_glow; }',
    'precision mediump float; varying float v_glow;' +
    'void main(){ vec2 d = gl_PointCoord - vec2(0.5);' +
    ' float r = dot(d, d); if (r > 0.25) discard;' +
    ' float soft = 1.0 - smoothstep(0.10, 0.25, r);' +
    ' vec3 bone = vec3(0.969, 0.957, 0.945); vec3 glow = vec3(1.0, 0.584, 0.282);' +
    ' vec3 c = mix(bone, glow, v_glow);' +
    ' gl_FragColor = vec4(c, 0.6 * soft); }'
  );

  const lineProg = program(
    'attribute vec3 a_pos; attribute float a_alpha;' +
    'uniform mat4 u_view; uniform mat4 u_proj;' +
    'varying float v_alpha;' +
    'void main(){ gl_Position = u_proj * u_view * vec4(a_pos, 1.0); v_alpha = a_alpha; }',
    'precision mediump float; varying float v_alpha;' +
    'void main(){ gl_FragColor = vec4(0.957, 0.482, 0.125, 0.15 * v_alpha); }'
  );

  if (!pointProg || !lineProg) { canvas.remove(); return; }

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);

  const glowBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, glowBuf);
  gl.bufferData(gl.ARRAY_BUFFER, glow, gl.STATIC_DRAW);

  const lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ARRAY_BUFFER, linePos, gl.DYNAMIC_DRAW);

  const lineAlphaBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineAlphaBuf);
  gl.bufferData(gl.ARRAY_BUFFER, lineAlpha, gl.DYNAMIC_DRAW);

  const uni = {
    pointView: gl.getUniformLocation(pointProg, 'u_view'),
    pointProj: gl.getUniformLocation(pointProg, 'u_proj'),
    pointSize: gl.getUniformLocation(pointProg, 'u_size'),
    lineView: gl.getUniformLocation(lineProg, 'u_view'),
    lineProj: gl.getUniformLocation(lineProg, 'u_proj')
  };
  const attr = {
    pointPos: gl.getAttribLocation(pointProg, 'a_pos'),
    pointGlow: gl.getAttribLocation(pointProg, 'a_glow'),
    linePos: gl.getAttribLocation(lineProg, 'a_pos'),
    lineAlpha: gl.getAttribLocation(lineProg, 'a_alpha')
  };

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let proj = perspective(0.95, 16 / 9, 0.1, 100);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      proj = perspective(0.95, canvas.clientWidth / Math.max(1, canvas.clientHeight), 0.1, 100);
    }
  }
  resize();
  window.addEventListener('resize', resize);

  /* Pointer parallax, capped at 4 degrees, eased --------------------------- */
  const CAP = 4 * Math.PI / 180;
  let targetYaw = 0, targetPitch = 0, yawOffset = 0, pitchOffset = 0;
  window.addEventListener('pointermove', (e) => {
    targetYaw = ((e.clientX / window.innerWidth) * 2 - 1) * CAP;
    targetPitch = ((e.clientY / window.innerHeight) * 2 - 1) * CAP * 0.6;
  }, { passive: true });

  /* Loop, with the mandatory gates --------------------------------------- */
  let raf = 0, last = 0, clock = 0, visible = true;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    clock += dt;

    for (let i = 0; i < COUNT; i++) {
      const x = i * 3, y = x + 1, z = x + 2;
      pos[x] += vel[x] * dt; pos[y] += vel[y] * dt; pos[z] += vel[z] * dt;
      if (pos[x] > HX) pos[x] -= HX * 2; else if (pos[x] < -HX) pos[x] += HX * 2;
      if (pos[y] > HY) pos[y] -= HY * 2; else if (pos[y] < -HY) pos[y] += HY * 2;
      if (pos[z] > HZ) pos[z] -= HZ * 2; else if (pos[z] < -HZ) pos[z] += HZ * 2;
    }

    buildGrid();
    const lines = buildLines();

    yawOffset += (targetYaw - yawOffset) * 0.04;
    pitchOffset += (targetPitch - pitchOffset) * 0.04;
    const view = viewMatrix(
      Math.sin(clock * 0.021) * 0.20 + yawOffset,
      Math.sin(clock * 0.016) * 0.06 + pitchOffset,
      13.5
    );

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (lines > 0) {
      gl.useProgram(lineProg);
      gl.uniformMatrix4fv(uni.lineView, false, view);
      gl.uniformMatrix4fv(uni.lineProj, false, proj);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, linePos.subarray(0, lines * 6));
      gl.enableVertexAttribArray(attr.linePos);
      gl.vertexAttribPointer(attr.linePos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineAlphaBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lineAlpha.subarray(0, lines * 2));
      gl.enableVertexAttribArray(attr.lineAlpha);
      gl.vertexAttribPointer(attr.lineAlpha, 1, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, lines * 2);
    }

    gl.useProgram(pointProg);
    gl.uniformMatrix4fv(uni.pointView, false, view);
    gl.uniformMatrix4fv(uni.pointProj, false, proj);
    gl.uniform1f(uni.pointSize, (isMobile ? 20 : 26) * Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.enableVertexAttribArray(attr.pointPos);
    gl.vertexAttribPointer(attr.pointPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, glowBuf);
    gl.enableVertexAttribArray(attr.pointGlow);
    gl.vertexAttribPointer(attr.pointGlow, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, COUNT);
  }

  function start() {
    if (raf || !visible) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
        if (visible && document.visibilityState !== 'hidden') start(); else stop();
      });
    }, { threshold: 0 }).observe(hero);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
    else if (visible) start();
  });

  start();
}

if (document.readyState === 'complete') initHero();
else window.addEventListener('load', initHero);
