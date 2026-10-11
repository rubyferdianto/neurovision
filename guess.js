/* Real-object campaign: each asset is shown once per saved collection. */
(() => {
  const catalog = window.REAL_OBJECTS;
  const normalize = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const seen = () => new Set((data.guessSeen || []).filter(id => catalog.some(item => item.id === id)));
  function difficulty(level) {
    return { duration: Math.max(4500, 12000 - (level - 1) * 160), blur: Math.min(50, 30 + (level - 1) * .45), choices: level <= 8 ? 3 : level <= 16 ? 4 : level <= 32 ? 5 : 6 };
  }
  function pickNext(items, history, random = Math.random) {
    const remaining = items.filter(item => !history.has(item.id));
    if (!remaining.length) return null;
    const tier = Math.min(...remaining.map(item => item.tier));
    const pool = remaining.filter(item => item.tier === tier);
    return pool[Math.floor(random() * pool.length)];
  }
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  const foils = {
    food: ['Peach', 'Pear', 'Lime', 'Mango', 'Garlic', 'Potato'], sport: ['Tennis ball', 'Cricket ball', 'Volleyball', 'Rugby ball', 'Basketball'],
    kitchen: ['Teapot', 'Saucepan', 'Ladle', 'Measuring cup', 'Colander'], electronics: ['Radio', 'Speaker', 'Video camera', 'Remote control', 'Sound recorder'],
    tools: ['Pipe wrench', 'Wire cutters', 'Ratchet', 'Chisel', 'Socket wrench', 'Clamp'], optics: ['Telescope', 'Monocular', 'Kaleidoscope', 'Periscope'],
    instruments: ['Barometer', 'Ammeter', 'Gyroscope', 'Pressure gauge', 'Sextant'], time: ['Stopwatch', 'Wristwatch', 'Timer', 'Sundial'],
    household: ['Oil lamp', 'Waste basket', 'Flowerpot', 'Bucket', 'Candle holder'], clothing: ['Helmet', 'Shoes', 'Cap', 'Gloves'],
    garden: ['Spray bottle', 'Hose reel', 'Plant mister', 'Sprinkler'], travel: ['Backpack', 'Briefcase', 'Tool case', 'Sleeping bag'],
    office: ['Hole punch', 'Tape dispenser', 'Paper clip', 'Pencil sharpener'], music: ['Mandolin', 'Guitar', 'Banjo', 'Lute'], games: ['Draughts set', 'Backgammon set', 'Dominoes', 'Mahjong set']
  };
  function choicesFor(item, level) {
    const count = difficulty(level).choices;
    const similar = shuffle([...catalog.filter(x => x.category === item.category && x.id !== item.id).map(x => x.label), ...(foils[item.category] || [])]);
    const other = shuffle(catalog.filter(x => x.id !== item.id && x.category !== item.category).map(x => x.label));
    const candidates = level > 16 ? [...similar, ...other] : [...similar.slice(0, 1), ...other, ...similar];
    const options = [...new Set(candidates)].filter(label => ![item.label, ...item.aliases].map(normalize).includes(normalize(label)));
    return shuffle([item.label, ...options.slice(0, count - 1)]);
  }
  window.NeuroGuessRules = { difficulty, pickNext, choicesFor, normalize };
  const el = selector => content.querySelector(selector);
  const syncProgress = () => { data.guessSeen = [...seen()]; data.levels.guess = Math.min(catalog.length, data.guessSeen.length + 1); };
  syncProgress();
  games.guess.subtitle = 'Recognize real objects. Discover a new one every round.';
  function complete() {
    app.guess = { phase: 'complete' };
    el('#game-stage').innerHTML = `<span class="stage-eyebrow">COLLECTION COMPLETE</span><h2 class="stage-title">Every object discovered.</h2><p class="stage-copy">You have seen all ${catalog.length} unique objects. This collection will not repeat.</p><button class="stage-button" id="guess-finish">Finish session</button>`;
    el('#guess-finish').addEventListener('click', window.finishSession);
  }
  window.guessIntro = function () {
    syncProgress(); const level = levelOf('guess'), settings = difficulty(level);
    content.innerHTML = window.gameFrame('guess', `<span class="stage-eyebrow">THE REAL OBJECT COLLECTION</span><h2 class="stage-title">Look closer. Think faster.</h2><p class="stage-copy">${catalog.length} realistic, textured 3D objects. Each appears once.<br>Later levels reveal faster and use more closely matched choices.</p><div class="level-detail"><span>DISCOVERED <b>${seen().size} / ${catalog.length}</b></span><span>REVEAL <b>${(settings.duration / 1000).toFixed(1)}s</b></span><span>CHOICES <b>${settings.choices}</b></span></div><button class="stage-button" id="guess-start">Continue to level ${level} →</button><p class="guess-asset-credit">Realistic models from <a href="https://polyhaven.com" target="_blank" rel="noopener">Poly Haven</a> · CC0</p>`);
    window.bindHomeButton();
    if (seen().size === catalog.length) complete();
    else el('#guess-start').addEventListener('click', window.guessBegin);
  };
  function renderRound(g) {
    el('#game-stage').innerHTML = `<span class="stage-eyebrow">LEVEL ${g.level} / ${catalog.length} · ${g.level <= 16 ? 'FAMILIAR FORMS' : g.level <= 32 ? 'LOOK CLOSER' : 'EXPERT DETAILS'}</span><h2 class="stage-title">What do you see?</h2><p class="stage-copy" id="guess-load-status" role="status">Loading the next real object. Your timer starts when it is ready.</p><div class="guess-card"><div class="guess-progress"><i id="guess-progress"></i></div><div class="guess-object real-object" id="guess-object" aria-label="Mystery object loading"></div><div class="guess-input-row"><input class="guess-input" id="guess-input" placeholder="Name the object…" aria-label="Your guess" autocomplete="off" disabled><button class="guess-submit" id="guess-submit" disabled>Guess →</button></div><div class="guess-choices">${g.choices.map(choice => `<button class="guess-choice" data-guess="${esc(choice)}" disabled>${esc(choice)}</button>`).join('')}</div><div class="round-result" id="guess-result" aria-live="polite"></div></div><div class="stage-actions"><button class="secondary-button" id="guess-skip" disabled>Reveal answer</button></div><p class="guess-asset-credit">Realistic models from <a href="https://polyhaven.com" target="_blank" rel="noopener">Poly Haven</a> · CC0</p>`;
    el('#guess-submit').addEventListener('click', () => window.guessAnswer(el('#guess-input').value));
    el('#guess-input').addEventListener('keydown', e => { if (e.key === 'Enter') window.guessAnswer(e.target.value); });
    content.querySelectorAll('[data-guess]').forEach(button => button.addEventListener('click', () => window.guessAnswer(button.dataset.guess)));
    el('#guess-skip').addEventListener('click', () => window.guessFinish(false, true));
    document.querySelector('.game-stats .stat-chip b').textContent = `${g.level}/${catalog.length}`;
  }
  window.guessBegin = function () {
    window.clearTimers(); clearInterval(app.guess?.interval); syncProgress();
    const item = pickNext(catalog, seen());
    if (!item) return complete();
    const level = seen().size + 1;
    const g = app.guess = { item, level, ...difficulty(level), phase: 'loading', started: 0, choices: choicesFor(item, level) };
    renderRound(g);
  };
  window.guessModelReady = function (g) {
    if (app.game !== 'guess' || app.guess !== g || g.phase !== 'loading') return;
    const history = seen(); history.add(g.item.id); data.guessSeen = [...history]; data.levels.guess = Math.min(catalog.length,g.level+1); save();
    g.phase = 'active'; g.started = Date.now();
    el('#guess-load-status').textContent = `A new object. ${g.choices.length} choices. Answer before the ${(g.duration / 1000).toFixed(1)}-second reveal ends.`;
    content.querySelectorAll('.guess-choice,#guess-input,#guess-submit,#guess-skip').forEach(button => { button.disabled = false; });
    g.interval = setInterval(() => {
      if (app.guess !== g || app.game !== 'guess' || g.phase !== 'active') return clearInterval(g.interval);
      const progress = Math.min(1, (Date.now() - g.started) / g.duration);
      el('#guess-progress').style.width = `${progress * 100}%`;
      if (progress === 1) window.guessFinish(false, true);
    }, 80);
  };
  window.guessModelFailed = function (g, message = 'The 3D object could not load. Retry this object when your connection is ready.') {
    if (app.game !== 'guess' || app.guess !== g) return;
    clearInterval(g.interval); g.phase = 'error';
    el('#guess-load-status').textContent = message;
    content.querySelectorAll('.guess-choice,#guess-input,#guess-submit,#guess-skip').forEach(button => { button.disabled = true; });
    el('.game-stage .stage-actions').innerHTML = '<button class="stage-button" id="guess-retry">Retry loading</button><button class="secondary-button" id="guess-finish">Finish session</button>';
    el('#guess-retry').addEventListener('click', () => { app.guess = { ...g, phase: 'loading' }; renderRound(app.guess); });
    el('#guess-finish').addEventListener('click', window.finishSession);
  };
  window.guessAnswer = function (value) {
    const g = app.guess; if (!g || g.phase !== 'active' || !value.trim()) return;
    const answer = normalize(value), correct = [g.item.label, ...g.item.aliases].map(normalize).includes(answer);
    window.guessFinish(correct, false);
  };
  window.guessTimeout = () => window.guessFinish(false, true);
  window.guessFinish = function (correct, reveal) {
    const g = app.guess; if (!g || g.phase !== 'active') return;
    clearInterval(g.interval); g.phase = 'done';
    const elapsed = Math.min(g.duration, Date.now() - g.started), points = correct ? Math.max(100, Math.round(1000 * (1 - elapsed / (g.duration * 1.2)))) + g.level * 10 : 0;
    app.score += points; app.runRounds++; syncProgress(); save();
    document.querySelector('#score-value').textContent = app.score;
    document.querySelector('#round-value').textContent = app.runRounds;
    el('#guess-load-status').textContent = 'Study the texture and shape, then continue to a different object.';
    el('#guess-progress').style.width = '100%';
    content.querySelectorAll('.guess-choice,#guess-input,#guess-submit,#guess-skip').forEach(button => { button.disabled = true; });
    el('#guess-result').textContent = correct ? `${g.item.label} — correct in ${(elapsed / 1000).toFixed(1)}s! +${points} points` : `It was ${g.item.label}. ${reveal ? 'Now you can see every detail.' : 'A new object is next.'}`;
    el('.game-stage .stage-actions').innerHTML = `<button class="stage-button" id="guess-next">${seen().size === catalog.length ? 'Complete collection' : 'Next unseen object →'}</button><button class="secondary-button" id="guess-finish">Finish session</button>`;
    el('#guess-next').addEventListener('click', window.guessBegin); el('#guess-finish').addEventListener('click', window.finishSession);
  };
  // Refresh home cards after all classic extensions have installed their overrides.
  if (app.game == null) window.renderHome();
})();
