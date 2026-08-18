/* journey.js — the hiring journey animation.
   A port of the ten-scene composition to plain DOM + rAF: no framework, no CDN.
   Everything visible is a pure function of T (authored seconds), so a seek is a render. */

(function () {
  const root = document.getElementById('journey');
  if (!root) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Authored timeline (seconds) ─────────────────────────────────────── */
  const SCENES = [
    ['Opening', 4], ['TheGap', 4.5], ['Planning', 4.5], ['Sourcing', 5.5],
    ['Application', 4], ['Screening', 4], ['Assessment', 4.5], ['Offer', 4.5],
    ['Onboarding', 5], ['Close', 5]
  ];
  const CUES = {};
  let acc = 0;
  SCENES.forEach(([name, dur]) => { CUES[name] = acc; acc += dur; });
  const TOTAL = acc;                 // 45.5 authored seconds
  const PLAY_SECONDS = 30;           // wall-clock length of one run
  const RATE = TOTAL / PLAY_SECONDS;

  /* ── World geometry ──────────────────────────────────────────────────── */
  const W = 1920, H = 1080;
  const DECK_Y = 700, LEFT_EDGE = 760, RIGHT_EDGE = 8340;
  const STATIONS = [1150, 2250, 3350, 4450, 5550, 6650, 7750];

  const STAGES = [
    ['01', 'Requirement intake', 'We take our time over the role: the skills, the team, the reporting line, the compensation band, and what has made it hard to fill so far.', 'Intake'],
    ['02', 'Sourcing and market mapping', 'We begin with the people we already know, then source actively against the specific requirement.', 'Sourcing'],
    ['03', 'Screening conversation', 'We speak with every candidate individually — understanding their suitability, confirming expectations, and making sure the interest is genuine before anything reaches you.', 'Screening'],
    ['04', 'Consent and shortlist', 'We explain the role and the organisation to the candidate, and ask for their agreement before sharing their profile.', 'Consent'],
    ['05', 'Interview coordination', 'We schedule, confirm and follow up on every round, and carry feedback in both directions.', 'Interviews'],
    ['06', 'Offer support', 'We help with the offer conversation, keep expectations realistic on both sides, and work to make sure nothing comes as a surprise at the final stage.', 'Offer'],
    ['07', 'Documentation and joining', 'We help the candidate gather whatever your onboarding needs, and stay in touch right through to the joining date.', 'Joining']
  ];
  const CUE_OF = ['Planning', 'Sourcing', 'Application', 'Screening', 'Assessment', 'Offer', 'Onboarding']
    .map((n) => CUES[n]);
  const ENDS = CUE_OF.map((c, i) => (i < 6 ? CUE_OF[i + 1] : CUES.Close));

  const SEGMENTS = [
    [LEFT_EDGE - 60, STATIONS[0] + 60, CUES.Planning],
    [STATIONS[0], STATIONS[1] + 60, CUES.Sourcing],
    [STATIONS[1], STATIONS[2] + 60, CUES.Application],
    [STATIONS[2], STATIONS[3] + 60, CUES.Screening],
    [STATIONS[3], STATIONS[4] + 60, CUES.Assessment],
    [STATIONS[4], STATIONS[5] + 60, CUES.Offer],
    [STATIONS[5], STATIONS[6] + 60, CUES.Onboarding],
    [STATIONS[6], RIGHT_EDGE + 80, CUES.Close - 0.9]
  ];

  const CAPTIONS = [
    [CUES.TheGap + 1.3, CUES.TheGap + 2.1, 'One side has ambition.'],
    [CUES.TheGap + 2.2, CUES.TheGap + 2.9, 'The other has opportunity.'],
    [CUES.TheGap + 2.95, CUES.TheGap + 3.55, 'Between them sits the talent gap.'],
    [CUES.Close + 0.2, CUES.Close + 1.7, 'Seven stages. One bridge.']
  ];

  /* ── Motion ──────────────────────────────────────────────────────────── */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);
  const easeOutCubic = (t) => { const u = t - 1; return u * u * u + 1; };
  const easeOutBack = (t) => { const u = t - 1, c = 1.7; return 1 + (c + 1) * u * u * u + c * u * u; };

  function kf(T, pairs, ease) {
    const e = ease || easeInOutCubic;
    if (T <= pairs[0][0]) return pairs[0][1];
    for (let i = 0; i < pairs.length - 1; i++) {
      const [t0, v0] = pairs[i], [t1, v1] = pairs[i + 1];
      if (T <= t1) {
        if (t1 === t0) return v1;
        return v0 + (v1 - v0) * e((T - t0) / (t1 - t0));
      }
    }
    return pairs[pairs.length - 1][1];
  }

  /* ── Build the DOM once ──────────────────────────────────────────────── */
  const el = (cls, parent, text) => {
    const d = document.createElement('div');
    d.className = cls;
    if (text != null) d.textContent = text;
    (parent || root).appendChild(d);
    return d;
  };

  const frame = el('jv-frame');
  const world = el('jv-world', frame);
  const overlay = el('jv-overlay', frame);

  const plateauL = el('jv-plateau jv-plateau-l', world);
  const plateauR = el('jv-plateau jv-plateau-r', world);
  el('jv-mist jv-mist-l', world);
  el('jv-mist jv-mist-r', world);

  const piers = STATIONS.map((x) => {
    const p = el('jv-pier', world);
    p.style.left = (x - 22) + 'px';
    p.style.top = (DECK_Y + 46) + 'px';
    return p;
  });

  const spans = SEGMENTS.map(([a]) => {
    const s = el('jv-span', world);
    s.style.left = a + 'px';
    s.style.top = DECK_Y + 'px';
    return s;
  });

  const cards = STAGES.map(([num, title, line], i) => {
    const wrap = el('jv-card', world);
    wrap.style.left = (STATIONS[i] - 420) + 'px';
    const inner = el('jv-card-inner', wrap);
    const head = el('jv-card-head', inner);
    el('jv-card-num', head, num);
    el('jv-card-kicker', head, title);
    el('jv-card-line', inner, line);
    const bar = el('jv-card-bar', inner);
    const fill = el('jv-card-fill', bar);
    el('jv-card-stem', wrap);
    return { wrap, fill };
  });

  const walker = el('jv-walker', world);
  el('jv-walker-core', walker);

  const open = el('jv-open', overlay);
  el('jv-eyebrow', open, 'How we work');
  const openTitle = el('jv-title', open);
  ['The hiring', 'journey'].forEach((t) => el('jv-title-line', openTitle, t));
  el('jv-open-sub', open, 'Seven stages — and you will always know which one your role is at.');

  const caption = el('jv-caption', overlay);

  const rail = el('jv-rail', overlay);
  const railItems = STAGES.map(([, , , short], i) => {
    if (i > 0) el('jv-rail-link', rail);
    const item = el('jv-rail-item', rail);
    const dot = el('jv-rail-dot', item);
    const label = el('jv-rail-label', item, short);
    return { item, dot, label, link: rail.children[rail.children.length - 2] };
  });

  const close = el('jv-close', overlay);
  const closeTitle = el('jv-title', close);
  el('jv-title-line', closeTitle, 'The Future is Waiting !');
  el('jv-close-sub', close, 'Specialist IT recruitment · Bengaluru');

  /* ── Fit the 1920×1080 stage to its container ────────────────────────── */
  function fit() {
    const scale = root.clientWidth / W;
    frame.style.transform = 'scale(' + scale + ')';
  }
  fit();
  window.addEventListener('resize', fit);

  /* ── Render a single authored moment ─────────────────────────────────── */
  function render(T) {
    const camX = kf(T, [
      [0, 300], [3.2, 430],
      [CUES.TheGap + 1.1, 4550], [CUES.Planning - 0.9, 4550],
      [CUES.Planning + 0.4, STATIONS[0]], [CUES.Sourcing - 0.5, STATIONS[0] + 70],
      [CUES.Sourcing + 0.6, STATIONS[1]], [CUES.Application - 0.5, STATIONS[1] + 70],
      [CUES.Application + 0.6, STATIONS[2]], [CUES.Screening - 0.5, STATIONS[2] + 70],
      [CUES.Screening + 0.6, STATIONS[3]], [CUES.Assessment - 0.5, STATIONS[3] + 70],
      [CUES.Assessment + 0.6, STATIONS[4]], [CUES.Offer - 0.5, STATIONS[4] + 70],
      [CUES.Offer + 0.6, STATIONS[5]], [CUES.Onboarding - 0.5, STATIONS[5] + 70],
      [CUES.Onboarding + 0.6, STATIONS[6]], [CUES.Close - 0.4, STATIONS[6] + 120],
      [CUES.Close + 1.4, 4550], [TOTAL, 4650]
    ]);
    const camS = kf(T, [
      [0, 0.92], [3.2, 1],
      [CUES.TheGap + 1.1, 0.14], [CUES.Planning - 0.9, 0.145],
      [CUES.Planning + 0.4, 1], [CUES.Close - 0.4, 1],
      [CUES.Close + 1.4, 0.2], [TOTAL, 0.22]
    ]);
    const camY = kf(T, [
      [0, 560], [CUES.TheGap + 1.1, 780], [CUES.Planning + 0.4, 470],
      [CUES.Close - 0.4, 470], [CUES.Close + 1.4, 700]
    ]);
    world.style.transform =
      'translate(' + (W / 2) + 'px,' + (H / 2) + 'px) scale(' + camS + ') translate(' + (-camX) + 'px,' + (-camY) + 'px)';

    spans.forEach((s, i) => {
      const [a, b, at] = SEGMENTS[i];
      s.style.width = ((b - a) * easeOutCubic(clamp((T - at) / 0.85, 0, 1))) + 'px';
    });

    piers.forEach((p, i) => {
      p.style.height = (620 * easeOutCubic(clamp((T - (CUE_OF[i] - 0.25)) / 0.8, 0, 1))) + 'px';
    });

    cards.forEach((c, i) => {
      const start = CUE_OF[i], end = ENDS[i];
      const inP = clamp((T - start) / 0.7, 0, 1);
      const outP = clamp((T - (end - 0.5)) / 0.5, 0, 1);
      c.wrap.style.opacity = inP * (1 - outP);
      c.wrap.style.transform = 'translateY(' + ((1 - easeOutCubic(clamp((T - start) / 0.8, 0, 1))) * 80 - outP * 40) + 'px)';
      c.fill.style.width = (clamp((T - start - 0.3) / (end - start - 1), 0, 1) * 100) + '%';
    });

    const walkerX = kf(T, [
      [0, 360], [CUES.Planning - 0.3, 400], [CUES.Planning + 0.9, STATIONS[0]],
      [CUES.Sourcing, STATIONS[0]], [CUES.Sourcing + 1.1, STATIONS[1]],
      [CUES.Application, STATIONS[1]], [CUES.Application + 1, STATIONS[2]],
      [CUES.Screening, STATIONS[2]], [CUES.Screening + 1, STATIONS[3]],
      [CUES.Assessment, STATIONS[3]], [CUES.Assessment + 1, STATIONS[4]],
      [CUES.Offer, STATIONS[4]], [CUES.Offer + 1, STATIONS[5]],
      [CUES.Onboarding, STATIONS[5]], [CUES.Onboarding + 1.1, STATIONS[6]],
      [CUES.Close - 0.6, STATIONS[6]], [CUES.Close + 1.8, RIGHT_EDGE + 620]
    ]);
    const bob = Math.abs(Math.sin(T * 5.5)) * 9;
    walker.style.left = (walkerX - 34) + 'px';
    walker.style.top = (DECK_Y - 78 - bob) + 'px';

    const groundIn = clamp(T / 0.8, 0, 1);
    plateauL.style.opacity = groundIn;
    plateauR.style.opacity = groundIn;

    open.style.opacity = (1 - clamp((T - (CUES.TheGap - 1.2)) / 1, 0, 1)) * clamp(T / 0.6, 0, 1);
    open.style.transform = 'translateY(' + ((1 - easeOutCubic(clamp((T - 0.2) / 1.1, 0, 1))) * 40) + 'px)';

    const closeIn = clamp((T - CUES.Close - 1.9) / 1.1, 0, 1);
    close.style.opacity = closeIn;
    close.style.transform = 'translateY(' + ((1 - closeIn) * 30) + 'px)';

    let text = '', op = 0;
    for (let i = 0; i < CAPTIONS.length; i++) {
      const [at, until, t] = CAPTIONS[i];
      if (T >= at && T < until) {
        text = t;
        op = Math.min(1, Math.min((T - at) / 0.25, (until - T) / 0.25));
        break;
      }
    }
    if (caption.textContent !== text) caption.textContent = text;
    caption.style.opacity = clamp(op, 0, 1);

    const active = CUE_OF.reduce((a, c, i) => (T >= c - 0.3 ? i : a), -1);
    const railOp = clamp((T - CUES.Planning + 0.6) / 0.8, 0, 1) * (1 - clamp((T - CUES.Close) / 0.8, 0, 1));
    rail.style.opacity = railOp;
    railItems.forEach((r, i) => {
      const on = i <= active;
      r.item.setAttribute('data-state', i === active ? 'now' : on ? 'done' : 'wait');
      if (r.link) r.link.setAttribute('data-state', on ? 'done' : 'wait');
    });
  }

  /* ── Transport: one run, on view, with a replay ──────────────────────── */
  const button = document.getElementById('journey-replay');
  let raf = 0, t0 = 0, done = false;

  function tick(now) {
    if (!t0) t0 = now;
    const T = ((now - t0) / 1000) * RATE;
    if (T >= TOTAL) { render(TOTAL); raf = 0; done = true; if (button) button.hidden = false; return; }
    render(T);
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (raf) cancelAnimationFrame(raf);
    t0 = 0; done = false;
    if (button) button.hidden = true;
    raf = requestAnimationFrame(tick);
  }

  if (reduced) {
    render(TOTAL);
    if (button) button.hidden = true;
    return;
  }

  render(0);
  if (button) {
    button.hidden = true;
    button.addEventListener('click', play);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        play();
      });
    }, { threshold: 0.4 });
    io.observe(root);
  } else {
    play();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && raf) { cancelAnimationFrame(raf); raf = 0; if (!done && button) button.hidden = false; }
  });
})();
