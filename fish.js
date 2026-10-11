/* Tide Eater: a small canvas game that plugs into the existing game registry. */
games.fish={title:"Tide Eater",subtitle:"Swim right, eat smaller fish, and dodge reef danger.",tag:"SURVIVAL",icon:"◉",length:"3–6 min / level",benefit:"Judge size, timing, and safe routes"};
data.levels ||= {};data.levels.fish ||= 1;data.best ||= {};

const fishGameStartBefore=window.startGame;
const fishGameSetPageBefore=window.setPage;
let fishKeyHandler=null;

function stopFishGame(){
  const game=app.fish;
  if(game?.raf)cancelAnimationFrame(game.raf);
  if(game?.resizeHandler)window.removeEventListener("resize",game.resizeHandler);
  if(game)game.active=false;
  if(fishKeyHandler){document.removeEventListener("keydown",fishKeyHandler);fishKeyHandler=null}
}

function fishCardArt(){return `<div class="card-art fish-art"><span class="fish-art-glow"></span><span class="fish-art-bubble b1"></span><span class="fish-art-bubble b2"></span><span class="fish-art-fish">◉</span><span class="fish-art-tail">◀</span><span class="fish-art-label">TIDE / 01</span></div>`}
const cardArtBeforeFish=window.cardArt;
window.cardArt=function(id){return id==="fish"?fishCardArt():cardArtBeforeFish(id)};

function fishLevelDuration(level){return 180+(Math.max(1,Math.min(10,level))-1)*20}
function fishLevelDistance(level){return (145+level*8)*fishLevelDuration(level)}
function resetFishSession(){
  const level=app.fish?.level||Math.max(1,Number(data.levels.fish)||1);
  stopFishGame();window.clearTimers();app.score=0;app.runRounds=0;app.xpAwarded=false;
  startFishLevel(level);
}

function fishIntro(){
  const level=Math.max(1,Number(data.levels.fish)||1);
  content.innerHTML=window.gameFrame("fish",`<span class="stage-eyebrow">LEVEL ${String(level).padStart(2,"0")} · REEF RUN</span><h2 class="stage-title">Eat small. Stay sharp.</h2><p class="stage-copy">Your fish swims forward automatically. Eat four smaller fish to grow, steer around reef hazards, and avoid larger predators. A predator bite resets your size. Watch the warning lane: barracudas, sharks, and whales approach from either side. Dodge them for bonus points.</p><div class="level-detail"><span>STEER <b>Pointer or arrow keys</b></span><span>GROWTH <b>Every 4 smaller fish</b></span><span>LEVEL LENGTH <b>${Math.floor(fishLevelDuration(level)/60)}m ${fishLevelDuration(level)%60}s</b></span></div><div class="level-track">${Array.from({length:10},(_,i)=>`<i class="${i<level?"done":""}"></i>`).join("")}</div><button class="stage-button" id="fish-start">Dive in&nbsp; →</button>`);
  const leave=content.querySelector("[data-home]");
  leave.insertAdjacentHTML("beforebegin",'<button class="back-button" id="fish-reset" title="Restart this level with a fresh score, size, and hearts">↻ Reset session</button>');
  content.querySelector("#fish-reset").addEventListener("click",resetFishSession);
  window.bindHomeButton();content.querySelector("#fish-start").addEventListener("click",()=>startFishLevel(level));
}

