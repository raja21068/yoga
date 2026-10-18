/* Practice timer with stage bells.
   Markup: <section class="practice-timer" data-stages='[["Stage name", minutes], ...]'></section>
       or: <section class="practice-timer" data-free="20"></section>   (simple timer, default minutes)
   The bell is synthesised with the Web Audio API, so no sound files are needed. */
(function () {
  const box = document.querySelector('.practice-timer');
  if (!box) return;

  const css = `
.practice-timer{margin:28px 0;padding:20px;border-radius:18px;background:#fff7ef;border:1px solid #f0d9c0;color:#3b2a1f}
.practice-timer h2{margin:0 0 4px}
.practice-timer .pt-note{margin:0 0 14px;font-size:.92rem;opacity:.8}
.pt-stages{list-style:none;padding:0;margin:0 0 14px;display:grid;gap:6px}
.pt-stages li{display:flex;justify-content:space-between;gap:10px;padding:8px 12px;border-radius:10px;background:#fff;border:1px solid #f0e2d2;font-size:.95rem}
.pt-stages li span:last-child{white-space:nowrap}
.pt-stages li.now{background:#7b1fa2;color:#fff;border-color:#7b1fa2;font-weight:700}
.pt-stages li.done{opacity:.55;text-decoration:line-through}
.pt-clock{font-size:clamp(2.6rem,10vw,3.6rem);font-weight:800;text-align:center;font-variant-numeric:tabular-nums;margin:6px 0 2px}
.pt-current{text-align:center;font-weight:700;min-height:1.4em}
.pt-bar{height:8px;border-radius:99px;background:#f0e2d2;overflow:hidden;margin:10px 0 14px}
.pt-bar i{display:block;height:100%;width:0;background:#7b1fa2;transition:width .5s linear}
.pt-buttons{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.pt-buttons button,.pt-presets button{font:inherit;font-weight:700;border-radius:99px;padding:10px 18px;border:1px solid #7b1fa2;background:#fff;color:#7b1fa2;cursor:pointer}
.pt-buttons button.primary{background:#7b1fa2;color:#fff}
.pt-presets{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}
.pt-presets button{padding:6px 12px;font-size:.9rem}
.pt-presets button.sel{background:#7b1fa2;color:#fff}
.pt-done{text-align:center;font-weight:700;color:#2e7d32;min-height:1.2em;margin-top:8px}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---- bell -------------------------------------------------------------
  let ctx = null;
  function bell(times) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      for (let n = 0; n < (times || 1); n++) {
        const t0 = ctx.currentTime + n * 1.6;
        [[528, 0.5], [1056, 0.18], [1584, 0.08]].forEach(([f, g]) => {
          const o = ctx.createOscillator(), a = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          a.gain.setValueAtTime(0.0001, t0);
          a.gain.exponentialRampToValueAtTime(g, t0 + 0.02);
          a.gain.exponentialRampToValueAtTime(0.0001, t0 + 4);
          o.connect(a).connect(ctx.destination); o.start(t0); o.stop(t0 + 4.1);
        });
      }
    } catch (e) { /* audio unavailable: the visual timer still works */ }
    if (navigator.vibrate) navigator.vibrate(200);
  }

  // ---- keep the screen awake while running -----------------------------
  let lock = null;
  async function wake(on) {
    try {
      if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
      else if (!on && lock) { await lock.release(); lock = null; }
    } catch (e) { /* not supported */ }
  }

  // ---- state ------------------------------------------------------------
  let stages = box.dataset.stages ? JSON.parse(box.dataset.stages) : null;
  const free = !stages;
  if (free) stages = [['Sit and witness', parseFloat(box.dataset.free || '20')]];
  let idx = 0, remaining = stages[0][1] * 60, running = false, endAt = 0, tick = null;
  const total = () => stages.reduce((s, x) => s + x[1] * 60, 0);
  const fmt = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); };
  const minLabel = m => (m % 1 ? m.toFixed(1).replace('.5', '½') : m) + ' min';

  box.innerHTML = `
<h2>Practice timer</h2>
<p class="pt-note">${free ? 'Choose a length and press Start. A soft bell rings at the start and at the end.'
                          : 'A soft bell rings at the start of every stage, so you can practise without watching the clock. If you use the guided audio, you do not need the timer.'}</p>
${free ? '<div class="pt-presets" role="group" aria-label="Length"></div>' : '<ol class="pt-stages"></ol>'}
<div class="pt-clock" aria-hidden="true">0:00</div>
<div class="pt-current" aria-live="polite"></div>
<div class="pt-bar"><i></i></div>
<div class="pt-buttons"><button type="button" class="primary pt-start">Start</button><button type="button" class="pt-skip">Next stage</button><button type="button" class="pt-reset">Reset</button></div>
<div class="pt-done" aria-live="polite"></div>`;
  const $ = s => box.querySelector(s);
  const clock = $('.pt-clock'), cur = $('.pt-current'), bar = $('.pt-bar i'), done = $('.pt-done');
  const startBtn = $('.pt-start'), skipBtn = $('.pt-skip');
  if (free) {
    skipBtn.hidden = true;
    const p = $('.pt-presets');
    [5, 10, 15, 20, 30, 45, 60].forEach(m => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = m + ' min';
      if (m === stages[0][1]) b.classList.add('sel');
      b.addEventListener('click', () => {
        if (running) return;
        stages = [['Sit and witness', m]]; reset();
        p.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
      });
      p.appendChild(b);
    });
  }

  function drawStages() {
    if (free) return;
    $('.pt-stages').innerHTML = stages.map((s, i) =>
      `<li class="${i < idx ? 'done' : (i === idx && (running || remaining < s[1] * 60) ? 'now' : '')}"><span>${i + 1}. ${s[0]}</span><span>${minLabel(s[1])}</span></li>`).join('');
  }
  function draw() {
    clock.textContent = fmt(remaining);
    const elapsed = stages.slice(0, idx).reduce((s, x) => s + x[1] * 60, 0) + (stages[idx][1] * 60 - remaining);
    bar.style.width = Math.min(100, elapsed / total() * 100) + '%';
    drawStages();
  }
  function announce() {
    cur.textContent = free ? '' : `Stage ${idx + 1} of ${stages.length}: ${stages[idx][0]}`;
  }
  function loop() {
    remaining = (endAt - Date.now()) / 1000;
    if (remaining <= 0) {
      if (idx < stages.length - 1) {
        idx++; remaining = stages[idx][1] * 60; endAt = Date.now() + remaining * 1000;
        bell(1); announce();
      } else {
        remaining = 0; draw(); stop(); bell(3);
        done.textContent = 'Complete. Sit quietly for a moment before you move on.';
        startBtn.textContent = 'Start again'; idx = stages.length - 1;
        return;
      }
    }
    draw();
  }
  function start() {
    if (startBtn.textContent === 'Start again') reset();
    running = true; done.textContent = '';
    endAt = Date.now() + remaining * 1000;
    if (remaining === stages[idx][1] * 60) bell(1);
    announce(); tick = setInterval(loop, 250); wake(true);
    startBtn.textContent = 'Pause'; draw();
  }
  function stop() { running = false; clearInterval(tick); wake(false); startBtn.textContent = 'Resume'; }
  function reset() {
    stop(); idx = 0; remaining = stages[0][1] * 60; cur.textContent = ''; done.textContent = '';
    startBtn.textContent = 'Start'; draw();
  }
  startBtn.addEventListener('click', () => (running ? stop() : start()));
  $('.pt-reset').addEventListener('click', reset);
  skipBtn.addEventListener('click', () => {
    if (idx >= stages.length - 1) return;
    idx++; remaining = stages[idx][1] * 60; endAt = Date.now() + remaining * 1000;
    if (running) bell(1); announce(); draw();
  });
  document.addEventListener('visibilitychange', () => { if (running && !document.hidden) { wake(true); loop(); } });
  reset();
})();
