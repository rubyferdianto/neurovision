const sharkPhoto=new Image();sharkPhoto.src="assets/shark.png";
const whalePhoto=new Image();whalePhoto.src="assets/whale.png";
const tunaPhoto=new Image();tunaPhoto.src="assets/tuna.png";
const monsterPhoto=new Image();monsterPhoto.src="assets/monster.png";
const reefPhoto=new Image();reefPhoto.src="assets/reef.png";
const snapperPhoto=new Image();snapperPhoto.src="assets/snapper.png";
/* Procedural reef rendering: all animation uses the game's clock. */
const reefSpecies = [
  {back:'#164c60',side:'#56a6b0',belly:'#d2e5d4',fin:'#609c98',depth:.58,pattern:'scales'},
  {back:'#805323',side:'#dbb65d',belly:'#eee1af',fin:'#c89842',depth:.67,pattern:'bars'},
  {back:'#283c64',side:'#708db3',belly:'#d0dfe3',fin:'#597891',depth:.48,pattern:'stripe'},
  {back:'#853f31',side:'#d38365',belly:'#efd0a6',fin:'#b77753',depth:.62,pattern:'scales'},
  {back:'#344940',side:'#8aab89',belly:'#e0dfbd',fin:'#849a69',depth:.76,pattern:'bars'}
];