function startFishLevel(level){
  stopFishGame();
  const stage=content.querySelector("#game-stage");
  stage.innerHTML=`<div class="fish-hud"><span>GROWTH <b id="fish-size">100%</b></span><span>NEXT GROWTH <b id="fish-meals">0 / 4</b></span><span>FISH EATEN <b id="fish-eaten">0</b></span><span>REEF <b id="fish-hearts">♥ ♥ ♥</b></span><span>DISTANCE <b id="fish-distance">0 m</b></span><span>TIME LEFT <b id="fish-time"></b></span></div><canvas class="fish-canvas" id="fish-canvas" aria-label="Tide Eater game. Steer your fish around the reef and eat smaller fish."></canvas><div class="fish-controls">Move your pointer or drag to steer · ↑ ↓ or W S also work <span>Red lane = incoming monster · leave the lane to dodge</span></div>`;
  const canvas=stage.querySelector("#fish-canvas"),ctx=canvas.getContext("2d"),rect=canvas.getBoundingClientRect(),ratio=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));ctx.setTransform(ratio,0,0,ratio,0,0);
  const width=rect.width,height=rect.height,baseSize=Math.max(23,Math.min(28,height*.06));
  const game={active:true,level,width,height,ctx,canvas,player:{y:height*.5,targetY:height*.5,size:baseSize,drawSize:baseSize,baseSize,flash:0,bite:0,meals:0,pendingGrowth:0},fish:[],effects:[],bubbles:Array.from({length:28},()=>({x:Math.random()*width,y:Math.random()*height,r:1+Math.random()*4,s:.12+Math.random()*.3})),hearts:3,eaten:0,distance:0,score:app.score||0,targetDistance:fishLevelDistance(level),lastFrame:0,spawnIn:.3,hudTime:0,status:"",statusTime:0,raf:0,ambushIn:8,ambush:null,dodges:0};
  app.fish=game;
  for(let i=0;i<4;i++)addFishTarget(game,true,i);
  game.resizeHandler=()=>{const box=canvas.getBoundingClientRect(),scale=Math.min(2,window.devicePixelRatio||1);game.width=box.width;game.height=box.height;canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));ctx.setTransform(scale,0,0,scale,0,0);game.player.targetY=Math.max(42,Math.min(game.height-42,game.player.targetY));game.player.y=Math.max(42,Math.min(game.height-42,game.player.y))};
  window.addEventListener("resize",game.resizeHandler);
  const steer=e=>{const box=canvas.getBoundingClientRect();game.player.targetY=Math.max(42,Math.min(game.height-42,e.clientY-box.top))};
  canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture?.(e.pointerId);steer(e)});canvas.addEventListener("pointermove",e=>{if(e.pointerType!=="touch"||e.buttons)steer(e)});
  fishKeyHandler=e=>{if(!game.active)return;const key=e.key.toLowerCase();if(["arrowup","arrowdown","w","s"].includes(key)){e.preventDefault();game.player.targetY=Math.max(42,Math.min(game.height-42,game.player.targetY+(["arrowup","w"].includes(key)?-48:48)))}};
  document.addEventListener("keydown",fishKeyHandler);
  updateFishHud(game);
  game.raf=requestAnimationFrame(time=>fishFrame(game,time));
}

function addFishTarget(game,starter=false,index=0){
  const roll=starter?0:Math.random(),y=starter?game.height*.5+Math.sin(index)*30:65+Math.random()*(game.height-130),x=starter?game.width*.55+index*100:game.width+90+Math.random()*120;
  let target;
  if(roll<.7)target={kind:"fish",r:Math.max(8,game.player.size*(.32+Math.random()*.36)),color:["#ffb85c","#f78578","#a88cf0","#66c9c0","#f2d76b"][Math.floor(Math.random()*5)],x,y,wobble:Math.random()*6};
  else if(roll<.82)target={kind:"predator",r:30+Math.random()*30,color:["#566d9a","#744d7e","#42596d"][Math.floor(Math.random()*3)],x,y,wobble:Math.random()*6};
  else if(roll<.92)target={kind:"immune",r:12+Math.random()*15,color:"#7fd9d0",x,y,wobble:Math.random()*6,cooldown:0};
  else target={kind:"hazard",type:"jelly",r:20+Math.random()*15,color:"#e66e72",x,y,wobble:Math.random()*6};
  target.species=Math.floor(Math.random()*reefSpecies.length);target.homeY=y;target.phase=Math.random()*Math.PI*2;target.cruise=.85+Math.random()*.3;target.tilt=0;
  game.fish.push(target);
}

