import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../vendor/three.module.js';
import {objectModel,fishModel,disposeObject,guessModels,bevelBox} from '../three/models.js';
import {ReefScene} from '../three/reef.js';
const source=fs.readFileSync('app.js','utf8')+fs.readFileSync('levels.js','utf8');
const names=[...source.matchAll(/\["[^"\n]+","([A-Za-z ]+)"\]/g)].filter(m=>/[^\x00-\x7F]/.test(m[0])).map(m=>m[1]);
for(const name of new Set([...names,...guessModels])){
 const root=objectModel(name),bounds=new T.Box3().setFromObject(root);assert.ok(!bounds.isEmpty(),name+' is modeled');let meshes=0;
 root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position);for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v),name+' has finite geometry')}});assert.ok(meshes>0);disposeObject(root);
}
for(const kind of ['tuna','prey','shark','whale','barracuda','jelly']){const root=fishModel(kind);const b=new T.Box3().setFromObject(root);assert.ok(b.max.z-b.min.z>.1,kind+' has real depth');disposeObject(root)}
const padRoot=new T.Group(),pad=bevelBox(padRoot,'#fd7297',[0,0,0],[1.8,1.8,.44],.075);
const padSize=new T.Box3().setFromObject(pad).getSize(new T.Vector3());
assert.ok(Math.abs(padSize.x-1.8)<.001&&Math.abs(padSize.z-.44)<.001,'beveled tiles retain their hit-test bounds');
assert.equal(new T.Raycaster(new T.Vector3(0,0,3),new T.Vector3(0,0,-1)).intersectObject(pad).length>0,true,'raised face accepts clicks');disposeObject(padRoot);
globalThis.window={neuroMonsterSpec:()=>({body:.48})};
const scene=new T.Scene(),reef=new ReefScene(scene),target={kind:'fish',r:12,x:400,y:200,phase:0},effect={x:300,y:200,r:12,age:0};
const game={height:500,width:1000,player:{y:250,targetY:250,drawSize:28,size:28,bite:0,flash:0},fish:[target],effects:[effect],distance:100,ambush:{type:'whale',phase:'charge',x:500,y:250,r:100,side:1}};
reef.update(game,1,.016);assert.equal(reef.targets.size,1);assert.equal(reef.effects.size,1);assert.ok(reef.monster.visible);assert.equal(reef.monster.userData.kind,'whale');
game.fish=[];game.effects=[];game.ambush=null;reef.update(game,2,.016);assert.equal(reef.targets.size,0);assert.equal(reef.effects.size,0);assert.equal(reef.monster.visible,false);disposeObject(scene);
console.log('PASS: every memory/guess object has finite 3D geometry, all fish have volume, reef targets/effects clean up, monster models synchronize.');