function drawLivingFish(ctx,x,y,r,options={}){
  const {time=0,phase=0,flip=false,shield=false,tilt=0,predator=false,flash=0,species=0,effort=1,bite=0,hero=false,monster=false,monsterType="barracuda"}=options;
  const palette=reefSpecies[species%reefSpecies.length],d=predator?.43:palette.depth;
  const beat=Math.sin(time*(predator?7:10)*effort+phase),tail=beat*.17;
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);if(flip)ctx.scale(-1,1);ctx.scale(r,r);
  const sprite=hero?tunaPhoto:monster?(monsterType==="shark"?sharkPhoto:monsterType==="whale"?whalePhoto:monsterPhoto):snapperPhoto;
  if(sprite.complete&&sprite.naturalWidth){
    const iw=sprite.naturalWidth,ih=sprite.naturalHeight;
    ctx.filter=species?`hue-rotate(${[0,32,175,-30,65][species%5]}deg) saturate(.85)`:'none';
    // A continuous traveling wave bends the rear body and tail, with a stable head.
    for(let strip=0;strip<28;strip++){
      const u=strip/28,sx=iw*u,sw=Math.min(iw-sx,iw/28+1),bend=Math.pow(1-u,2)*Math.sin(time*10*effort+phase-u*4)*(monsterType==="whale"&&monster?.16:.3);
      ctx.drawImage(sprite,sx,0,sw,ih,-1.9+u*3.2,-.79+bend,3.2/28+.006,(monster?(monsterType==="barracuda"?1.05:1.4):1.6)*(predator?.83:1)*(1+Math.sin(time*5+phase)*.012+Math.max(0,(u-.8)/.2)*Math.sin(bite/.38*Math.PI)*.065));
    }
    ctx.filter='none';
    if(shield){ctx.strokeStyle='#c4fff38a';ctx.lineWidth=.035;ctx.beginPath();ctx.ellipse(-.12,0,1.65,1.15,0,0,Math.PI*2);ctx.stroke()}
    ctx.restore();return;
  }
  const fin=ctx.createLinearGradient(0,-1,0,1);fin.addColorStop(0,palette.fin+'30');fin.addColorStop(.6,palette.fin+'b0');fin.addColorStop(1,palette.fin+'40');
  function finShape(points){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fillStyle=fin;ctx.fill();ctx.strokeStyle=palette.belly+'45';ctx.lineWidth=.018;ctx.stroke()}
  // Caudal peduncle and a flexible, deeply forked tail.
  ctx.save();ctx.translate(-1.03,0);ctx.scale(.88+Math.cos(time*10*effort+phase)*.12,1);ctx.rotate(tail);
  finShape([[.18,0],[-.87,-.72],[-.67,-.16],[-.45,0],[-.68,.18],[-.87,.7],[.18,.08]]);
  ctx.strokeStyle=palette.belly+'50';ctx.lineWidth=.014;
  for(let i=0;i<9;i++){const fy=(i-4)*.16;ctx.beginPath();ctx.moveTo(.03,0);ctx.quadraticCurveTo(-.35,fy*.45,-.78,fy);ctx.stroke()}ctx.restore();
  finShape([[-.85,-d*.55],[-.65,-d- .31],[-.37,-d-.39],[.27,-d*.84],[.58,-d*.5]]);
  finShape([[-.65,d*.65],[-.57,d+.28],[.05,d*.78]]);
  finShape([[.3,d*.55],[.08,d+.27],[-.11,d*.62]]);
  const body=new Path2D();body.moveTo(1.23,-.06);body.bezierCurveTo(1.04,-d*.83,.27,-d*1.22,-.45,-d*.81);body.bezierCurveTo(-.8,-d*.48,-.94,-.13,-1.2,-.1);body.lineTo(-1.2,.1);body.bezierCurveTo(-.76,.14,-.53,d*.87,.05,d*.93);body.bezierCurveTo(.62,d,1.07,d*.43,1.23,.07);body.quadraticCurveTo(1.12,.02,1.23,-.06);
  const shade=ctx.createLinearGradient(0,-d,0,d);shade.addColorStop(0,palette.back);shade.addColorStop(.36,palette.side);shade.addColorStop(.68,palette.side);shade.addColorStop(.9,palette.belly);shade.addColorStop(1,palette.back);
  ctx.fillStyle=shade;ctx.fill(body);ctx.save();ctx.clip(body);
  if(palette.pattern==='bars'){
    ctx.strokeStyle=palette.back+'90';ctx.lineWidth=.14;
    for(let i=0;i<5;i++){const bx=-.68+i*.33;ctx.beginPath();ctx.moveTo(bx,-d);ctx.quadraticCurveTo(bx+.15,0,bx-.04,d);ctx.stroke()}
  }
  if(palette.pattern==='stripe'){ctx.strokeStyle='#eadb9670';ctx.lineWidth=.085;ctx.beginPath();ctx.moveTo(-1.2,.03);ctx.quadraticCurveTo(0,-.05,1.15,.03);ctx.stroke()}
  // Staggered scale glints follow the curvature of the flank.
  ctx.lineWidth=.012;
  for(let row=0;row<7;row++)for(let col=0;col<15;col++){
    const sx=-.93+col*.135+(row%2)*.066,sy=-d*.73+row*d*.235;
    ctx.strokeStyle=row<3?'#efffff24':'#142e3928';ctx.beginPath();ctx.arc(sx,sy,.076,-1.1,1.1);ctx.stroke();
  }
  const sheen=ctx.createRadialGradient(.16,-d*.4,0,.1,-d*.2,1);sheen.addColorStop(0,'#d5ffff45');sheen.addColorStop(.6,'#b5f5ef05');sheen.addColorStop(1,'#001c3320');ctx.fillStyle=sheen;ctx.fill(body);
  ctx.strokeStyle='#d7f2dc55';ctx.lineWidth=.018;ctx.beginPath();ctx.moveTo(-1,.01);ctx.bezierCurveTo(-.3,-.06,.25,-.2,.64,-.13);ctx.stroke();ctx.restore();
  // Gill cover, breathing slit, and fluttering pectoral fin.
  ctx.strokeStyle=palette.back+'bb';ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(.56,-d*.66);ctx.quadraticCurveTo(.27+Math.sin(time*3+phase)*.015,.04,.55,d*.66);ctx.stroke();
  ctx.save();ctx.translate(.36,.12);ctx.rotate(-.12+beat*.16);finShape([[0,0],[-.58,.17],[-.35,.34],[.06,.08]]);ctx.restore();
  ctx.fillStyle='#a89851';ctx.beginPath();ctx.ellipse(.87,-d*.24,.104,.108,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#07151c';ctx.beginPath();ctx.arc(.885,-d*.24,.068,0,Math.PI*2);ctx.fill();ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(.909,-d*.28,.023,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=palette.back;ctx.lineWidth=.025;ctx.beginPath();ctx.moveTo(1.21,.055);ctx.lineTo(1.04,.07);ctx.stroke();
  if(flash){ctx.globalAlpha=Math.min(.3,flash*.5);ctx.fillStyle='#fff5b6';ctx.fill(body);ctx.globalAlpha=1}
  if(shield){ctx.strokeStyle='#c4fff38a';ctx.lineWidth=.035;ctx.beginPath();ctx.ellipse(-.12,0,1.65,1.15,0,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
}

function drawOcean(game,time){
  const {ctx,width:w,height:h,distance}=game,t=time/1000;
  const water=ctx.createLinearGradient(0,0,w*.25,h);water.addColorStop(0,'#388d9e');water.addColorStop(.25,'#15647d');water.addColorStop(.66,'#093d59');water.addColorStop(1,'#061e35');ctx.fillStyle=water;ctx.fillRect(0,0,w,h);
  if(reefPhoto.complete&&reefPhoto.naturalWidth){
    const scale=Math.max(w/reefPhoto.naturalWidth,h/reefPhoto.naturalHeight)*1.16,iw=reefPhoto.naturalWidth*scale,ih=reefPhoto.naturalHeight*scale;
    // Refracted strips move continuously; the camera drifts over the reef behind them.
    const ox=(w-iw)/2+Math.sin(distance/1300)*(iw-w)*.42,oy=(h-ih)/2+Math.sin(t*.45)*4;
    for(let band=0;band<36;band++){
      const sy=band*reefPhoto.naturalHeight/36,sh=Math.min(reefPhoto.naturalHeight-sy,reefPhoto.naturalHeight/36+1);
      const refraction=Math.sin(t*1.25+band*.42)*2.4+Math.sin(t*.7+band*.8)*1.2;
      ctx.drawImage(reefPhoto,0,sy,reefPhoto.naturalWidth,sh,ox+refraction,oy+band*ih/36,iw,sh*scale+.5);
    }
    ctx.fillStyle='#032b491b';ctx.fillRect(0,0,w,h);
  }
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<7;i++){
    const x=(i/6)*w+Math.sin(t*.18+i)*35,g=ctx.createLinearGradient(x,0,x+100,h);g.addColorStop(0,'#a5ebd61b');g.addColorStop(1,'#a5ebd600');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-24,0);ctx.lineTo(x+18,0);ctx.lineTo(x+240,h);ctx.lineTo(x+30,h);ctx.closePath();ctx.fill();
  }ctx.restore();
  // Distant shoals are small, muted, and slower than the playable fish.
  ctx.save();ctx.globalAlpha=.38;
  for(let i=0;i<18;i++){
    const x=((i*83-distance*.19)%(w+150)+w+150)%(w+150)-75,y=h*(.24+.19*Math.sin(i*1.9))+Math.sin(t+i)*4;
    drawLivingFish(ctx,x,y,6+i%4,{time:t,phase:i,flip:true,species:2});
  }ctx.restore();
  for(let layer=0;layer<(reefPhoto.complete&&reefPhoto.naturalWidth?0:3);layer++){
    const shift=distance*(.1+layer*.12),base=h*(.77+layer*.075);
    ctx.fillStyle=['#164c60','#123c4c','#092e3d'][layer];ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w+12;x+=12)ctx.lineTo(x,base+Math.sin((x+shift)/88)*13+Math.sin((x+shift)/31)*5);ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    for(let i=0;i<Math.ceil(w/70)+3;i++){
      const x=i*77-(shift%77),seed=i+Math.floor(shift/77),plantH=18+(Math.sin(seed*9.3)+1)*19;
      ctx.strokeStyle=layer===2?'#39766d88':'#3a7d7e35';ctx.lineWidth=layer===2?2.5:2;
      for(let stem=0;stem<4;stem++){ctx.beginPath();ctx.moveTo(x+stem*4,h);ctx.bezierCurveTo(x-9,h-plantH*.4,x+Math.sin(t*.8+seed)*11,h-plantH,x+stem*5+Math.sin(t+seed)*8,h-plantH-stem*5);ctx.stroke()}
    }
  }
  drawLivingReef(ctx,w,h,t,distance);
  drawSeaLife(ctx,w,h,t,distance);
  for(const b of game.bubbles){ctx.fillStyle='#c6e9df'+(b.r>3?'25':'50');ctx.beginPath();ctx.arc(b.x,b.y,b.r*.35,0,Math.PI*2);ctx.fill()}
  const vignette=ctx.createRadialGradient(w*.48,h*.42,h*.15,w*.5,h*.5,Math.max(w,h)*.66);vignette.addColorStop(0,'#00132600');vignette.addColorStop(1,'#00132685');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
}

