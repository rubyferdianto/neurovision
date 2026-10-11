import * as T from '../vendor/three.module.js';
import {box,objectModel,disposeObject} from './models.js';
import {ReefScene} from './reef.js';

let renderer=null,active=null,failed=false,last=0;
const raycaster=new T.Raycaster(),pointer=new T.Vector2(),puzzlePositions=new Map();
function textTexture(text,color='#edf5ed'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='600 44px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,490);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function label(group,text,x,y,size=1.4){const m=new T.Mesh(new T.PlaneGeometry(size,size/4),new T.MeshBasicMaterial({map:textTexture(text),transparent:true,depthWrite:false}));m.position.set(x,y,.75);group.add(m);return m}
function lights(scene){scene.add(new T.HemisphereLight('#ddf7ff','#536154',2.2));const sun=new T.DirectionalLight('#fff0d6',3);sun.position.set(-4,7,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.035;scene.add(sun);const rim=new T.DirectionalLight('#74b8ed',1.6);rim.position.set(5,1,-3);scene.add(rim)}
function ensureRenderer(){
 if(renderer)return true;if(failed)return false;
 try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.domElement.className='nv3d-canvas';renderer.domElement.addEventListener('pointerup',pick);renderer.domElement.addEventListener('keydown',keyControl);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;unmount();document.querySelector('#render-mode')?.replaceChildren(document.createTextNode('2D · graphics unavailable'))});
  return true;
 }catch(error){console.warn('3D unavailable; keeping playable 2D games.',error);failed=true;return false}
}
function unmount(){if(!active)return;if(active.kind==='puzzle')for(const item of active.items)puzzlePositions.set(item.id,item.mesh.position.clone());active.source.classList.remove('nv3d-source');active.source.removeAttribute('aria-hidden');if(active.kind==='fish'&&active.host.isConnected)active.host.before(active.source);active.host.remove();active.picture?.dispose();active.scene.traverse(o=>o.shadow?.dispose());disposeObject(active.scene);active=null}
function sourceNow(){const s=window.neuroState();if(!s.game)return null;const selectors={fish:'#fish-canvas',memory:'.memory-board',puzzle:'.puzzle-board',pattern:'.echo-board',guess:'#guess-object'};const source=document.querySelector(selectors[s.game]||'__none');return source?{source,kind:s.game}:null}
function mount(source,kind){
 unmount();if(!ensureRenderer())return;
 const host=document.createElement('div');host.className='nv3d-host nv3d-'+kind;
 const caption=document.createElement('div');caption.className='nv3d-caption';caption.textContent=kind==='fish'?'3D REEF · STEER TO HUNT':kind==='pattern'?'3D SEQUENCE · WATCH, THEN REPEAT':kind==='puzzle'?'3D SLIDER · TAP A NEIGHBOURING TILE':kind==='memory'?'3D COLLECTION · REMEMBER EACH OBJECT':'3D OBJECT · LOOK CLOSELY';
 const live=document.createElement('span');live.className='nv3d-live';live.setAttribute('aria-live','polite');
 host.append(renderer.domElement,caption,live);source.before(host);
 renderer.domElement.style.filter='';
 const scene=new T.Scene();scene.background=new T.Color('#182c38');lights(scene);
 const camera=new T.OrthographicCamera(-6,6,5,-5,.1,100);camera.position.set(0,2.5,20);camera.lookAt(0,0,0);
 active={source,kind,host,scene,camera,items:[],live,focus:0,caption,time:0};
 if(kind==='fish'){
  camera.position.set(0,.7,22);camera.lookAt(0,0,0);active.reef=new ReefScene(scene);
  // Keep the original pointer surface on top; all steering listeners remain intact.
  host.append(source);source.classList.add('nv3d-source');active.fishGame=window.neuroState().fish;
  const alert=document.createElement('div');alert.className='nv3d-alert';alert.setAttribute('role','status');host.append(alert);active.alert=alert;
 }else{
  buildBoard(active);source.classList.add('nv3d-source');
  renderer.domElement.tabIndex=kind==='puzzle'||kind==='pattern'?0:-1;
  renderer.domElement.setAttribute('role',kind==='puzzle'||kind==='pattern'?'group':'img');renderer.domElement.setAttribute('aria-label',kind==='guess'?'Rotating mystery object':kind==='memory'?'Three-dimensional object collection':'3D '+kind+' board. Use arrow keys to select a tile; Enter or Space to play it.');
 }
 resize();
}
function buildBoard(a){
 const state=window.neuroState(),kind=a.kind;
 if(kind==='guess'){
  const m=objectModel(state.guess.item.answer);m.scale.setScalar(1.6);a.scene.add(m);a.model=m;return;
 }
 const count=kind==='memory'?state.memory.items.length:kind==='puzzle'?state.puzzle.board.length:state.pattern.size**2;
 const cols=kind==='memory'?4:Math.sqrt(count),rows=Math.ceil(count/cols),step=2;
 a.cols=cols;a.rows=rows;
 const base=box(a.scene,'#283f4c',[0,0,-.42],[cols*step+.3,rows*step+.3,.32]);base.receiveShadow=true;
 const picture=kind==='puzzle'?new T.TextureLoader().load('assets/reef.png'):null;
 if(picture)picture.colorSpace=T.SRGBColorSpace;
 for(let i=0;i<count;i++){
  const x=(i%cols-(cols-1)/2)*step,y=((rows-1)/2-Math.floor(i/cols))*step;
  if(kind==='memory'){
   box(a.scene,'#36515a',[x,y,-.1],[1.85,1.85,.2]);
   const hidden=state.memory.phase==='blank'||((state.memory.phase==='answer'||state.memory.phase==='done')&&i===state.memory.missingIndex);
   if(!hidden){const model=objectModel(state.memory.items[i][1]);model.scale.setScalar(.62);model.position.set(x,y+.17,.15);model.rotation.y=-.22;a.scene.add(model);a.items.push({mesh:model,x,y:y+.17});label(a.scene,state.memory.items[i][1],x,y-.65,1.7)}else if(state.memory.phase!=='blank')label(a.scene,'?',x,y,1.5);
  }else{
   const n=kind==='puzzle'?state.puzzle.board[i]:i+1;if(kind==='puzzle'&&n===0)continue;
   const tile=box(a.scene,kind==='pattern'?'#476879':'#c6d9c8',[x,y,.1],[1.8,1.8,.36]);
   if(picture){const map=picture.clone();map.repeat.set(1/cols,1/cols);map.offset.set(((n-1)%cols)/cols,1-(Math.floor((n-1)/cols)+1)/cols);map.needsUpdate=true;const face=new T.Mesh(new T.PlaneGeometry(1.78,1.78),new T.MeshStandardMaterial({map,roughness:.6}));face.position.z=.185;tile.add(face)}
   label(tile,String(n),0,-.58,.62);
   tile.userData.cell=i;const item={id:n,mesh:tile,x,y,cell:i};a.items.push(item);
   if(kind==='puzzle'&&puzzlePositions.has(n)&&state.puzzle.moves>0)tile.position.copy(puzzlePositions.get(n));
  }
 }
 if(picture){a.picture=picture;} // TextureLoader's base is disposed separately on scene teardown.
}
function resize(){if(!active)return;const a=active,w=Math.max(1,a.host.clientWidth),h=Math.max(1,a.host.clientHeight);if(a.width===w&&a.height===h)return;a.width=w;a.height=h;renderer.setSize(w,h,false);const aspect=w/h,half=a.kind==='fish'?6:a.kind==='guess'?2.3:Math.max((a.rows||4)+.6,((a.cols||4)+.6)/aspect);a.camera.left=-half*aspect;a.camera.right=half*aspect;a.camera.top=half;a.camera.bottom=-half;a.camera.updateProjectionMatrix()}
function activate(cell){if(!active)return;const selector=active.kind==='puzzle'?`[data-tile="${cell}"]`:`[data-cell="${cell}"]`;const b=active.source.querySelector(selector);if(b&&!b.disabled)b.click()}
function pick(e){if(!active||!['pattern','puzzle'].includes(active.kind))return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,active.camera);const hit=raycaster.intersectObjects(active.items.map(i=>i.mesh),false)[0];if(hit)activate(hit.object.userData.cell)}
function keyControl(e){if(!active||!['pattern','puzzle'].includes(active.kind))return;const a=active,size=a.cols;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-size,ArrowDown:size}[e.key];if(step)a.focus=(a.focus+step+size*size)%(size*size);else activate(a.focus);if(active===a)a.live.textContent='Selected tile '+(a.focus+1)}}
function update(time){
 requestAnimationFrame(update);const dt=Math.min(.04,last?(time-last)/1000:0);last=time;if(failed)return;
 try{
  const next=sourceNow();if(!next){unmount();return}if(!active||active.source!==next.source||active.kind!==next.kind)mount(next.source,next.kind);if(!active)return;
  const a=active,state=window.neuroState();resize();a.time=time/1000;
  if(a.kind==='fish'){
   if(!state.fish?.active)return;a.reef.update(state.fish,time/1000,dt);
   const attack=state.fish.ambush;
   const message=attack?.phase==='warning'?`${window.neuroMonsterSpec(attack.type).name.toUpperCase()} ${attack.side===1?'FROM RIGHT':'FROM LEFT'} — LEAVE THE RED LANE`:state.fish.statusTime>0?state.fish.status:'';
   if(a.alert.textContent!==message)a.alert.textContent=message;a.alert.classList.toggle('danger',attack?.phase==='warning');
  }else if(a.kind==='guess'){
   a.model.rotation.y=Math.sin(time/1800)*.65;const g=state.guess,blur=g.phase==='active'?Math.max(0,28*(1-(Date.now()-g.started)/g.duration)):0;renderer.domElement.style.filter=`blur(${blur}px)`;
  }else{
   renderer.domElement.style.filter='';
   for(const item of a.items){if(a.kind==='memory'){item.mesh.rotation.y=-.22+Math.sin(time/1600+item.x)*.1;continue}
    const b=a.source.querySelector(a.kind==='pattern'?`[data-cell="${item.cell}"]`:`[data-tile="${item.cell}"]`),lit=b?.classList.contains('lit'),good=b?.classList.contains('correct'),bad=b?.classList.contains('miss');
    item.mesh.position.x=T.MathUtils.damp(item.mesh.position.x,item.x,18,dt);item.mesh.position.y=T.MathUtils.damp(item.mesh.position.y,item.y,18,dt);
    item.mesh.position.z=T.MathUtils.damp(item.mesh.position.z,lit?.32:good?-.03:.1,18,dt);
    item.mesh.material.emissive.set(bad?'#b23040':lit?'#79d5c4':good?'#328c60':'#000000');item.mesh.material.emissiveIntensity=lit?1.8:.5;
    if(!lit&&!good&&!bad&&document.activeElement===renderer.domElement&&a.focus===item.cell)item.mesh.material.emissive.set('#705a95');
   }
  }
  renderer.render(a.scene,a.camera);
 }catch(error){console.error('3D scene failed; restored 2D controls.',error);failed=true;unmount();document.querySelector('#render-mode')?.replaceChildren(document.createTextNode('2D � graphics unavailable'))}
}
window.Neuro3D={isFishActive:game=>!failed&&active?.kind==='fish'&&active.fishGame===game,available:()=>!!renderer&&!failed};
const badge=document.createElement('span');badge.id='render-mode';badge.className='nv3d-mode';badge.textContent='3D EDITION';document.querySelector('.top-actions')?.prepend(badge);
requestAnimationFrame(update);
