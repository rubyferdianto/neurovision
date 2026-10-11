const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const catalog=JSON.parse(fs.readFileSync('assets/objects/catalog.json','utf8'));
assert.equal(catalog.length,48);assert.equal(new Set(catalog.map(x=>x.id)).size,48);
for(const item of catalog){
 const model=JSON.parse(fs.readFileSync(item.model,'utf8')),folder=path.dirname(item.model);
 assert.ok(model.meshes.length>0,item.id+' has real geometry');
 assert.ok(model.materials.some(m=>m.pbrMetallicRoughness?.baseColorTexture),item.id+' has surface textures');
 assert.ok(!model.extensionsRequired?.length,item.id+' requires no unbundled decoder');
 for(const entry of [...model.buffers,...model.images]){
  const file=path.resolve(folder,entry.uri);assert.ok(file.startsWith(path.resolve(folder)+path.sep));assert.ok(fs.statSync(file).size>0,file);
  if(entry.byteLength)assert.equal(fs.statSync(file).size,entry.byteLength,'geometry buffer is complete');
 }
 for(const mesh of model.meshes)for(const primitive of mesh.primitives){const position=model.accessors[primitive.attributes.POSITION];assert.ok(position.count>3);assert.ok([...position.min,...position.max].every(Number.isFinite));}
}
// Parse classic extensions as classic scripts (levels.js predates ES modules).
new vm.Script(fs.readFileSync('levels.js','utf8'));
function create(saved={}){
 const elements={},timers=new Map();let timer=0,clock=1000;
 const element=id=>elements[id]||= {textContent:'',innerHTML:'',style:{},disabled:true,dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}};
 const dom={querySelector:element,querySelectorAll:()=>[element('controls')]};
 const context={console,Math,Set,Date:{now:()=>clock},REAL_OBJECTS:catalog,app:{game:'guess',score:0,runRounds:0},data:{levels:{guess:1},...saved},games:{guess:{}},content:dom,document:dom,save:()=>{},renderHome:()=>{},clearTimers:()=>{},setInterval:fn=>{timers.set(++timer,fn);return timer},clearInterval:id=>timers.delete(id),esc:s=>s,finishSession:()=>{}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync('guess.js','utf8'),context);
 return {context,elements,timers,advance(ms){clock+=ms;for(const fn of timers.values())fn()}};
}
const {context:c,elements,timers,advance}=create(),rules=c.NeuroGuessRules;
const history=new Set();let previousTier=1;
for(let i=0;i<48;i++){
 const item=rules.pickNext(catalog,history,()=>.5);assert.ok(!history.has(item.id));assert.ok(item.tier>=previousTier);previousTier=item.tier;history.add(item.id);
 const choices=rules.choicesFor(item,i+1);assert.ok(choices.includes(item.label));assert.equal(new Set(choices).size,choices.length);assert.equal(choices.length,rules.difficulty(i+1).choices);
}
assert.equal(rules.pickNext(catalog,history),null,'collection never silently recycles');
assert.ok(rules.difficulty(48).duration<rules.difficulty(11).duration);assert.ok(rules.difficulty(48).blur>rules.difficulty(11).blur);
c.guessBegin();let g=c.app.guess;
assert.equal(g.phase,'loading');assert.equal(timers.size,0);assert.equal(c.data.guessSeen.length,0);
c.guessModelFailed(g);assert.equal(g.phase,'error');assert.equal(c.data.guessSeen.length,0,'failed model does not consume an object');
elements['#guess-retry'].listeners.click();g=c.app.guess;assert.equal(g.phase,'loading');c.guessModelReady(g);
assert.equal(g.phase,'active');assert.equal(c.data.guessSeen.length,1);assert.equal(timers.size,1);
const firstId=g.item.id;advance(2000);c.guessAnswer(g.item.aliases[0]);assert.equal(g.phase,'done');assert.ok(c.app.score>0);assert.equal(timers.size,0);
const score=c.app.score;c.guessFinish(true,false);assert.equal(c.app.score,score,'single award');
const restored=create(JSON.parse(JSON.stringify(c.data))).context;restored.guessBegin();assert.notEqual(restored.app.guess.item.id,firstId,'saved objects do not repeat after reload');
for(let i=1;i<48;i++){
 c.guessBegin();g=c.app.guess;assert.equal(g.level,i+1);assert.ok(!c.data.guessSeen.includes(g.item.id));
 c.guessModelReady(g);advance(g.duration+1);assert.equal(g.phase,'done','timeouts advance without recycling the object');
}
assert.equal(c.data.guessSeen.length,48);assert.equal(new Set(c.data.guessSeen).size,48);assert.equal(c.data.levels.guess,48);
c.guessBegin();assert.equal(c.app.guess.phase,'complete');assert.equal(timers.size,0);
const fresh=create().context;fresh.guessBegin();const stale=fresh.app.guess;fresh.guessBegin();fresh.guessModelReady(stale);assert.equal(fresh.data.guessSeen.length,0,'stale async load is ignored');
fresh.app.game='fish';fresh.guessModelReady(fresh.app.guess);assert.equal(fresh.data.guessSeen.length,0,'leaving during loading is safe');
console.log('PASS: 48 complete textured models, no repeats across reloads, no automatic recycling, progression beyond level 10, difficulty, aliases, loading failures, stale callbacks, timeouts, and single scoring.');