function drawFeedingEffects(game,dt){
  const ctx=game.ctx,p=game.player;
  for(let i=game.effects.length-1;i>=0;i--){
    const e=game.effects[i];e.age+=dt;
    if(e.age>1.7){game.effects.splice(i,1);continue}
    const mouth=game.width*.27+p.drawSize*1.2,progress=Math.min(1,e.age/.3);
    if(progress<1)drawLivingFish(ctx,e.x+(mouth-e.x)*progress,e.y+(p.y-e.y)*progress,e.r*(1-progress),{species:e.species,flip:true,time:e.age});
    ctx.save();
    // Feathered overlapping pigment plumes, carried behind the swimming fish.
    for(let n=0;n<7;n++){
      const age=e.age,spread=5+age*19,cx=e.x-age*43+Math.sin(n*2.4+age)*spread*.6,cy=e.y+Math.cos(n*3.7)*spread*.65-age*5;
      const cloud=ctx.createRadialGradient(cx,cy,0,cx,cy,spread);
      cloud.addColorStop(0,`rgba(132,26,38,${.19*(1-age/1.7)})`);cloud.addColorStop(.45,`rgba(151,35,44,${.1*(1-age/1.7)})`);cloud.addColorStop(1,'rgba(115,30,40,0)');
      ctx.fillStyle=cloud;ctx.fillRect(cx-spread,cy-spread,spread*2,spread*2);
    }
    ctx.globalAlpha=Math.max(0,1-e.age/1.7);ctx.fillStyle='#efffda';ctx.shadowColor='#06273b';ctx.shadowBlur=5;ctx.textAlign='center';ctx.font='bold 15px sans-serif';ctx.fillText(e.label||'Caught',mouth,p.y-p.drawSize-15-e.age*24);ctx.restore();
  }
}

