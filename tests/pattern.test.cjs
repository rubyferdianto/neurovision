const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
let elements = {}, tiles = [], steps = [], pending = [], level = 1, clock = 0;
function element() {
  const names = new Set(), listeners = {};
  return { disabled: false, textContent: '', dataset: {}, attrs: {},
    classList: { add: (...v) => v.forEach(x => names.add(x)), remove: (...v) => v.forEach(x => names.delete(x)), contains: x => names.has(x), toggle: (x, on) => on ? names.add(x) : names.delete(x) },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    click() { if (!this.disabled) listeners.click?.(); }
  };
}
const stage = element();
Object.defineProperty(stage, 'innerHTML', { set(html) {
  elements = { '#game-stage': stage, '#game-stage .stage-title': element(), '#game-stage .stage-copy': element(), '#score-value': element(), '#round-value': element() };
  for (const id of html.matchAll(/id="([^"]+)"/g)) elements['#' + id[1]] = element();
  tiles = [...html.matchAll(/data-cell="(\d+)"/g)].map(m => { const e = element(); e.dataset.cell = m[1]; e.disabled = true; elements[`.echo-cell[data-cell="${m[1]}"]`] = e; return e; });
  steps = [...html.matchAll(/class="echo-step"/g)].map(element);
} });
elements['#game-stage'] = stage;
const dom = { querySelector: s => elements[s], querySelectorAll: s => s === '.echo-cell' ? tiles : s === '.echo-step' ? steps : [] };
const context = {
  console, Math, app: { game: 'pattern', score: 0, runRounds: 0 }, content: dom, document: dom,
  levelOf: () => level, levelUp: () => level = Math.min(10, level + 1),
  clearTimers: () => { pending = []; }, later: (fn, ms) => pending.push({ fn, at: clock + ms }), finishSession: () => {},
};
context.window = context; vm.createContext(context); vm.runInContext(fs.readFileSync('pattern.js', 'utf8'), context);
function flush() { while (pending.length) { pending.sort((a, b) => a.at - b.at); const job = pending.shift(); clock = job.at; job.fn(); } }
context.patternStart();
let p = context.app.pattern, original = [...p.seq];
assert.equal(p.phase, 'watch'); context.patternTap(p.seq[0]); assert.equal(p.index, 0, 'playback cannot accept input');
flush(); assert.equal(p.phase, 'input');
for (let attempt = 0; attempt < 7; attempt++) {
  context.patternTap((p.seq[0] + 1) % 9);
  assert.equal(p.phase, 'retry'); assert.equal(elements['#echo-replay'].textContent, 'Try again');
  assert.ok(tiles.every(t => t.disabled));
  elements['#echo-replay'].click(); flush();
  assert.deepEqual([...p.seq], original, 'unlimited retries preserve the sequence'); assert.equal(p.phase, 'input');
}
assert.equal(p.attempts, 8); assert.equal(p.mistakes, 7);
p.seq.forEach(context.patternTap); assert.equal(p.phase, 'clear'); flush();
assert.equal(context.app.score, 125, 'retry clears award once without first-try bonus');
context.patternClear(); assert.equal(context.app.score, 125); assert.equal(level, 2);
context.patternStart(); p = context.app.pattern; flush(); p.seq.forEach(context.patternTap); flush();
assert.equal(context.app.score, 325, 'first-try clear receives 50 bonus'); assert.equal(context.app.runRounds, 2);
context.patternStart(); const stale = pending.map(t => t.fn); elements['#echo-new'].click(); p = context.app.pattern;
stale.forEach(fn => fn()); assert.equal(p.phase, 'watch', 'old playback cannot unlock a new board'); assert.ok(tiles.every(t => t.disabled));
flush(); elements['#echo-slow'].click(); assert.equal(p.phase, 'watch'); assert.equal(elements['#echo-slow'].attrs['aria-pressed'], 'true');
assert.ok(Math.max(...pending.map(t => t.at - clock)) >= p.seq.length * 1000); flush();
context.patternPlayback(); const leaving = pending.map(t => t.fn); context.app.game = 'fish'; leaving.forEach(fn => fn()); assert.equal(p.phase, 'watch', 'leaving does not activate detached controls');
level = 10; context.app.game = 'pattern'; context.patternStart(); p = context.app.pattern;
assert.equal(p.size, 4); assert.equal(p.seq.length, 12); assert.ok(p.seq.every((x, i) => x >= 0 && x < 16 && x !== p.seq[i - 1]));
flush(); p.seq.forEach(context.patternTap); flush(); assert.equal(level, 10, 'final level stays replayable');
console.log('PASS: unlimited retries, retained sequence, delayed playback guards, slow replay, input gating, first-try rewards, single award, and all 10 levels.');