function drawHazard(ctx,target){drawJellyfish(ctx,target.x,target.y,target.r,(target.clock||0)/1000)}

function fishFrame(game,time){
  if(!game.active||app.fish!==game)return;
  const dt=Math.min(.04,Math.max(0,(time-game.lastFrame)/1000||.016));game.lastFrame=time;
  const speed=145+game.level*8,player=game.player;const previousY=player.y;game.distance+=speed*dt;player.y+=(player.targetY-player.y)*Math.min(1,dt*4.5);player.flash=Math.max(0,player.flash-dt);player.bite=Math.max(0,player.bite-dt);if(player.bite===0&&player.pendingGrowth>0){player.size=Math.min(82,player.size+player.pendingGrowth);player.pendingGrowth=0;game.status="Meal finished — growing!";game.statusTime=1.4}
  player.drawSize+=(player.size-player.drawSize)*Math.min(1,dt*2.5);game.statusTime=Math.max(0,game.statusTime-dt);
  game.spawnIn-=dt;if(game.spawnIn<=0){addFishTarget(game);game.spawnIn=Math.max(.58,1.32-game.level*.045)+Math.random()*.42}
  for(const b of game.bubbles){b.x-=speed*dt*b.s;b.y-=b.s*9*dt;if(b.x<-6)b.x=game.width+6;if(b.y<-5)b.y=game.height+5}
  for(let i=game.fish.length-1;i>=0;i--){
    const target=game.fish[i],oldY=target.y,alive=target.kind!=="hazard";
    target.clock=time;target.x-=speed*dt*(alive?target.cruise*(target.kind==="predator"?1.18:1):1);
    if(alive){
      const near=target.x-game.width*.27,escape=target.r<player.size*.95&&near>0&&near<140&&Math.abs(target.y-player.y)<70;
      const desired=target.homeY+Math.sin(time/1100+target.phase)*14+(escape?(target.y<player.y?-10:10):0);
      target.y+=(Math.max(48,Math.min(game.height-55,desired))-target.y)*dt*2;
      target.tilt=Math.max(-.24,Math.min(.24,-(target.y-oldY)/Math.max(dt,.001)/speed));target.effort=escape?1.6:1;
    }
    if(target.cooldown>0)target.cooldown-=dt;if(target.x<-110)game.fish.splice(i,1);
  }
  updateFishAmbush(game,dt);
  if(!game.active)return;
  checkFishCollisions(game);
  if(!game.active)return;
  if(!window.Neuro3D?.isFishActive(game)){
  const ctx=game.ctx,w=game.width,h=game.height;drawOcean(game,time);
  game.fish.forEach(target=>{
    if(target.kind==="hazard")drawHazard(ctx,target);
    else drawLivingFish(ctx,target.x,target.y,target.r,{time:time/1000,phase:target.phase,species:target.species,flip:true,shield:target.kind==="immune",predator:target.kind==="predator",tilt:target.tilt,effort:target.effort});
    if(target.kind==="immune"){ctx.fillStyle="#eafffa";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText("✦",target.x,target.y-target.r*1.7)}
  });
  const tilt=Math.max(-.3,Math.min(.3,(player.y-previousY)/Math.max(dt,.001)/speed));
  drawFeedingEffects(game,dt);
  drawLivingFish(ctx,w*.27+Math.sin(player.bite/.38*Math.PI)*6,player.y,player.drawSize,{time:time/1000,species:0,tilt,flash:player.flash,effort:1+Math.abs(tilt),bite:player.bite,hero:true});
  drawFishAmbush(game,time);
  if(game.statusTime>0){ctx.fillStyle="#ffffff";ctx.font="600 14px sans-serif";ctx.textAlign="center";ctx.shadowColor="#082335";ctx.shadowBlur=9;ctx.fillText(game.status,w*.5,30);ctx.shadowBlur=0}
  }
  game.hudTime+=dt;if(game.hudTime>.12){game.hudTime=0;updateFishHud(game)}
  if(game.distance>=game.targetDistance){finishFishLevel(game);return}
  game.raf=requestAnimationFrame(t=>fishFrame(game,t));
}