function drawJellyfish(ctx,x,y,r,t){
  ctx.save();ctx.translate(x,y);const pulse=1+Math.sin(t*3)*.08;
  ctx.strokeStyle='#e7caef88';ctx.lineWidth=1;
  for(let i=0;i<9;i++){const sx=(i-4)*r*.16;ctx.beginPath();ctx.moveTo(sx,0);ctx.bezierCurveTo(sx+Math.sin(t*2+i)*r*.35,r*.5,sx-Math.cos(t+i)*r*.3,r,sx+Math.sin(t*1.5+i)*r*.3,r*1.6);ctx.stroke()}
  const g=ctx.createRadialGradient(-r*.25,-r*.4,1,0,0,r);g.addColorStop(0,'#f5e6f9ba');g.addColorStop(.65,'#b697d46a');g.addColorStop(1,'#d9c4ed10');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,r*pulse,r*.7,0,Math.PI,Math.PI*2);ctx.quadraticCurveTo(0,r*.22,-r*pulse,0);ctx.fill();ctx.strokeStyle='#eedfff95';ctx.stroke();ctx.restore();
}

function drawSeaLife(ctx,w,h,t,distance){
  // A distant ray glides above the reef with slow wing beats.
  const x=((w+220-distance*.16)%(w+300)+w+300)%(w+300)-150,y=h*.26+Math.sin(t*.4)*12;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.38;ctx.fillStyle='#21465a';ctx.beginPath();ctx.moveTo(32,0);ctx.bezierCurveTo(4,-8,-8,-26-Math.sin(t*2)*9,-43,-34);ctx.quadraticCurveTo(-22,-4,-22,0);ctx.quadraticCurveTo(-24,13,-43,31+Math.sin(t*2)*8);ctx.bezierCurveTo(-2,20,10,5,32,0);ctx.fill();ctx.strokeStyle='#264857';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-20,0);ctx.quadraticCurveTo(-55,8,-92,Math.sin(t)*8);ctx.stroke();ctx.restore();
  // A starfish and sea urchins remain attached to the seabed.
  for(let i=0;i<3;i++){
    const sx=((i*337-distance*.12)%(w+100)+w+100)%(w+100)-50,sy=h*.93+Math.sin(i*4)*9;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(i);
    if(i===1){ctx.fillStyle='#b8784f';ctx.strokeStyle='#e4ba8970';ctx.lineWidth=1;ctx.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5,r=k%2?6:19;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke()}
    else{ctx.strokeStyle='#242a34';ctx.lineWidth=1;for(let k=0;k<28;k++){const a=k/28*Math.PI*2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*(16+Math.sin(k*7)*4),Math.sin(a)*12);ctx.stroke()}ctx.fillStyle='#302d35';ctx.beginPath();ctx.ellipse(0,0,8,6,0,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
}


function drawLivingReef(ctx,w,h,t,distance){
  // Moving caustics are light on the reef, not a fixed overlay in the photograph.
  ctx.save();ctx.globalCompositeOperation='screen';
  ctx.lineWidth=1.2;
  for(let row=0;row<4;row++){
    ctx.strokeStyle=`rgba(157,229,215,${.065+Math.sin(t+row)*.025})`;
    for(let col=-1;col<Math.ceil(w/100)+1;col++){
      const x=col*100-(distance*.09)%100,y=h*(.65+row*.09);
      ctx.beginPath();
      for(let k=0;k<=16;k++){
        const a=k/16*Math.PI*2,rx=44+Math.sin(t*.9+col+row)*12,ry=12+Math.sin(t*1.3+col)*5;
        const px=x+Math.cos(a)*rx+Math.sin(t+a*3+row)*6,py=y+Math.sin(a)*ry;
        if(k===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }ctx.stroke();
    }
  }ctx.restore();
  // Foreground sea fans and seagrass move faster than the distant reef.
  const spacing=210,shift=distance*.42,offset=shift%spacing;
  for(let i=-1;i<Math.ceil(w/spacing)+2;i++){
    const seed=i+Math.floor(shift/spacing),x=i*spacing-offset,base=h+9;
    ctx.save();ctx.lineCap='round';
    if(Math.abs(seed%3)===0){
      for(let branch=0;branch<11;branch++){
        const spread=(branch-5)*8,height=52+Math.cos((branch-5)*.2)*36,sway=Math.sin(t*1.15+seed)*9;
        ctx.strokeStyle=branch%2?'#b09b7380':'#93685799';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x,base);ctx.bezierCurveTo(x+spread*.2,base-30,x+spread+sway,base-height*.7,x+spread+sway,base-height);ctx.stroke();
        for(let twig=1;twig<4;twig++){
          const ty=base-height*twig/4,tx=x+spread*twig/4+sway*twig/4;
          ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx+spread*.25,ty-12,tx+spread*.4+sway*.3,ty-22);ctx.stroke();
        }
      }
    }else{
      for(let blade=0;blade<7;blade++){
        const height=35+(Math.sin(seed*8+blade*3)+1)*22,sway=Math.sin(t*1.6+seed+blade*.35)*16;
        ctx.strokeStyle=blade%2?'#366a52b0':'#63987c99';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x+blade*4,base);ctx.bezierCurveTo(x+blade*3-10,base-height*.3,x+blade*4+sway,base-height*.65,x+blade*4+sway*1.2,base-height);ctx.stroke();
      }
    }ctx.restore();
  }
  // Rising bubbles catch sunlight and vary in depth and speed.
  ctx.save();
  for(let i=0;i<16;i++){
    const depth=.5+(i%4)*.2,travel=t*(12+depth*12),y=h-((travel+i*73)%(h+30)),x=((i*139-distance*.13*depth+Math.sin(t+i)*9)%(w+30)+w+30)%(w+30)-15,r=1.4+depth;
    ctx.strokeStyle='#d3f7f15c';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#e6ffff95';ctx.beginPath();ctx.arc(x-r*.3,y-r*.35,.65,0,Math.PI*2);ctx.fill();
  }ctx.restore();
}
