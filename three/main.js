import * as T from '../vendor/three.module.js';
import {box,bevelBox,objectModel,disposeObject} from './models.js?v=5';

let renderer=null,active=null,failed=false,last=0;
const raycaster=new T.Raycaster(),pointer=new T.Vector2(),puzzlePositions=new Map();
function textTexture(text,color='#edf5ed'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font=text.length<3?'700 128px sans-serif':'600 44px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,490);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function label(group,text,x,y,size=1.4,color){const m=new T.Mesh(new T.PlaneGeometry(size,size/4),new T.MeshBasicMaterial({map:textTexture(text,color),transparent:true,depthWrite:false}));m.position.set(x,y,.75);group.add(m);return m}
function themedSurface(a,mesh,role){a.themeSurfaces.push({material:mesh.material,role});return mesh}
function syncTheme(a){
 if(!a)return;
 const styles=getComputedStyle(a.host);
 a.scene.background.set(styles.getPropertyValue('--nv-scene').trim());
 for(const {material,role} of a.themeSurfaces)material.color.set(styles.getPropertyValue('--nv-'+role).trim());
}
// Recolor the existing scene without restarting a round, playback, or puzzle move.
new MutationObserver(()=>syncTheme(active)).observe(document.body,{attributes:true,attributeFilter:['class']});
function lights(scene){scene.add(new T.HemisphereLight('#ddf7ff','#3a3956',1.3));const sun=new T.DirectionalLight('#fff0e6',3);sun.position.set(-4,7,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);const rim=new T.DirectionalLight('#a5adff',1.3);rim.position.set(5,1,-3);scene.add(rim)}
function ensureRenderer(){
 if(renderer)return true;if(failed)return false;
 try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.domElement.className='nv3d-canvas';renderer.domElement.addEventListener('pointerup',pick);renderer.domElement.addEventListener('keydown',keyControl);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;unmount();document.querySelector('#render-mode')?.replaceChildren(document.createTextNode('2D  /  graphics unavailable'))});
  return true;
 }catch(error){console.warn('3D unavailable; keeping playable 2D games.',error);failed=true;document.querySelector('#render-mode')?.replaceChildren(document.createTextNode('2D / graphics unavailable'));return false}
}
function unmount(){if(!active)return;if(active.kind==='puzzle')for(const item of active.items)puzzlePositions.set(item.id,item.mesh.position.clone());active.source.classList.remove('nv3d-source');active.source.removeAttribute('aria-hidden');if(active.kind==='fish'&&active.host.isConnected)active.host.before(active.source);active.host.remove();active.picture?.dispose();active.tileMaps?.forEach(({map})=>map.dispose());active.scene.traverse(o=>o.shadow?.dispose());disposeObject(active.scene);active=null}
function sourceNow(){if(typeof window.neuroState!=="function")return null;const s=window.neuroState();if(!s.game||s.game==='fish')return null;const selectors={memory:'.memory-board',puzzle:'.puzzle-board',pattern:'.echo-board',guess:'#guess-object'};const source=document.querySelector(selectors[s.game]||'__none');return source?{source,kind:s.game}:null}
function mount(source,kind){
 unmount();if(!ensureRenderer())return;
 const host=document.createElement('div');host.className='nv3d-host nv3d-'+kind;
 const caption=document.createElement('div');caption.className='nv3d-caption';caption.textContent=kind==='pattern'?'COLOR STUDIO  /  WATCH, THEN REPEAT':kind==='puzzle'?'3D SLIDER  /  TAP A NEIGHBOURING TILE':kind==='memory'?'3D COLLECTION  /  REMEMBER EACH OBJECT':'3D OBJECT  /  LOOK CLOSELY';
 const live=document.createElement('span');live.className='nv3d-live';live.setAttribute('aria-live','polite');
 host.append(renderer.domElement,caption,live);source.before(host);
 renderer.domElement.style.filter='';
 const scene=new T.Scene();scene.background=new T.Color();lights(scene);
 const camera=new T.OrthographicCamera(-6,6,5,-5,.1,100);camera.position.set(0,kind==='pattern'?4:3.2,20);camera.lookAt(0,0,0);
 active={source,kind,host,scene,camera,items:[],themeSurfaces:[],live,focus:0,caption,time:0};
 {
  buildBoard(active);syncTheme(active);source.classList.add('nv3d-source');
  renderer.domElement.tabIndex=kind==='puzzle'||kind==='pattern'?0:-1;
  renderer.domElement.setAttribute('role',kind==='puzzle'||kind==='pattern'?'group':'img');renderer.domElement.setAttribute('aria-label',kind==='guess'?'Rotating mystery object':kind==='memory'?'Three-dimensional object collection':'3D '+kind+' board. Use arrow keys to select a tile; Enter or Space to play it.');
 }
 resize();
}
function buildBoard(a){
 const state=window.neuroState(),kind=a.kind;
 if(kind==='guess'){
  const m=objectModel(state.guess.item.answer);m.scale.setScalar(1.6);a.scene.add(m);a.model=m;
  themedSurface(a,box(a.scene,'#ffffff',[0,-1.7,-.2],[7,.12,5]),'floor');return;
 }
 const count=kind==='memory'?state.memory.items.length:kind==='puzzle'?state.puzzle.board.length:state.pattern.size**2;
 const cols=kind==='memory'?4:Math.sqrt(count),rows=Math.ceil(count/cols),step=2;
 a.cols=cols;a.rows=rows;
 const base=themedSurface(a,bevelBox(a.scene,'#ffffff',[0,0,-.52],[cols*step+.32,rows*step+.32,.4],.1),'tray');base.receiveShadow=true;
 themedSurface(a,box(a.scene,'#ffffff',[0,0,-.28],[cols*step-.02,rows*step-.02,.06]),'bed');
 const maps=[];const picture=kind==='puzzle'?new T.TextureLoader().load('assets/reef.png',()=>maps.forEach(({map,face})=>{map.needsUpdate=true;face.material.map=map;face.material.needsUpdate=true})):null;
 if(picture)picture.colorSpace=T.SRGBColorSpace;
 for(let i=0;i<count;i++){
  const x=(i%cols-(cols-1)/2)*step,y=((rows-1)/2-Math.floor(i/cols))*step;
  if(kind==='memory'){
   themedSurface(a,bevelBox(a.scene,'#ffffff',[x,y,-.1],[1.85,1.85,.24]),'pad');
   const hidden=state.memory.phase==='blank'||((state.memory.phase==='answer'||state.memory.phase==='done')&&i===state.memory.missingIndex);
   if(!hidden){const model=objectModel(state.memory.items[i][1]);model.scale.setScalar(.62);model.position.set(x,y+.17,.15);model.rotation.y=-.22;a.scene.add(model);a.items.push({mesh:model,x,y:y+.17});themedSurface(a,label(a.scene,state.memory.items[i][1],x,y-.65,1.7,'#ffffff'),'label')}else if(state.memory.phase!=='blank')themedSurface(a,label(a.scene,'?',x,y,1.5,'#ffffff'),'label');
  }else{
   const n=kind==='puzzle'?state.puzzle.board[i]:i+1;if(kind==='puzzle'&&n===0)continue;
   const color=kind==='pattern'?(window.ECHO_COLORS?.[i]||'#ad8bff'):'#c6d9c8';
   const tile=bevelBox(a.scene,color,[x,y,.13],[1.8,1.8,.44],.075);
   tile.material.roughness=.3;tile.material.metalness=.08;
   let face,glint;
   if(kind==='pattern'){
    face=bevelBox(tile,color,[0,0,.235],[1.49,1.49,.065],.025);
    face.material.roughness=.24;
    glint=label(tile,'✦',0,.38,.7);glint.position.z=.30;glint.visible=false;
   }
   if(picture){const map=new T.Texture();map.source=picture.source;map.colorSpace=T.SRGBColorSpace;map.repeat.set(1/cols,1/cols);map.offset.set(((n-1)%cols)/cols,1-(Math.floor((n-1)/cols)+1)/cols);if(map.image)map.needsUpdate=true;const face=new T.Mesh(new T.PlaneGeometry(1.64,1.64),new T.MeshStandardMaterial({map:map.image?map:null,roughness:.6}));face.position.z=.223;tile.add(face);maps.push({map,face})}
   const number=label(tile,String(n),0,kind==='pattern'?-.12:-.55,kind==='pattern'?1.65:.9,kind==='pattern'?'#172a42':undefined);number.position.z=kind==='pattern'?.29:.25;
   tile.userData.cell=i;const item={id:n,mesh:tile,face,glint,x,y,cell:i};a.items.push(item);
   if(kind==='puzzle'&&puzzlePositions.has(n)&&state.puzzle.moves>0)tile.position.copy(puzzlePositions.get(n));
  }
 }
 if(picture){a.picture=picture;a.tileMaps=maps;} // TextureLoader's base is disposed separately on scene teardown.
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
  if(a.kind==='guess'){
   a.model.rotation.y=Math.sin(time/1800)*.65;const g=state.guess,blur=g.phase==='active'?Math.max(0,28*(1-(Date.now()-g.started)/g.duration)):0;renderer.domElement.style.filter=`blur(${blur}px)`;
  }else{
   renderer.domElement.style.filter='';
   for(const item of a.items){if(a.kind==='memory'){item.mesh.rotation.y=-.22+Math.sin(time/1600+item.x)*.1;continue}
    const b=a.source.querySelector(a.kind==='pattern'?`[data-cell="${item.cell}"]`:`[data-tile="${item.cell}"]`),lit=b?.classList.contains('lit'),good=b?.classList.contains('correct'),bad=b?.classList.contains('miss');
    item.mesh.position.x=T.MathUtils.damp(item.mesh.position.x,item.x,18,dt);item.mesh.position.y=T.MathUtils.damp(item.mesh.position.y,item.y,18,dt);
    item.mesh.position.z=T.MathUtils.damp(item.mesh.position.z,lit?.5:good?-.02:.13,18,dt);
    const focused=!lit&&!good&&!bad&&document.activeElement===renderer.domElement&&a.focus===item.cell;
    for(const mesh of [item.mesh,item.face].filter(Boolean)){
     mesh.material.emissive.set(bad?'#e6274c':lit?'#fff2e0':good?'#b4ffe5':focused?'#a9a4ff':'#000000');
     mesh.material.emissiveIntensity=lit?.85:good?.3:focused?.35:.5;
    }
    if(item.glint)item.glint.visible=lit||good;
   }
  }
  renderer.render(a.scene,a.camera);
 }catch(error){console.error('3D scene failed; restored 2D controls.',error);failed=true;unmount();document.querySelector('#render-mode')?.replaceChildren(document.createTextNode('2D · graphics unavailable'))}
}
// Tide Eater intentionally uses its photographic, depth-animated canvas renderer.
window.Neuro3D={isFishActive:()=>false,available:()=>!!renderer&&!failed};
const badge=document.createElement('span');badge.id='render-mode';badge.className='nv3d-mode';badge.textContent='3D EDITION';document.querySelector('.top-actions')?.prepend(badge);
requestAnimationFrame(update);