function checkFishCollisions(game){
  const p=game.player,px=game.width*.27;
  for(let i=game.fish.length-1;i>=0;i--){const target=game.fish[i],dx=target.x-px,dy=target.y-p.y,edible=target.kind!=="hazard"&&target.kind!=="immune"&&target.r<p.size*.95,reachX=p.size*(edible?1.4:.85)+target.r*.85,reachY=p.size*.55+target.r*.55;if((dx*dx)/(reachX*reachX)+(dy*dy)/(reachY*reachY)>1)continue;
    if(target.kind==="hazard"){
      game.fish.splice(i,1);game.hearts--;p.size=p.baseSize;p.meals=0;p.pendingGrowth=0;p.flash=.55;game.status=game.hearts?"Reef hit — size reset. Watch for the next obstacle!":"The reef run is over.";game.statusTime=2;
      if(game.hearts<=0){finishFishGame(game,false);return}
    }else if(target.kind==="immune"){
      if(target.cooldown<=0){target.cooldown=1.5;target.x+=55;p.targetY=Math.max(45,Math.min(game.height-45,p.y+(dy<=0?46:-46)));game.status="Shielded fish are immune — steer around them.";game.statusTime=1.4}
    }else if(edible){
      game.fish.splice(i,1);game.eaten++;game.score+=25+Math.round(target.r);p.bite=.38;
      p.meals++;const ready=p.meals>=4;
      if(ready){p.meals=0;if(p.size<82)p.pendingGrowth+=Math.max(4,p.baseSize*.18)}
      const label=p.size>=82?"Full size":ready?"Meal complete":`${p.meals} / 4 eaten`;
      game.effects.push({x:target.x,y:target.y,r:target.r,species:target.species,age:0,label});
      game.status=p.size>=82?"Caught! Maximum size reached.":ready?"Swallowing — growth coming next.":`Caught! ${p.meals} / 4 fish toward your next growth.`;
      game.statusTime=1.4;updateFishHud(game);
    }else if(target.r>p.size*1.12){
      game.fish.splice(i,1);p.size=p.baseSize;p.meals=0;p.pendingGrowth=0;p.flash=.65;game.status="A bigger fish got you — back to your original size!";game.statusTime=2;
    }else{
      target.x+=20;p.targetY=Math.max(45,Math.min(game.height-45,p.y+(dy<=0?24:-24)));game.status="Too close in size — look for a smaller fish.";game.statusTime=1;
    }
  }
}

