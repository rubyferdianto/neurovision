import * as T from '../vendor/three.module.js';
import {ball,box,tube,objectModel,fishModel,disposeObject} from './models.js';

export class ReefScene {
 constructor(scene){
  this.scene=scene;this.root=new T.Group();scene.add(this.root);this.targets=new Map();this.effects=new Map();this.plants=[];
  scene.background=new T.Color('#073b57');scene.fog=new T.FogExp2('#073b57',.022);
  this.player=fishModel('tuna');this.root.add(this.player);
  const floor=box(this.root,'#537d72',[0,-7,-5],[60,1,16]);floor.receiveShadow=true;
  for(let i=0;i<22;i++){
   const cluster=new T.Group();cluster.position.set((i-11)*2.3,-6.1,-1.5-(i%4)*2.2);this.root.add(cluster);
   const rock=ball(cluster,['#628478','#758b73','#627971'][i%3],[0,-.15,0],[.9,.45,.7]);
   const coral=objectModel(i%3?'coral':'plant');coral.scale.setScalar(.65+(i%4)*.2);coral.position.y=.6;cluster.add(coral);this.plants.push({cluster,coral,base:cluster.position.x,phase:i});
  }
  this.shoal=[];for(let i=0;i<14;i++){const fish=fishModel('prey',['#e9ac72','#72b9bf','#b8cc82'][i%3]);fish.scale.setScalar(.12+i%3*.04);this.root.add(fish);this.shoal.push(fish)}
  const positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions[i*3]=(Math.random()-.5)*40;positions[i*3+1]=(Math.random()-.5)*16;positions[i*3+2]=-Math.random()*10}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));this.dust=new T.Points(geo,new T.PointsMaterial({color:'#b8e6df',size:.045,transparent:true,opacity:.5}));this.root.add(this.dust);
  this.rays=[];for(let i=0;i<5;i++){const beam=box(this.root,'#83e8d1',[(i-2)*7,2,-8],[.65,24,.04]);beam.rotation.z=-.25;beam.material.transparent=true;beam.material.opacity=.045;beam.material.depthWrite=false;this.rays.push(beam)}
  this.warning=box(this.root,'#ff7459',[0,0,.5],[40,1,.01]);this.warning.material.transparent=true;this.warning.material.opacity=.14;this.warning.material.depthWrite=false;this.warning.visible=false;
 }
 animateFish(mesh,time,effort=1){if(mesh.userData.tail){const whale=mesh.userData.kind==='whale';mesh.userData.tail.rotation.y=whale?0:Math.sin(time*10*effort)*.36;mesh.userData.tail.rotation.z=whale?Math.sin(time*3)*.16:0}if(mesh.userData.kind==='jelly')mesh.scale.y*=1+Math.sin(time*3)*.05}
 update(game,time,dt){
  const unit=12/game.height,halfW=game.width*unit/2,toX=x=>x*unit-halfW,toY=y=>6-y*unit;
  this.player.position.set(toX(game.width*.27)+Math.sin(game.player.bite/.38*Math.PI)*.1,toY(game.player.y),0);
  this.player.scale.setScalar(game.player.drawSize*unit);this.player.rotation.z=T.MathUtils.clamp((game.player.y-game.player.targetY)*.003,-.3,.3);this.player.rotation.y=-.14;
  this.animateFish(this.player,time);this.player.visible=game.player.flash<.4||Math.sin(time*26)>-.5;
  const alive=new Set();for(const target of game.fish){alive.add(target);let mesh=this.targets.get(target);if(!mesh){mesh=fishModel(target.kind==='hazard'?'jelly':target.kind==='predator'?'barracuda':'prey',target.color||'#76bec3');this.targets.set(target,mesh);this.root.add(mesh);if(target.kind==='immune'){const ring=new T.Mesh(new T.TorusGeometry(1.5,.035,6,40),new T.MeshBasicMaterial({color:'#beffda'}));mesh.add(ring)}}mesh.position.set(toX(target.x),toY(target.y),0);mesh.scale.setScalar(target.r*unit);mesh.rotation.y=Math.PI+.13;mesh.rotation.z=target.tilt||0;this.animateFish(mesh,time+target.phase,target.effort||1)}
  for(const [target,mesh] of this.targets)if(!alive.has(target)){this.root.remove(mesh);disposeObject(mesh);this.targets.delete(target)}
  const a=game.ambush;this.warning.visible=a?.phase==='warning';if(a?.phase==='warning'){const spec=window.neuroMonsterSpec(a.type);this.warning.position.y=toY(a.y);this.warning.scale.y=(a.r*spec.body+game.player.size*.5)*2*unit;this.warning.material.opacity=.1+Math.sin(time*12)*.05}
  if(a?.phase==='charge'){
   if(this.monsterType!==a.type||!this.monster){if(this.monster){this.root.remove(this.monster);disposeObject(this.monster)}this.monster=fishModel(a.type);this.monsterType=a.type;this.root.add(this.monster)}
   this.monster.visible=true;this.monster.position.set(toX(a.x),toY(a.y),.1);this.monster.scale.setScalar(a.r*unit);this.monster.rotation.y=a.side===1?Math.PI+.12:-.12;this.animateFish(this.monster,time,a.type==='whale'?.5:1.8);
  }else if(this.monster)this.monster.visible=false;
  const activeEffects=new Set(game.effects);
  for(const e of game.effects){let cloud=this.effects.get(e);if(!cloud){cloud=new T.Group();for(let i=0;i<6;i++){const puff=ball(cloud,'#ac384c',[Math.sin(i*2.4)*.13,Math.cos(i*3.7)*.1,i*.03],[.1,.1,.1],{transparent:true,opacity:.13,depthWrite:false});puff.material.roughness=1}this.root.add(cloud);this.effects.set(e,cloud)}e.age+=dt;cloud.position.set(toX(e.x)-e.age*.6,toY(e.y)+e.age*.1,.2);cloud.scale.setScalar(.7+e.age*1.5);cloud.children.forEach(o=>o.material.opacity=Math.max(0,.13*(1-e.age/1.7)))}
  game.effects=game.effects.filter(e=>e.age<1.7);
  for(const [e,cloud] of this.effects)if(!activeEffects.has(e)||e.age>=1.7){this.root.remove(cloud);disposeObject(cloud);this.effects.delete(e)}
  for(const p of this.plants){p.cluster.position.x=((p.base-game.distance*unit*.27+27)%54+54)%54-27;p.coral.rotation.z=Math.sin(time*.8+p.phase)*.09}
  this.shoal.forEach((f,i)=>{f.position.set(((i*2.9-time*.5+22)%44)-22,2+Math.sin(i*2.4+time*.5),-4-i%3);f.rotation.y=Math.PI;this.animateFish(f,time+i)});
  this.rays.forEach((r,i)=>r.rotation.z=-.25+Math.sin(time*.3+i)*.025);
  this.dust.rotation.z=Math.sin(time*.05)*.03;
 }
}
