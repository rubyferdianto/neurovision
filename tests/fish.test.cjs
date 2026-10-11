// Run with node tests/fish.test.cjs. Canvas calls are stubbed; this tests gameplay, not pixels.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const noop=()=>{},gradient={addColorStop:noop};
const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const elements={};const element=id=>elements[id]??={textContent:'',classList:{toggle:noop}};
const s={console,Math,Image:class{complete=true;naturalWidth=1600;naturalHeight=900},Path2D:class{moveTo(){}bezierCurveTo(){}lineTo(){}quadraticCurveTo(){}},games:{},data:{},app:{runRounds:0},window:{renderHome:noop},document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>({getContext:()=>new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)})})},content:{querySelector:element},requestAnimationFrame:()=>1,cancelAnimationFrame:noop,ctx,assert};
vm.createContext(s);vm.runInContext(fs.readFileSync('fish-ocean.js','utf8')+'\n'+fs.readFileSync('fish.js','utf8'),s);
vm.runInContext(`
assert.equal(fishLevelDuration(1),180);assert.equal(fishLevelDuration(10),360);
for(let level=1;level<=10;level++)assert.equal(fishLevelDistance(level)/(145+level*8),180+(level-1)*20);
const originalStart=startFishLevel;let restartedLevel;
startFishLevel=level=>{restartedLevel=level};window.clearTimers=()=>{};
app.fish={level:4,active:true};app.score=900;app.runRounds=12;app.xpAwarded=true;data.levels.fish=7;
resetFishSession();assert.equal(restartedLevel,4);assert.equal(app.score,0);assert.equal(app.runRounds,0);assert.equal(app.xpAwarded,false);assert.equal(app.fish.active,false);assert.equal(data.levels.fish,7);startFishLevel=originalStart;
function setup(width=1000){const g={ctx,width,height:500,distance:0,bubbles:[],fish:[],effects:[],level:1,active:true,player:{y:250,targetY:250,size:28,drawSize:28,baseSize:28,flash:0,bite:0,meals:0,pendingGrowth:0},lastFrame:0,spawnIn:999,hudTime:0,statusTime:0,targetDistance:1e9,hearts:3,score:0,eaten:0};app.fish=g;return g}
let sampled=[];ctx.drawImage=(...args)=>sampled.push(args.slice(1));
const scene=setup();drawOcean(scene,1000);const first=JSON.stringify(sampled);sampled=[];drawOcean(scene,2000);assert.notEqual(JSON.stringify(sampled),first,'reef and fish animate even without camera travel');ctx.drawImage=()=>{};
function target(g,kind,r,x=g.width*.27){return {kind,r,x,y:250,homeY:250,phase:0,cruise:1,species:0,cooldown:0}}
let g=setup();g.fish=[target(g,'fish',12,g.width*.27+40)];checkFishCollisions(g);
assert.equal(g.eaten,1,'mouth contact eats prey');assert.equal(g.fish.length,0);assert.equal(g.player.size,28,'first catch does not grow');assert.equal(g.effects.length,1);assert.ok(g.player.bite>0);assert.equal(content.querySelector('#fish-eaten').textContent,1);
for(let meal=2;meal<=4;meal++){g.fish=[target(g,'fish',12)];checkFishCollisions(g);assert.equal(g.player.size,28,'no growth before swallowing completes')}
assert.ok(g.player.pendingGrowth>0);assert.equal(g.player.meals,0);
for(let i=1;i<120;i++)fishFrame(g,i*16);assert.ok(g.player.drawSize>30.7,'rendered size catches up');assert.equal(g.effects.length,0,'cloud expires');
g=setup();g.fish=[target(g,'immune',10)];checkFishCollisions(g);assert.equal(g.eaten,0);assert.equal(g.fish.length,1);
g=setup();g.player.size=50;g.player.meals=3;g.player.pendingGrowth=5;g.fish=[target(g,'predator',70)];checkFishCollisions(g);assert.equal(g.player.size,28);assert.equal(g.player.meals,0);assert.equal(g.player.pendingGrowth,0);
g=setup();g.fish=[target(g,'hazard',20)];checkFishCollisions(g);assert.equal(g.hearts,2);
g=setup();g.fish=[target(g,'fish',27)];checkFishCollisions(g);assert.equal(g.eaten,0,'similar size cannot be eaten');
g=setup();for(let i=0;i<4;i++)addFishTarget(g,true,i);assert.ok(g.fish.every(f=>f.r<g.player.size*.95),'opening fish all edible');
g=setup();g.ambushIn=0;updateFishAmbush(g,.016);assert.equal(g.ambush.phase,'warning');const lane=g.ambush.y;g.player.y=60;updateFishAmbush(g,.5);assert.equal(g.ambush.y,lane,'warning lane stays locked');assert.equal(g.hearts,3);
for(const side of [-1,1]){
 g=setup();g.ambush={phase:'charge',x:g.width*.27+side*80,y:250,r:80,side,hit:false};
 updateFishAmbush(g,.2);assert.equal(g.hearts,2,'charge hits from either side');updateFishAmbush(g,.016);assert.equal(g.hearts,2,'single heart per attack');
 g.ambush.x=side===1?-250:g.width+250;updateFishAmbush(g,.016);assert.equal(g.score,0,'no dodge reward after hit');assert.equal(g.ambush,null);
 g=setup();g.player.y=50;g.ambush={phase:'charge',x:side===1?-250:g.width+250,y:250,r:80,side,hit:false};updateFishAmbush(g,.016);assert.equal(g.score,150);assert.equal(g.dodges,1);assert.equal(g.ambush,null);assert.ok(g.ambushIn>=6);
}
let rendered=[];ctx.drawImage=(sprite)=>rendered.push(sprite);drawLivingFish(ctx,0,0,28,{hero:true});assert.ok(rendered.every(sprite=>sprite===tunaPhoto||sprite===fishLighting.get(tunaPhoto).canvas),'player uses tuna');rendered=[];drawLivingFish(ctx,0,0,80,{monster:true});assert.ok(rendered.every(sprite=>sprite===monsterPhoto||sprite===fishLighting.get(monsterPhoto).canvas),'monster has distinct sprite');ctx.drawImage=()=>{};
g=setup();const types=new Set();for(let i=0;i<3;i++){beginFishAmbush(g);types.add(g.ambush.type)}assert.equal(types.size,3,'all creatures appear in each shuffled cycle');
for(const type of ['shark','whale']){
 g=setup();g.player.y=50;g.ambush={type,phase:'charge',x:-400,y:250,r:100,side:1,hit:false};updateFishAmbush(g,.016);assert.equal(g.score,fishMonsterTypes[type].bonus);assert.equal(g.ambush,null);
 g=setup();g.ambush={type,phase:'charge',x:270,y:250,r:100,side:1,hit:false};updateFishAmbush(g,.016);assert.equal(g.hearts,2);updateFishAmbush(g,.016);assert.equal(g.hearts,2);
 rendered=[];ctx.drawImage=(sprite)=>rendered.push(sprite);drawLivingFish(ctx,0,0,100,{monster:true,monsterType:type});assert.ok(rendered.every(sprite=>sprite===(type==='shark'?sharkPhoto:whalePhoto)||sprite===fishLighting.get(type==='shark'?sharkPhoto:whalePhoto).canvas));ctx.drawImage=()=>{};
}
for(const width of [360,1120]){g=setup(width);g.spawnIn=0;for(let i=1;i<=1200;i++){g.hearts=3;fishFrame(g,i*16);assert.ok(Number.isFinite(g.player.y+g.player.drawSize));assert.ok(g.effects.length<20)}}
`,s);
console.log('PASS: monster warnings, both charge directions, single-hit damage, dodge rewards, character sprites, level durations, session reset, saved progress preservation, mouth capture, growth animation, effect expiry, immunity, predator reset, jellyfish damage, size threshold, starter prey, and 2,400 simulated frames.');