function updateFishHud(game){
  const size=content.querySelector("#fish-size"),eaten=content.querySelector("#fish-eaten"),hearts=content.querySelector("#fish-hearts"),distance=content.querySelector("#fish-distance");
  if(size)size.textContent=`${Math.round(game.player.size/game.player.baseSize*100)}%`;if(eaten)eaten.textContent=game.eaten;if(hearts)hearts.textContent=`${"♥ ".repeat(game.hearts)}${"♡ ".repeat(3-game.hearts)}`.trim();if(distance)distance.textContent=`${Math.floor(game.distance/10)} m`;
  const meals=content.querySelector("#fish-meals");if(meals)meals.textContent=game.player.size>=82?"MAX":game.player.pendingGrowth>0?"Digesting…":`${game.player.meals} / 4`;
  const timer=content.querySelector("#fish-time"),remaining=Math.max(0,Math.ceil((game.targetDistance-game.distance)/(145+game.level*8)));
  if(timer)timer.textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`;
  const score=document.querySelector("#score-value"),round=document.querySelector("#round-value");if(score)score.textContent=game.score+Math.floor(game.distance/35);if(round)round.textContent=app.runRounds+game.eaten+1;
}

function finishFishLevel(game){
  stopFishGame();const distance=Math.floor(game.distance/10),bonus=200;game.score+=bonus;app.score=game.score+Math.floor(game.distance/35);app.runRounds+=game.eaten;const next=window.levelUp("fish");
  document.querySelector("#score-value").textContent=app.score;document.querySelector("#round-value").textContent=app.runRounds+1;
  content.querySelector("#game-stage").innerHTML=`<span class="stage-eyebrow">REEF RUN CLEARED</span><h2 class="stage-title">You made it through the current.</h2><p class="stage-copy">${distance} m · ${game.eaten} fish eaten · +${bonus} level bonus. Your fish made it through level ${game.level}.</p><div class="level-detail"><span>GROWTH <b>${Math.round(game.player.size/game.player.baseSize*100)}%</b></span><span>REEF <b>${game.hearts} hearts left</b></span><span>NEXT <b>${game.level===10?"Free swim":"Level "+String(next).padStart(2,"0")}</b></span></div><div class="stage-actions"><button class="stage-button" id="fish-next">${game.level===10?"Swim level 10 again":"Next level →"}</button><button class="secondary-button" id="fish-finish">Finish session</button></div>`;
  content.querySelector("#fish-next").addEventListener("click",()=>startFishLevel(next));content.querySelector("#fish-finish").addEventListener("click",()=>window.finishSession());
}

function finishFishGame(game,cleared){
  stopFishGame();const distance=Math.floor(game.distance/10);app.score=game.score+Math.floor(game.distance/35);app.runRounds+=game.eaten;document.querySelector("#score-value").textContent=app.score;document.querySelector("#round-value").textContent=app.runRounds+1;
  content.querySelector("#game-stage").innerHTML=`<span class="stage-eyebrow">${cleared?"REEF RUN CLEARED":"REEF RUN OVER"}</span><h2 class="stage-title">${cleared?"You made it through the current.":"The reef got the better of you."}</h2><p class="stage-copy">${distance} m · ${game.eaten} fish eaten · Your size resets when a reef obstacle hits. Try another swim.</p><div class="stage-actions"><button class="stage-button" id="fish-retry">Swim again&nbsp; →</button><button class="secondary-button" id="fish-finish">Finish session</button></div>`;
  content.querySelector("#fish-retry").addEventListener("click",()=>startFishLevel(game.level));content.querySelector("#fish-finish").addEventListener("click",()=>window.finishSession());
}

window.startGame=function(id){
  stopFishGame();if(id!=="fish")return fishGameStartBefore(id);
  window.clearTimers();app.xpAwarded=false;app.fish=null;app.gameId="fish";app.score=0;app.runRounds=0;app.game=id;
  document.querySelectorAll(".nav-link").forEach(link=>link.classList.toggle("active",link.dataset.nav==="games"));document.querySelector("#breadcrumb-current").textContent=games[id].title;fishIntro();window.scrollTo({top:0,behavior:"smooth"});
};
window.setPage=function(page){stopFishGame();return fishGameSetPageBefore(page)};

window.renderHome();
const navCount=document.querySelector('.nav-link[data-nav="games"] .nav-count');if(navCount)navCount.textContent=String(Object.keys(games).length);
const homeBlurb=content.querySelector("#games .section-head p");if(homeBlurb)homeBlurb.textContent="Five challenges. One curious mind.";


const fishMonsterTypes={
  barracuda:{name:'Barracuda',radius:86,height:.17,speed:1,warning:0,body:.36,bonus:150},
  shark:{name:'Great white shark',radius:100,height:.20,speed:1.2,warning:.15,body:.43,bonus:200},
  whale:{name:'Humpback whale',radius:138,height:.27,speed:.65,warning:.6,body:.48,bonus:250}
};
function beginFishAmbush(game){
  // Shuffle without replacement so every three encounters include all three creatures.
  if(!game.monsterBag?.length){
    game.monsterBag=Object.keys(fishMonsterTypes);
    for(let i=game.monsterBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[game.monsterBag[i],game.monsterBag[j]]=[game.monsterBag[j],game.monsterBag[i]]}
  }
  const type=game.monsterBag.pop(),spec=fishMonsterTypes[type],side=Math.random()<.5?-1:1,r=Math.min(spec.radius,game.height*spec.height),margin=r*2+30;
  game.ambush={type,phase:'warning',timer:Math.max(1.35,2-game.level*.055)+spec.warning,y:game.player.y,side,r,x:side===1?game.width+margin:-margin,hit:false};
}

function updateFishAmbush(game,dt){
  game.ambushIn??=8;game.dodges??=0;
  if(!game.ambush){game.ambushIn-=dt;if(game.ambushIn<=0)beginFishAmbush(game);return}
  const a=game.ambush,spec=fishMonsterTypes[a.type]||fishMonsterTypes.barracuda;
  if(a.phase==='warning'){
    a.timer-=dt;
    if(a.timer<=0)a.phase='charge';
    return; // The lane locks when the warning begins; it never tracks the player.
  }
  const oldX=a.x,speed=(Math.max(430,game.width*.85)+game.level*13)*spec.speed;
  a.x-=a.side*speed*dt;
  const p=game.player,px=game.width*.27,reachX=a.r*1.3+p.size*.85,reachY=a.r*spec.body+p.size*.5;
  // Swept horizontal contact prevents fast charges skipping over the player.
  if(!a.hit&&px>=Math.min(oldX,a.x)-reachX&&px<=Math.max(oldX,a.x)+reachX&&Math.abs(p.y-a.y)<reachY){
    a.hit=true;game.hearts--;p.size=p.baseSize;p.meals=0;p.pendingGrowth=0;p.flash=1;
    game.status=spec.name+' strike! One heart lost.';game.statusTime=2;
    if(game.hearts<=0){finishFishGame(game,false);return}
  }
  if((a.side===1&&a.x<-(a.r*2+30))||(a.side===-1&&a.x>game.width+a.r*2+30)){
    if(!a.hit){game.dodges++;game.score+=spec.bonus;game.status=spec.name+' dodged! +'+spec.bonus;game.statusTime=2}
    game.ambush=null;game.ambushIn=Math.max(6,13-game.level*.6)+Math.random()*5;
  }
}

function drawFishAmbush(game,time){
  const a=game.ambush;if(!a)return;
  const spec=fishMonsterTypes[a.type]||fishMonsterTypes.barracuda;
  const ctx=game.ctx,w=game.width;
  ctx.save();
  if(a.phase==='warning'){
    const half=a.r*spec.body+game.player.size*.5;
    ctx.fillStyle=`rgba(226,71,48,${.10+.05*Math.sin(time/120)})`;ctx.fillRect(0,a.y-half,w,half*2);
    ctx.strokeStyle='#ffd49cbb';ctx.lineWidth=1;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(0,a.y-half);ctx.lineTo(w,a.y-half);ctx.moveTo(0,a.y+half);ctx.lineTo(w,a.y+half);ctx.stroke();ctx.setLineDash([]);
    ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0d7';ctx.shadowColor='#341a12';ctx.shadowBlur=5;
    ctx.fillText(spec.name.toUpperCase()+(a.side===1?' FROM RIGHT — DODGE':' FROM LEFT — DODGE'),w*.5,Math.max(55,a.y-half-12));
    ctx.textAlign=a.side===1?'right':'left';ctx.font='bold 24px sans-serif';ctx.fillText(a.side===1?'◀ !':'! ▶',a.side===1?w-12:12,a.y+8);
  }else{
    drawLivingFish(ctx,a.x,a.y,a.r,{time:time/1000,flip:a.side===1,monster:true,monsterType:a.type||"barracuda",effort:a.type==="whale"?.45:1.8});
  }
  ctx.restore();
}

window.neuroMonsterSpec=type=>fishMonsterTypes[type]||fishMonsterTypes.barracuda;
