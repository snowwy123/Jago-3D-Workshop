import {finishedRender} from './render-finish.js';
import {convexQuad} from './authoring.js';import * as T from 'three';
export function installProjection({getProject,getCamera,getCameraState,scene,renderer,content,groups,grid,floor,selectionBox,getTransform,homography,mark,render,getRehearsal}){const $=id=>document.getElementById(id),panel=$('out-project');let active=0,out=null,black=false,drag=-1,last=0;panel.innerHTML='<h3>Map your scene onto physical surfaces</h3><p>Up to four manually aligned planar surfaces. Each can show the full scene or one object. Capture a projector camera to keep it independent of your working view.</p><div class="pair"><select id="mapSurface" aria-label="Projection surface"></select><button id="addMap">＋ Surface</button><button id="deleteMap">Remove</button></div><label>Name<input id="mapName"></label><label>Map from<select id="mapSource"></select></label><p id="mappingRoute" class="hint"></p><label class="inline"><input id="mapEnabled" type="checkbox"> Surface enabled</label><canvas id="mappingCanvas" width="520" height="320" style="width:100%;background:#10191e;touch-action:none;border-radius:6px"></canvas><p class="hint">Drag the numbered corners. Arrow keys nudge the last corner; Shift makes a larger nudge. Keep the outline convex.</p><div class="pair"><button id="captureProjector">Keep current camera for projection</button><button id="liveProjector">Use live working camera</button></div><p id="projectorCameraStatus" class="hint"></p><label class="inline"><input id="testGrid" type="checkbox" checked> Show alignment grid instead of source artwork</label><div class="pair"><button id="projectionOpen" class="primary">Open clean output</button><button id="projectionBlack">Blackout</button><button id="projectionReset">Reset corners</button></div><p class="hint">Mapping and camera are stored in your project. This does not perform automatic calibration, curved mapping or edge blending. Hardware testing is required.</p>';
function sourceName(p,s){
  return s.source==='scene'?'Full scene':p.objects.find(o=>o.id===s.source)?.name||'Missing object';
}
function route(p,s){return sourceName(p,s)+' → '+s.name+(s.enabled?'':' (disabled)');}
function syncRoutes(){
  const p=getProject();
  $('mappingRoute').textContent=route(p,current());
  const diagram=$('sceneProjectionDiagram');
  diagram.innerHTML='<path d="M12 45h25v20H12z M37 50l11-6v22l-11-6z" fill="none" stroke="currentColor" stroke-width="2"/>';
  function element(tag,attributes){
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [name,value] of Object.entries(attributes))node.setAttribute(name,value);
    diagram.append(node);return node;
  }
  p.surfaces.forEach((surface,index)=>{
    const y=(index+1)*110/(p.surfaces.length+1),opacity=surface.enabled?1:.32;
    element('line',{x1:49,y1:55,x2:151,y2:y,stroke:'currentColor',opacity,'stroke-dasharray':'3 3'});
    element('rect',{x:151,y:y-8,width:14,height:16,rx:2,fill:'none',stroke:'currentColor',opacity});
    element('text',{x:171,y:y+4,fill:'currentColor','font-size':10,opacity}).textContent=surface.name.slice(0,12);
  });
  const list=$('sceneMappingSources');
  list.replaceChildren(...p.surfaces.map(s=>{
    const item=document.createElement('li');
    item.textContent=route(p,s);
    return item;
  }));
}
function current(){return getProject().surfaces[active]||getProject().surfaces[0];}function sync(){const p=getProject();active=Math.min(active,p.surfaces.length-1);$('mapSurface').replaceChildren(...p.surfaces.map((s,i)=>new Option(s.name,i)));$('mapSurface').value=active;$('mapSource').replaceChildren(new Option('Full scene','scene'),...p.objects.map(o=>new Option(o.name+(o.visible?'':' (hidden in scene)'),o.id)));$('mapSource').value=current().source;$('mapName').value=current().name;$('mapEnabled').checked=current().enabled;$('projectorCameraStatus').textContent=p.projectorCamera?'Projector camera is fixed. Orbit the editor freely.':'Projector follows the working camera.';syncRoutes();paint();}
function paint(){const c=$('mappingCanvas'),g=c.getContext('2d');g.clearRect(0,0,520,320);g.fillStyle='#10191e';g.fillRect(0,0,520,320);g.strokeStyle='#33454c';for(let x=0;x<=520;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,320);g.stroke();}for(let y=0;y<=320;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(520,y);g.stroke();}getProject().surfaces.forEach((s,index)=>{g.strokeStyle=index===active?'#e7bd70':'#799e9a';g.lineWidth=index===active?3:1;g.beginPath();s.quad.forEach((q,i)=>i?g.lineTo(q[0]*520,q[1]*320):g.moveTo(q[0]*520,q[1]*320));g.closePath();g.stroke();if(index===active)s.quad.forEach((q,i)=>{g.fillStyle='#e7bd70';g.beginPath();g.arc(q[0]*520,q[1]*320,7,0,7);g.fill();g.font='bold 13px Segoe UI';g.fillText(String(i+1),q[0]*520+10,q[1]*320-8);});});}
const overlay=$('projectionGuideOverlay');
$('showProjectionGuide').onchange=render;
function drawGuide(camera){
  if(!$('showProjectionGuide').checked){if(overlay.firstChild)overlay.replaceChildren();return;}
  overlay.replaceChildren();
  const p=getProject(),state=p.projectorCamera||getCameraState(),w=overlay.clientWidth,h=overlay.clientHeight;
  if(!w||!h)return;
  overlay.setAttribute('viewBox','0 0 '+w+' '+h);
  function project(point){
    const q=point.project(camera);
    if(!Number.isFinite(q.x)||!Number.isFinite(q.y))return [w/2,h-22];
    return [Math.max(22,Math.min(w-22,(q.x+1)*w/2)),Math.max(22,Math.min(h-22,(1-q.y)*h/2))];
  }
  const [x,y]=project(new T.Vector3(...state.position));
  const ns='http://www.w3.org/2000/svg';
  function shape(tag,attributes){
    const node=document.createElementNS(ns,tag);
    for(const [name,value] of Object.entries(attributes))node.setAttribute(name,value);
    overlay.append(node);return node;
  }
  for(const surface of p.surfaces.filter(s=>s.enabled)){
    const source=groups.get(surface.source);
    const target=source?new T.Box3().setFromObject(source).getCenter(new T.Vector3()):new T.Vector3(...state.target);
    const [tx,ty]=project(target);
    shape('line',{x1:x,y1:y,x2:tx,y2:ty,stroke:'#93e2ff','stroke-dasharray':'5 4','stroke-width':2});
    shape('circle',{cx:tx,cy:ty,r:4,fill:'#93e2ff'});
  }
  shape('path',{d:'M'+(x-10)+' '+(y-6)+'h14v12h-14z M'+(x+4)+' '+(y-3)+'l7-4v14l-7-4z',fill:'#153242',stroke:'#93e2ff','stroke-width':2});
}
const map=$('mappingCanvas');map.tabIndex=0;function position(e){const b=map.getBoundingClientRect();return[(e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height];}function move(q){const s=current(),candidate=s.quad.map(p=>p.slice());candidate[drag]=q.map(n=>Math.max(0,Math.min(1,n)));if(!convexQuad(candidate)){ $('outputStatus').textContent='Keep the four corners separated in a convex outline.';return;}s.quad=candidate;paint();update(true);}
map.onpointerdown=e=>{const p=position(e);let distance=.065;drag=-1;current().quad.forEach((q,i)=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<distance){distance=d;drag=i;}});if(drag>=0){map.setPointerCapture(e.pointerId);map.focus();}};map.onpointermove=e=>{if(e.buttons&1&&drag>=0)move(position(e));};map.onpointerup=()=>mark();map.onkeydown=e=>{if(drag<0||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const d=e.shiftKey?.01:.002,q=current().quad[drag].slice();if(e.key==='ArrowLeft')q[0]-=d;if(e.key==='ArrowRight')q[0]+=d;if(e.key==='ArrowUp')q[1]-=d;if(e.key==='ArrowDown')q[1]+=d;move(q);mark();};
$('mapSurface').onchange=()=>{active=+$('mapSurface').value;sync();};$('mapSource').onchange=()=>{current().source=$('mapSource').value;syncRoutes();mark();update(true);};$('mapName').onchange=()=>{current().name=$('mapName').value.slice(0,80)||'Surface';mark();sync();};$('mapEnabled').onchange=()=>{current().enabled=$('mapEnabled').checked;syncRoutes();mark();update(true);};$('addMap').onclick=()=>{const p=getProject();if(p.surfaces.length>=4){$('outputStatus').textContent='This experiment supports four surfaces.';return;}p.surfaces.push({id:crypto.randomUUID(),name:'Surface '+(p.surfaces.length+1),source:'scene',enabled:true,quad:[[.2,.2],[.8,.2],[.8,.8],[.2,.8]]});active=p.surfaces.length-1;mark();sync();update(true);};$('deleteMap').onclick=()=>{const p=getProject();if(p.surfaces.length===1)return;p.surfaces.splice(active,1);active=0;mark();sync();update(true);};$('captureProjector').onclick=()=>{getProject().projectorCamera=getCameraState();mark();sync();update(true);render();};$('liveProjector').onclick=()=>{getProject().projectorCamera=null;mark();sync();update(true);render();};
function capture(source){const p=getProject(),state=p.projectorCamera;let camera=getCamera();if(state){const a=renderer.domElement.width/renderer.domElement.height;camera=state.projection==='perspective'?new T.PerspectiveCamera(state.fov||38,a,.1,20000):new T.OrthographicCamera(-160*a,160*a,160,-160,.1,20000);camera.position.fromArray(state.position);camera.lookAt(new T.Vector3(...state.target));camera.zoom=state.zoom;camera.updateProjectionMatrix();}const visibility=content.children.map(g=>[g,g.visible]),helpers=[grid,selectionBox,getTransform().getHelper(),getRehearsal?.()].filter(Boolean),old=helpers.map(g=>g.visible),bg=scene.background,ff=floor.visible;try{helpers.forEach(g=>g.visible=false);for(const g of content.children)g.visible=p.objects.find(o=>o.id===g.userData.id)?.visible!==false;if(source!=='scene'){for(const g of content.children)g.visible=g.userData.id===source;scene.background=new T.Color('#000000');floor.visible=false;}finishedRender(renderer,scene,camera,p);return renderer.domElement.toDataURL('image/jpeg',.9);}finally{visibility.forEach(([g,v])=>g.visible=v);helpers.forEach((g,i)=>g.visible=old[i]);scene.background=bg;floor.visible=ff;finishedRender(renderer,scene,getCamera(),p);}}
function gridImage(){const c=document.createElement('canvas');c.width=960;c.height=640;const g=c.getContext('2d');g.fillStyle='#102b32';g.fillRect(0,0,960,640);g.strokeStyle='#ffffff';g.font='24px Segoe UI';for(let y=0;y<8;y++)for(let x=0;x<12;x++){g.strokeRect(x*80,y*80,80,80);g.fillStyle=(x+y)%2?'#e6c786':'#b8d5d0';g.fillText(`${x+1}:${y+1}`,x*80+8,y*80+45);}return c.toDataURL();}
function update(force=false){if(!out||out.closed)return;if(!force&&performance.now()-last<110)return;last=performance.now();try{const doc=out.document,root=doc.getElementById('surfaces');if(!root)return;root.style.display=black?'none':'block';if(black)return;const p=getProject();while(root.children.length>p.surfaces.length)root.lastChild.remove();for(let i=0;i<p.surfaces.length;i++){const s=p.surfaces[i];let img=root.children[i];if(!img){img=doc.createElement('img');img.style.cssText='position:absolute;left:0;top:0;width:1px;height:1px;transform-origin:0 0';img.id=i===0?'projected':'projected-'+i;root.append(img);}img.style.display=s.enabled?'block':'none';if(!s.enabled)continue;if(!convexQuad(s.quad))continue;img.src=$('testGrid').checked?gridImage():capture(s.source);img.style.transform='matrix3d('+homography(s.quad,out.innerWidth,out.innerHeight).join(',')+')';}}catch(e){$('outputStatus').textContent=e.message;}}
$('projectionOpen').onclick=()=>{out=window.open('about:blank','JagoWorkshopProjection','width=1100,height=750');if(!out){$('outputStatus').textContent='Allow the clean output window.';return;}const doc=out.document;doc.title='Jago Workshop · projection';doc.body.style.cssText='margin:0;background:black;overflow:hidden';doc.body.innerHTML='<div id="surfaces"></div><button id="full" style="position:fixed;right:12px;bottom:12px;background:#163b3d;color:white;border:1px solid #789;padding:8px;opacity:.7">Fullscreen · Esc to leave</button>';const button=doc.getElementById('full');button.onclick=()=>doc.documentElement.requestFullscreen().catch(()=>{});doc.addEventListener('fullscreenchange',()=>button.style.display=doc.fullscreenElement?'none':'block');doc.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();$('projectionBlack').click();}});out.onresize=()=>update(true);black=false;update(true);};$('testGrid').onchange=()=>update(true);$('projectionBlack').onclick=()=>{black=!black;$('projectionBlack').textContent=black?'Restore output':'Blackout';update(true);};$('projectionReset').onclick=()=>{current().quad=[[.08,.08],[.92,.08],[.92,.92],[.08,.92]];mark();sync();update(true);};return{sync,update,drawGuide,close(){if(out&&!out.closed)out.close();},get window(){return out;}};}
