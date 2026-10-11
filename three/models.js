import * as T from '../vendor/three.module.js';

export const memoryModels=['Lemon','Teddy','Plant','Balloon','Strawberry','Coffee','Cupcake','Mushroom','Books','Sunflower','Pear','Headphones','Kite','Disco ball','Bell','Wood log'];
export const guessModels=['watermelon','giraffe','guitar','donut','owl','canoe','magnet','bubble tea','snail','jellyfish','waffle','nest','fan','coral'];
export function material(color, extra={}) { return new T.MeshStandardMaterial({color,roughness:.38,metalness:.06,...extra}); }
export function shape(group,geometry,color,pos=[0,0,0],scale=[1,1,1],extra={}){
 const mesh=new T.Mesh(geometry,material(color,extra));mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
export function ball(g,c,p=[0,0,0],s=[1,1,1],extra={}){return shape(g,new T.SphereGeometry(1,20,14),c,p,s,extra)}
export function box(g,c,p,s){return shape(g,new T.BoxGeometry(...s),c,p)}
export function tube(g,c,points,r=.04){return shape(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,7,false),c)}
export function ring(g,c,p,r=.45,thickness=.1){return shape(g,new T.TorusGeometry(r,thickness,10,32),c,p)}
function cylinder(g,c,p,top,bottom,height){return shape(g,new T.CylinderGeometry(top,bottom,height,24),c,p)}
function eye(g,x,y,z,r=.06){ball(g,'#fff8dc',[x,y,z],[r*1.6,r*1.6,r*.6]);ball(g,'#132735',[x,y,z+r*.5],[r,r,r*.7])}
export function objectModel(name){
 const g=new T.Group(),key=name.toLowerCase();g.userData.kind=key;
 const leaf=(x,y,z,rz=0)=>{const m=ball(g,'#548958',[x,y,z],[.3,.1,.14]);m.rotation.z=rz;return m};
 switch(key){
 case 'socks':case 'gloves':{
  const glove=key==='gloves';for(const side of [-1,1]){const x=side*.34;box(g,side<0?'#b4a3d2':'#8bbdb9',[x,0,0],[.32,.65,.19]);if(glove){for(let i=0;i<4;i++)ball(g,'#b4a3d2',[x+(i-1.5)*.08,.4,0],[.045,.2,.085]);ball(g,'#b4a3d2',[x+side*.22,0,0],[.13,.22,.08])}else ball(g,'#8bbdb9',[x+.13,-.35,0],[.3,.15,.13])}break;
 }
 case 'butterfly':for(const side of [-1,1]){ball(g,'#8d9fd4',[side*.35,.2,0],[.38,.45,.07]);ball(g,'#b099c9',[side*.27,-.25,0],[.27,.3,.07]);tube(g,'#5c4768',[[0,.2,0],[side*.18,.8,0]],.018)}ball(g,'#4f465f',[0,0,.08],[.07,.5,.08]);break;
 case 'sunglasses':for(const side of [-1,1]){box(g,'#253448',[side*.34,0,0],[.57,.42,.1]);tube(g,'#9ca58e',[[side*.6,.1,0],[side*.65,.1,-.45]],.035)}tube(g,'#9ca58e',[[-.1,.1,0],[0,.15,0],[.1,.1,0]],.035);break;
 case 'seashell':for(let i=0;i<10;i++){const a=(i-4.5)*.22;const m=ball(g,i%2?'#e7b6ab':'#eed5be',[Math.sin(a)*.35,Math.cos(a)*.3-.25,0],[.1,.59,.14]);m.rotation.z=-a}break;
 case 'pretzel':for(const side of [-1,1]){const m=ring(g,'#bd8c51',[side*.24,.05,0],.32,.09);m.scale.y=1.2}tube(g,'#bd8c51',[[-.4,-.38,0],[.1,.25,.09],[.4,-.38,0]],.08);break;
 case 'maraca':ball(g,'#dfad60',[0,.25,0],[.35,.48,.3]);cylinder(g,'#8c6143',[0,-.45,0],.065,.065,.75);ring(g,'#c96864',[0,.2,0],.3,.03).rotation.x=Math.PI/2;break;
 case 'hyacinth':cylinder(g,'#c58a70',[0,-.6,0],.3,.22,.4);tube(g,'#538c5a',[[0,-.4,0],[0,.75,0]],.04);for(let i=0;i<18;i++)ball(g,'#a18ac7',[Math.cos(i*2.4)*.15,i*.052-.04,Math.sin(i*2.4)*.15],[.12,.1,.1]);leaf(.2,-.1,0,.7);break;
 case 'needle':tube(g,'#b9ced9',[[0,-.8,0],[0,.65,0]],.025);ring(g,'#b9ced9',[0,.7,0],.055,.018).scale.y=2;tube(g,'#b57a99',[[0,.75,0],[.3,.85,0],[.45,.3,0]],.012);break;
 case 'accordion':box(g,'#b56268',[-.5,0,0],[.3,1,.55]);box(g,'#b56268',[.5,0,0],[.3,1,.55]);for(let i=0;i<8;i++)box(g,i%2?'#5f5c6c':'#b8b0b8',[(i-3.5)*.09,0,0],[.06,.88,.5]);for(let i=0;i<7;i++)box(g,'#ede4d4',[-.53,(i-3)*.12,.3],[.23,.1,.04]);break;
 case 'lemon':case 'pear':case 'strawberry':case 'watermelon':{
  const color=key==='lemon'?'#f3c849':key==='pear'?'#a3be53':key==='strawberry'?'#dc4758':'#438651';
  ball(g,color,[0,-.1,0],[.65,key==='pear'?.72:.53,.49]);
  if(key==='pear')ball(g,color,[0,.38,0],[.32,.4,.3]);
  if(key==='watermelon'){for(let i=0;i<8;i++){const a=i*Math.PI/4;tube(g,'#254f38',[[Math.cos(a)*.12,.42,Math.sin(a)*.12],[Math.cos(a)*.61,0,Math.sin(a)*.46],[Math.cos(a)*.2,-.59,Math.sin(a)*.16]],.027)}}
  else{tube(g,'#71523b',[[0,.38,0],[.05,.79,0]],.04);leaf(.19,.65,0,.4)}
  if(key==='strawberry')for(let i=0;i<24;i++){const a=i*2.4,y=(i%6)/6*.7-.45,rr=Math.sqrt(Math.max(.1,1-y*y*3));ball(g,'#ffe7a0',[Math.cos(a)*.64*rr,y,Math.sin(a)*.49*rr],[.018,.038,.018])}break;
 }
 case 'teddy':case 'owl':case 'giraffe':{
  const giraffe=key==='giraffe',owl=key==='owl',c=owl?'#97694d':giraffe?'#e7bb68':'#ba845c';
  ball(g,c,[0,-.25,0],[.46,.55,.3]);ball(g,c,[0,giraffe?.77:.43,0],[giraffe?.28:.4,.35,.3]);
  if(giraffe){cylinder(g,c,[0,.32,0],.14,.2,1);for(let i=0;i<6;i++)ball(g,'#835331',[(i%2?1:-1)*.15,i*.19-.36,.25],[.09,.07,.035]);tube(g,'#94633c',[[-.16,.98,0],[-.16,1.24,0]],.04);tube(g,'#94633c',[[.16,.98,0],[.16,1.24,0]],.04)}
  if(!owl)for(const side of [-1,1]){ball(g,c,[side*.33,giraffe?.9:.71,0],[.15,.16,.1]);ball(g,c,[side*.43,-.12,0],[.19,.35,.18]);ball(g,c,[side*.24,-.7,.12],[.23,.17,.25])}
  else{for(const side of [-1,1]){ball(g,'#6c4b38',[side*.4,-.22,0],[.17,.42,.22]);eye(g,side*.17,.45,.28,.12)}shape(g,new T.ConeGeometry(.12,.23,3),'#e4ac55',[0,.21,.34]).rotation.x=Math.PI/2}
  if(!owl){eye(g,-.14,giraffe?.83:.48,.27);eye(g,.14,giraffe?.83:.48,.27);ball(g,'#65483d',[0,giraffe?.66:.32,.3],[.11,.08,.08])}break;
 }
 case 'plant':case 'sunflower':{
  cylinder(g,'#c58a70',[0,-.55,0],.35,.24,.45);tube(g,'#43865b',[[0,-.32,0],[0,.63,0]],.045);leaf(-.22,.04,0,-.5);leaf(.23,.28,0,.4);
  if(key==='plant'){leaf(-.18,.55,0,-.5);leaf(.19,.7,0,.5)}else{for(let i=0;i<12;i++){const a=i*Math.PI/6;const m=ball(g,'#efc64d',[Math.cos(a)*.29,.63+Math.sin(a)*.29,0],[.19,.09,.07]);m.rotation.z=a}ball(g,'#795039',[0,.63,.05],[.19,.19,.1])}break;
 }
 case 'balloon':ball(g,'#ef7187',[0,.35,0],[.5,.63,.43]);tube(g,'#e0d5c5',[[0,-.2,0],[.05,-.6,0],[-.06,-1,0]],.012);break;
 case 'coffee':case 'bubble tea':{
  cylinder(g,key==='coffee'?'#e5e8df':'#c29976',[0,-.05,0],.38,.3,.85);cylinder(g,'#634936',[0,.38,0],.33,.33,.025);
  if(key==='coffee')ring(g,'#e5e8df',[.42,.04,0],.26,.08);else{tube(g,'#635276',[[.12,.4,0],[.25,1,0]],.045);for(let i=0;i<12;i++)ball(g,'#372b30',[(i%4-.5)*.14-.18,-.35+Math.floor(i/4)*.1,.23],[.047,.047,.047])}break;
 }
 case 'cupcake':case 'mushroom':{
  cylinder(g,key==='cupcake'?'#d3a270':'#e5d6b4',[0,-.36,0],.35,.26,.54);
  ball(g,key==='cupcake'?'#edafbd':'#d4554c',[0,.05,0],[.63,.3,.52]);
  if(key==='cupcake'){ball(g,'#efc4ce',[0,.29,0],[.35,.25,.32]);ball(g,'#c95863',[0,.53,0],[.1,.1,.1])}else for(let i=0;i<9;i++){const a=i*2.4;ball(g,'#f7e9d3',[Math.cos(a)*.4,.24,Math.sin(a)*.3],[.07,.045,.07])}break;
 }
 case 'books':for(let i=0;i<3;i++){const b=box(g,['#b9b0d5','#71b2ac','#e3ab77'][i],[0,(i-1)*.22,0],[1.2,.18,.68]);b.rotation.y=i*.15;box(g,'#e8dfcb',[0,(i-1)*.22,.35],[1.05,.11,.025])}break;
 case 'headphones':tube(g,'#58647e',[[-.55,-.35,0],[-.57,.46,0],[0,.73,0],[.57,.46,0],[.55,-.35,0]],.08);for(const side of [-1,1])ball(g,'#303b50',[side*.54,-.25,0],[.19,.32,.23]);break;
 case 'kite':{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,.8,0,-.55,.15,0,0,-.65,0,0,.8,0,0,-.65,0,.55,.15,0],3));geo.computeVertexNormals();shape(g,geo,'#e8a46b',[0,0,0],[1,1,1],{side:T.DoubleSide});tube(g,'#98a8c4',[[0,-.6,0],[.2,-.85,0],[0,-1.1,0]],.02);break}
 case 'disco ball':ball(g,'#bacad8',[0,0,0],[.6,.6,.6],{metalness:.9,roughness:.1,flatShading:true});break;
 case 'bell':shape(g,new T.ConeGeometry(.58,.85,24),'#dbb45c',[0,0,0]);ring(g,'#c59c41',[0,.53,0],.14,.035);ball(g,'#8d6c3a',[0,-.45,0],[.12,.12,.12]);break;
 case 'wood log':{const m=cylinder(g,'#8b6042',[0,0,0],.35,.35,1.4);m.rotation.z=Math.PI/2;for(const side of [-1,1]){const end=cylinder(g,'#d3b58b',[side*.71,0,0],.3,.3,.02);end.rotation.z=Math.PI/2}break}
 case 'donut':ring(g,'#d69f69',[0,0,0],.5,.23);ring(g,'#e6a5b8',[0,0,.13],.5,.16);for(let i=0;i<20;i++){const a=i*2.4;const m=box(g,i%2?'#a4d8bf':'#ffe7a7',[Math.cos(a)*.5,Math.sin(a)*.5,.27],[.07,.025,.025]);m.rotation.z=a}break;
 case 'guitar':ball(g,'#bf834d',[0,-.35,0],[.48,.52,.16]);ball(g,'#bf834d',[0,.06,0],[.35,.35,.16]);box(g,'#714c38',[0,.67,0],[.13,1.1,.13]);box(g,'#b98753',[0,1.22,0],[.23,.3,.16]);ball(g,'#382d2c',[0,-.12,.16],[.14,.14,.025]);for(let i=0;i<4;i++)tube(g,'#d9d5bf',[[(i-1.5)*.025,-.6,.19],[(i-1.5)*.025,1.3,.1]],.005);break;
 case 'canoe':{
  ball(g,'#b77a4c',[0,-.18,0],[.95,.25,.38]);ball(g,'#55483b',[0,-.03,0],[.78,.06,.27]);tube(g,'#d9b585',[[-.7,.18,.2],[.7,.18,-.2]],.04);ball(g,'#d9b585',[.7,.18,-.2],[.27,.06,.14]);break;
 }
 case 'magnet':tube(g,'#cb5965',[[-.42,.5,0],[-.42,-.2,0],[0,-.55,0],[.42,-.2,0],[.42,.5,0]],.15);for(const side of [-1,1])cylinder(g,'#dbe4e8',[side*.42,.48,0],.15,.15,.25);break;
 case 'snail':ball(g,'#a0b77c',[0,-.42,0],[.85,.19,.22]);ball(g,'#c09268',[-.12,-.02,0],[.5,.49,.3]);ring(g,'#805839',[-.12,-.02,.28],.29,.035);ring(g,'#805839',[-.12,-.02,.3],.13,.03);for(const x of [.52,.75]){tube(g,'#a0b77c',[[x,-.35,0],[x+.06,.16,0]],.025);eye(g,x+.06,.16,.015,.04)}break;
 case 'jellyfish':ball(g,'#b7a0d9',[0,.35,0],[.62,.35,.52],{transparent:true,opacity:.72});for(let i=0;i<7;i++)tube(g,'#c7b6e4',[[(i-3)*.14,.2,0],[(i-3)*.17,-.3,.1],[(i-3)*.12,-.85,0]],.025);break;
 case 'waffle':box(g,'#d3a263',[0,0,0],[1.2,1.2,.2]);for(let i=0;i<5;i++){box(g,'#edc790',[(i-2)*.23,0,.13],[.04,1.2,.09]);box(g,'#edc790',[0,(i-2)*.23,.13],[1.2,.04,.09])}break;
 case 'nest':for(let i=0;i<9;i++){const m=ring(g,i%2?'#b09065':'#89704d',[0,-.3+i*.025,0],.55-i*.01,.045);m.rotation.x=Math.PI/2;m.rotation.z=i*.1}for(let i=0;i<3;i++)ball(g,'#b4d7d7',[(i-1)*.27,-.15,0],[.16,.23,.16]);break;
 case 'fan':for(let i=0;i<9;i++){const a=(i-4)*.24;const m=box(g,i%2?'#da8897':'#e9b3bc',[Math.sin(a)*.4,Math.cos(a)*.4-.3,0],[.16,1,.05]);m.rotation.z=-a}break;
 case 'coral':for(let i=0;i<9;i++){const a=i*2.4;tube(g,i%2?'#e69b85':'#ce7d8d',[[0,-.7,0],[Math.cos(a)*.3,-.1,Math.sin(a)*.2],[Math.cos(a)*.65,.4+(i%3)*.15,Math.sin(a)*.35]],.065)}break;
 default:throw new Error('Missing 3D object: '+name);
 }
 return g;
}

