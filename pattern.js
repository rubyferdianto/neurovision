/* Pattern Echo's presentation and retry flow. Loaded after the level system. */
(() => {
  const colors = ['#fd7297', '#ffc45e', '#55dcb3', '#57c8f5', '#ad8bff', '#ff9562', '#ea81d3', '#77cf85', '#6c9fff', '#ffe078', '#57d4dc', '#ce9bff', '#ff8090', '#83dfa5', '#79b5ff', '#edaa75'];
  window.ECHO_COLORS = colors;
  let slow = false, sound = false, audio;
  const cells = () => content.querySelectorAll('.echo-cell');
  const el = selector => content.querySelector(selector);
  function tone(cell) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
      osc.type = 'sine'; osc.frequency.value = 220 * 2 ** ([0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36][cell] / 12);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.055, now + .018);
      gain.gain.exponentialRampToValueAtTime(.001, now + .26);
      osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now + .28);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch { sound = false; }
  }
  function progress() {
    const p = app.pattern;
    el('#echo-count').textContent = `${p.index} / ${p.seq.length}`;
    el('#echo-attempt').textContent = p.attempts;
    content.querySelectorAll('.echo-step').forEach((step, i) => {
      step.classList.toggle('complete', i < p.index);
      step.classList.toggle('current', p.phase === 'input' && i === p.index);
    });
  }
  window.patternIntro = function () {
    const level = levelOf('pattern');
    content.innerHTML = window.gameFrame('pattern', `<span class="stage-eyebrow">THE COLOR STUDIO / LEVEL ${String(level).padStart(2, '0')}</span><h2 class="stage-title">Catch the rhythm.</h2><p class="stage-copy">Watch the raised tiles light up, then play the sequence back.<br>Build your way to 12 lights. Retry as often as you like.</p><div class="echo-intro-art" aria-hidden="true">${colors.slice(0, 5).map((color, i) => `<i style="--tile-color:${color};--tile-order:${i}"></i>`).join('')}</div><div class="level-detail"><span>BOARD <b>${level < 5 ? '3 × 3' : '4 × 4'}</b></span><span>SEQUENCE <b>${level + 2} lights</b></span><span>RETRIES <b>Unlimited</b></span></div><button class="stage-button" id="pattern-start">Play level ${String(level).padStart(2, '0')} →</button>`);
    window.bindHomeButton(); el('#pattern-start').addEventListener('click', window.patternStart);
  };
  window.patternStart = function () {
    window.clearTimers();
    const level = levelOf('pattern'), size = level < 5 ? 3 : 4, seq = [];
    while (seq.length < level + 2) {
      const next = Math.floor(Math.random() * size * size);
      if (next !== seq.at(-1)) seq.push(next);
    }
    app.pattern = { level, size, seq, index: 0, phase: 'watch', mistakes: 0, attempts: 1, replays: 0, playback: 0 };
    window.patternDraw(); window.patternPlayback();
  };
  window.patternDraw = function () {
    const p = app.pattern;
    el('#game-stage').innerHTML = `<span class="stage-eyebrow">COLOR STUDIO / LEVEL ${String(p.level).padStart(2, '0')}</span><h2 class="stage-title">Follow the glow.</h2><p class="stage-copy" aria-live="polite">Watch each tile rise and light up. Your turn is next.</p><div class="echo-meta"><span>SEQUENCE <b>${p.seq.length} lights</b></span><span>YOUR TURN <b id="echo-count">0 / ${p.seq.length}</b></span><span>ATTEMPT <b id="echo-attempt">${p.attempts}</b></span></div><div class="echo-progress" aria-label="Sequence progress">${p.seq.map((_, i) => `<i class="echo-step" style="--step-color:${colors[i]}" aria-hidden="true">${i + 1}</i>`).join('')}</div><div class="echo-board echo-color-board" style="--echo-size:${p.size}">${Array.from({ length: p.size ** 2 }, (_, i) => `<button class="echo-cell" data-cell="${i}" style="--tile-color:${colors[i]}" aria-label="Pattern tile ${i + 1}" disabled><span>${i + 1}</span><i aria-hidden="true">✦</i></button>`).join('')}</div><div class="echo-actions"><button class="stage-button" id="echo-replay" disabled>Watch again</button><button class="secondary-button" id="echo-new">New pattern</button></div><div class="echo-options"><button class="echo-option" id="echo-slow" aria-pressed="${slow}">Slow replay: ${slow ? 'on' : 'off'}</button><button class="echo-option" id="echo-sound" aria-pressed="${sound}">Sound: ${sound ? 'on' : 'off'}</button><button class="text-link" id="echo-exit">Finish session</button></div><p class="echo-hint">Unlimited retries. A fresh pattern is always one tap away.</p>`;
    cells().forEach(button => button.addEventListener('click', () => window.patternTap(Number(button.dataset.cell))));
    el('#echo-replay').addEventListener('click', () => {
      if (p.phase === 'watch' || p.phase === 'clear') return;
      p.attempts++; p.replays++; window.patternPlayback();
    });
    el('#echo-new').addEventListener('click', window.patternStart);
    el('#echo-slow').addEventListener('click', () => {
      slow = !slow; el('#echo-slow').setAttribute('aria-pressed', String(slow));
      el('#echo-slow').textContent = `Slow replay: ${slow ? 'on' : 'off'}`;
      if (p.phase !== 'clear') { if (p.phase !== 'watch') p.attempts++; p.replays++; window.patternPlayback(); }
    });
    el('#echo-sound').addEventListener('click', () => {
      sound = !sound; tone(0);
      el('#echo-sound').setAttribute('aria-pressed', String(sound));
      el('#echo-sound').textContent = `Sound: ${sound ? 'on' : 'off'}`;
    });
    el('#echo-exit').addEventListener('click', window.finishSession);
  };
  window.patternPlayback = function () {
    window.clearTimers();
    const p = app.pattern, run = ++p.playback, pace = slow ? 1000 : Math.max(470, 790 - p.level * 24);
    const current = () => app.game === 'pattern' && app.pattern === p && p.playback === run;
    p.phase = 'watch'; p.index = 0;
    cells().forEach(tile => { tile.disabled = true; tile.classList.remove('lit', 'correct', 'miss'); });
    el('#echo-replay').disabled = true; el('#echo-replay').textContent = 'Watching…';
    el('#game-stage .stage-title').textContent = 'Follow the glow.';
    el('#game-stage .stage-copy').textContent = `${slow ? 'Slow rhythm' : 'Watch closely'} — ${p.seq.length} lights, in order.`;
    progress();
    // Replays can be triggered below the board; bring every flashing tile into view.
    window.later(() => {
      if (current()) (el('.nv3d-pattern') || el('.echo-board'))?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
    p.seq.forEach((cell, i) => {
      window.later(() => {
        if (!current()) return;
        el(`.echo-cell[data-cell="${cell}"]`).classList.add('lit'); tone(cell);
        el('#game-stage .stage-copy').textContent = `Light ${i + 1} of ${p.seq.length} — watch the glow.`;
      }, 450 + i * pace);
      window.later(() => {
        if (current()) el(`.echo-cell[data-cell="${cell}"]`).classList.remove('lit');
      }, 450 + i * pace + pace * .58);
    });
    window.later(() => {
      if (!current()) return;
      p.phase = 'input'; cells().forEach(tile => { tile.disabled = false; });
      el('#echo-replay').disabled = false; el('#echo-replay').textContent = 'Watch again';
      el('#game-stage .stage-title').textContent = 'Your turn. Make it echo.';
      el('#game-stage .stage-copy').textContent = 'Tap the same tiles in order. Every correct tap fills a step.';
      progress();
    }, 450 + p.seq.length * pace);
  };
  window.patternTap = function (cell) {
    const p = app.pattern;
    if (!p || p.phase !== 'input' || !Number.isInteger(cell) || cell < 0 || cell >= p.size ** 2) return;
    const button = el(`.echo-cell[data-cell="${cell}"]`);
    if (cell !== p.seq[p.index]) {
      p.mistakes++; p.index = 0; p.phase = 'retry';
      button.classList.add('miss'); window.later(() => button.classList.remove('miss'), 500);
      cells().forEach(tile => { tile.disabled = true; });
      el('#game-stage .stage-title').textContent = 'Another go? You have this.';
      el('#game-stage .stage-copy').textContent = 'Replay the same pattern, or switch on slow replay. There is no retry limit.';
      el('#echo-replay').disabled = false; el('#echo-replay').textContent = 'Try again';
      progress(); return;
    }
    tone(cell); button.classList.add('correct'); window.later(() => button.classList.remove('correct'), 300);
    p.index++; progress();
    if (p.index === p.seq.length) {
      p.phase = 'clear'; cells().forEach(tile => { tile.disabled = true; });
      el('#echo-replay').disabled = true;
      window.later(() => { if (app.game === 'pattern' && app.pattern === p && p.phase === 'clear') window.patternClear(); }, 450);
    }
  };
  window.patternClear = function () {
    const p = app.pattern;
    if (p.awarded) return;
    p.awarded = true; p.phase = 'clear';
    const bonus = p.mistakes === 0 && p.replays === 0 ? 50 : 0, points = 100 + p.level * 25 + bonus;
    app.score += points; app.runRounds++;
    const next = window.levelUp('pattern'), final = p.level === 10;
    document.querySelector('#score-value').textContent = app.score;
    document.querySelector('#round-value').textContent = app.runRounds;
    el('#game-stage').innerHTML = `<span class="stage-eyebrow">${final ? 'LADDER COMPLETE' : 'PATTERN COMPLETE'}</span><div class="echo-win-art" aria-hidden="true">✦</div><h2 class="stage-title">${final ? 'Every light. Every level.' : 'You found your rhythm.'}</h2><p class="stage-copy">${p.seq.length} lights recalled in ${p.attempts} ${p.attempts === 1 ? 'attempt' : 'attempts'}. +${points} points${bonus ? ' including a +50 first-try bonus.' : '.'}</p><div class="stage-actions"><button class="stage-button" id="pattern-next">${final ? 'Play another pattern' : `Next level · ${next + 2} lights →`}</button><button class="secondary-button" id="pattern-finish">Finish session</button></div>`;
    el('#pattern-next').addEventListener('click', window.patternStart);
    el('#pattern-finish').addEventListener('click', window.finishSession);
  };
})();