export function fishModel(kind='prey',color='#66b6b7'){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const whale=kind==='whale',shark=kind==='shark',tuna=kind==='tuna',jelly=kind==='jelly';
 if(jelly){root.add(objectModel('jellyfish'));root.userData.tail=null;return root}
 const length=whale?1.55:1.25,depth=whale?.46:shark?.35:.37;
 // Closed, lit volumetric body with a tapered nose and caudal peduncle.
 const points=[[-1.05,.08],[-.8,.19],[-.45,depth*.92],[0,depth],[.55,depth*.83],[1,.19],[length,.025]];
 const positions=[],colors=[],indices=[],rings=18;
 const back=new T.Color(tuna?'#163857':whale?'#294c65':shark?'#486477':kind==='barracuda'?'#526b61':color),belly=new T.Color('#dae7de'),gold=new T.Color('#d6bd59');
 points.forEach(([x,r],i)=>{for(let j=0;j<=rings;j++){const a=j/rings*Math.PI*2,y=Math.cos(a)*r,z=Math.sin(a)*r*.65;positions.push(x,y,z);const c=back.clone().lerp(belly,Math.pow((1-Math.cos(a))/2,.8));if(tuna&&Math.abs(Math.cos(a))<.2)c.lerp(gold,.7);colors.push(c.r,c.g,c.b);if(i<points.length-1&&j<rings){const k=i*(rings+1)+j;indices.push(k,k+1,k+rings+1,k+1,k+rings+2,k+rings+1)}}});
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
 shape(body,geo,'#ffffff',[0,0,0],[1,1,1],{vertexColors:true,metalness:whale?.12:.38,roughness:.35,side:T.DoubleSide});
 const fin=(g,verts,c)=>{const f=new T.BufferGeometry();f.setAttribute('position',new T.Float32BufferAttribute(verts,3));f.computeVertexNormals();return shape(g,f,c,[0,0,0],[1,1,1],{side:T.DoubleSide,roughness:.5})};
 const finColor=tuna?'#d4ba58':back;
 const tail=new T.Group();tail.position.x=-1.02;body.add(tail);
 fin(tail,[0,0,0,-.65,.65,0,-.42,.04,0,0,0,0,-.42,-.04,0,-.65,-.65,0],finColor);
 if(whale)tail.rotation.x=Math.PI/2;
 fin(body,[-.55,.28,0,-.23,whale?.52:.84,0,.25,.36,0],finColor);
 for(const side of [-1,1]){
  fin(body,[.3,-.1,side*.12,-.42,whale?-.75:-.4,side*(whale?.72:.45),-.12,-.14,side*.18],finColor);
  ball(body,'#cfbb72',[.98,.09,side*.13],[.075,.075,.035]);ball(body,'#0b1720',[1,.09,side*.16],[.048,.048,.018]);
  for(let i=0;i<(shark?5:1);i++)tube(body,'#263d48',[[.54-i*.055,.18,side*.23],[.48-i*.055,-.03,side*.24],[.53-i*.055,-.18,side*.17]],.012);
 }
 if(tuna)for(let i=0;i<6;i++)for(const side of [-1,1])fin(body,[-.9+i*.1,side*.14,0,-.84+i*.1,side*.28,0,-.78+i*.1,side*.18,0],finColor);
 if(shark||kind==='barracuda')for(let i=0;i<6;i++)fin(body,[.8+i*.065,-.1,.12,.84+i*.065,-.18,.12,.87+i*.065,-.1,.12],'#eee9d3');
 root.userData.tail=tail;root.userData.body=body;root.userData.kind=kind;return root;
}
export function disposeObject(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
