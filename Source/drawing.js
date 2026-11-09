import workerSource from './print-worker-source.js';
import {authoredOutline} from './outline-path.js';
import {outlineCheck,profileCheck,simplify} from './authoring.js';
export function installDrawing({current,commit,object,addObject,status}){const $=id=>document.getElementById(id),dialog=$('drawDialog'),canvas=$('drawing'),ctx=canvas.getContext('2d');let points=[],mode='outline',tool='points',drag=-1,stroke=false,undo=[],redo=[];const controls=document.createElement('div');controls.className='pair';controls.innerHTML='<select id="drawTool" aria-label="Drawing tool"><option value="points">Place points</option><option value="freehand">Freehand</option><option value="move">Move points</option></select><label class="inline"><input id="drawSnap" type="checkbox"> Snap 5 mm</label><button id="drawSimplify">Simplify</button>';canvas.before(controls);const report=document.createElement('p');report.id='drawReport';report.className='hint';canvas.after(report);canvas.style.touchAction='none';let editId=null;const more=document.createElement('div');more.className='pair';more.innerHTML='<label class="inline"><input id="drawSmooth" type="checkbox"> Round drawn corners</label>';canvas.before(more);let profileWidth=90;
let contours=[],activeContour=0,rings=[],revision=0,worker=null,pending=null;
const outlineTools=document.createElement('div');
outlineTools.className='pair';
outlineTools.innerHTML='<label>Contour<select id="drawContour"></select></label><button id="drawAdd">Add shape</button><button id="drawCut">Subtract shape</button><button id="drawRemove">Remove contour</button>';
more.replaceWith(outlineTools,more);
function refreshContours(){
  $('drawContour').replaceChildren(...contours.map((c,i)=>new Option(i===0?'1 · Base':(i+1)+' · '+(c.operation==='add'?'Add':'Subtract'),i)));
  $('drawContour').value=activeContour;
  $('drawRemove').disabled=activeContour===0;
  $('drawSmooth').disabled=contours.length>1;
  $('drawSmooth').parentElement.title=contours.length>1?'Corner rounding is available for a single outline.':'';
}
function selectContour(index){
  contours[activeContour].points=points;
  activeContour=index;points=contours[index].points;undo=[];redo=[];refreshContours();paint();
}
function appendContour(operation){
  try{
    outlineCheck(points);
    if(contours.length>=16)throw Error('Use up to 16 contours.');
    contours.push({operation,points:[]});selectContour(contours.length-1);
  }catch(e){report.textContent=e.message;}
}
$('drawContour').onchange=e=>selectContour(+e.target.value);
$('drawAdd').onclick=()=>appendContour('add');
$('drawCut').onclick=()=>appendContour('subtract');
$('drawRemove').onclick=()=>{
  contours.splice(activeContour,1);activeContour=0;points=contours[0].points;
  undo=[];redo=[];refreshContours();paint();
};
function combine(source){
  return new Promise((resolve,reject)=>{
    if(!worker){
      const url=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
      worker=new Worker(url);URL.revokeObjectURL(url);
    }
    const task=()=>new Promise((done,fail)=>{
      worker.onmessage=({data})=>{if(data.ok)done(data.rings);else fail(Error(data.error));};
      worker.onerror=()=>fail(Error('Could not combine the contours.'));
      worker.postMessage({contours:source});
    });
    pending=(pending||Promise.resolve()).catch(()=>{}).then(task);
    pending.then(resolve,reject);
  });
}
function combinedArtwork(result){
  if(!result.length)throw Error('The cuts remove the entire outline.');
  const all=result.flat(),left=Math.min(...all.map(p=>p[0])),right=Math.max(...all.map(p=>p[0]));
  const top=Math.max(...all.map(p=>p[1])),bottom=Math.min(...all.map(p=>p[1]));
  const path=result.map(ring=>'M'+ring.map(([x,y])=>[x-left,top-y].join(',')).join(' L')+' Z').join(' ');
  return {width:right-left,height:top-bottom,svg:'<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="'+path+'"/></svg>'};
}
function schedulePreview(){
  const turn=++revision;
  clearTimeout(previewTimer);
  previewTimer=setTimeout(async()=>{
    if(!dialog.open||turn!==revision)return;
    try{
      const valid=contours.filter(c=>c.points.length>=3);
      if(!valid.length||valid[0]!==contours[0])return;
      valid.forEach(c=>outlineCheck(c.points));
      const result=await combine(valid);
      if(turn===revision){rings=result;paint(false);}
    }catch{}
  },100);
}
let previewTimer;
function save(){undo.push(structuredClone(points));if(undo.length>40)undo.shift();redo=[];}function pos(e){const r=canvas.getBoundingClientRect();let x=(e.clientX-r.left)/r.width*180-(mode==='profile'?90:0),y=(1-(e.clientY-r.top)/r.height)*120;if(mode==='profile'){x*=profileWidth/90;y*=2.5;}if($('drawSnap').checked){x=Math.round(x/5)*5;y=Math.round(y/5)*5;}return[Math.max(0,Math.min(mode==='profile'?profileWidth:180,x)),Math.max(0,Math.min(mode==='profile'?300:120,y))];}function near(p){let at=-1,d=5;points.forEach((q,i)=>{let v=Math.hypot(p[0]-q[0],p[1]-q[1]);if(v<d){d=v;at=i;}});return at;}
function paint(refresh=true){if(mode!=='profile'&&contours.length){contours[activeContour].points=points;if(refresh&&contours.length>1)schedulePreview();}ctx.clearRect(0,0,540,360);ctx.strokeStyle='#bdc7bc';ctx.lineWidth=1;for(let x=0;x<=540;x+=15){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,360);ctx.stroke();}for(let y=0;y<=360;y+=15){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(540,y);ctx.stroke();}if(mode==='profile'){
  ctx.beginPath();
  ctx.moveTo(270,0);ctx.lineTo(270,360);ctx.strokeStyle='#71654e';ctx.lineWidth=2;ctx.stroke();
  ctx.font='14px Segoe UI';ctx.fillStyle='#544b3c';ctx.fillText('Rotation axis',279,20);
  if(points.length>1){
    const side=points.slice().sort((a,b)=>a[1]-b[1]);
    ctx.beginPath();
    for(const sign of [1,-1]){
      for(const [x,y] of sign===1?side:side.slice().reverse())ctx.lineTo(270+sign*x*270/profileWidth,360-y*1.2);
    }
    ctx.closePath();ctx.fillStyle='#8fbbb377';ctx.fill();ctx.strokeStyle='#6e9c96';ctx.stroke();
  }
}
if(mode!=='profile'&&contours.length>1){
  ctx.beginPath();
  for(const ring of rings){
    ring.forEach(([x,y],i)=>i?ctx.lineTo(x*3,360-y*3):ctx.moveTo(x*3,360-y*3));
    ctx.closePath();
  }
  ctx.fillStyle='#8fbbb388';ctx.fill('evenodd');
}
const offset=mode==='profile'?270:0, sx=mode==='profile'?270/profileWidth:3, sy=mode==='profile'?1.2:3;
ctx.strokeStyle='#326e70';ctx.fillStyle='#8fbbb344';ctx.lineWidth=2.5;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(offset+p[0]*sx,360-p[1]*sy):ctx.moveTo(offset+p[0]*sx,360-p[1]*sy));if(mode!=='profile'&&points.length>2){ctx.closePath();if(contours.length<=1)ctx.fill();}ctx.stroke();ctx.font='12px Segoe UI';for(let i=0;i<points.length;i++){const p=points[i];ctx.fillStyle=i===0?'#cf8357':'#366f72';ctx.beginPath();ctx.arc(offset+p[0]*sx,360-p[1]*sy,4,0,7);ctx.fill();if(points.length<25)ctx.fillText(String(i+1),offset+p[0]*sx+6,360-p[1]*sy-6);}let message=points.length+' points · drag a point to reshape · right-click a point to remove';try{if(points.length>2)mode!=='profile'?outlineCheck(points):profileCheck(points);}catch(e){message=e.message;}report.textContent=message;}
function open(next='outline'){mode=next;const holes=mode==='edit'?current()?.outlineHoles||[]:[];$('drawSmooth').checked=mode==='edit'&&!!current()?.outlineSmooth;more.hidden=mode==='profile';editId=mode==='profile'||mode==='edit'?current()?.id:null;points=mode==='profile'?current().profile.filter(p=>p[0]>.1).map(p=>p.slice()):mode==='edit'?structuredClone(current().outline||[]):[];profileWidth=mode==='profile'?Math.max(45,Math.min(150,Math.ceil(Math.max(...points.map(p=>p[0]))/30)*30+15)):90;
activeContour=0;rings=[];revision++;
outlineTools.hidden=mode==='profile';
contours=mode==='profile'?[]:structuredClone((mode==='edit'&&current()?.outlineContours)||[{operation:'add',points},...holes.map(points=>({operation:'subtract',points}))]);
if(contours.length){points=contours[0].points;refreshContours();}
undo=[];redo=[];tool='points';$('drawTool').value=tool;$('drawTitle').textContent=mode==='profile'?'Edit turned form':'Draw your own outline';$('drawHint').textContent=mode==='profile'?'Edit the points on the right from bottom to top. The shaded silhouette shows the result on both sides of the rotation axis.':'Place points or draw freehand. Drag points to refine the outline. The top of your drawing stays at the top of the object.';$('drawFinish').textContent=editId?'Apply changes':'Make object';report.textContent='';dialog.showModal();paint();}
canvas.onclick=null;canvas.onpointerdown=e=>{if(e.button!==0)return;if(mode==='profile'&&e.clientX<canvas.getBoundingClientRect().left+canvas.getBoundingClientRect().width/2)return;const p=pos(e);save();drag=near(p);if(drag<0){if(tool==='move')return;if(points.length>=160){status('Simplify the outline before adding more points.');return;}points.push(p);drag=points.length-1;}stroke=tool==='freehand';canvas.setPointerCapture(e.pointerId);paint();};canvas.onpointermove=e=>{if(!(e.buttons&1)||drag<0)return;const p=pos(e);if(stroke){if(Math.hypot(p[0]-points.at(-1)[0],p[1]-points.at(-1)[1])>1&&points.length<160){points.push(p);drag=points.length-1;}}else points[drag]=p;paint();};canvas.onpointerup=()=>{drag=-1;if(stroke&&points.length>10)points=simplify(points,.8);stroke=false;paint();};canvas.oncontextmenu=e=>{e.preventDefault();let n=near(pos(e));if(n>=0){save();points.splice(n,1);paint();}};$('drawTool').onchange=()=>tool=$('drawTool').value;$('drawSimplify').onclick=()=>{save();points=simplify(points,1.3);paint();};$('drawUndo').onclick=()=>{if(!undo.length)return;redo.push(points);points=undo.pop();paint();};$('drawClear').onclick=()=>{save();points=[];paint();};$('drawCancel').onclick=()=>dialog.close();$('drawFinish').onclick=async()=>{const button=$('drawFinish');button.disabled=true;try{if(mode==='profile'){const p=profileCheck(points);if(current()?.id!==editId)throw Error('Select the profile object again.');const ok=commit(()=>current().profile=p);if(ok!==false)dialog.close();else report.textContent=document.getElementById('status').textContent;}else{const source=contours[0].points,allHoles=[],draft=structuredClone(contours);
draft.forEach(c=>outlineCheck(c.points));
const token=revision;
const p=draft.length>1?combinedArtwork(await combine(draft)):authoredOutline(source,allHoles,$('drawSmooth').checked);
if(!dialog.open||token!==revision)return;
const o=object('svg',{name:'My drawn cut-out',outline:structuredClone(source),outlineHoles:structuredClone(allHoles),outlineContours:draft,outlineSmooth:$('drawSmooth').checked,svg:p.svg,width:p.width,height:p.height,depth:5,bevel:.3});const ok=commit(()=>{if(mode==='edit'){if(current()?.id!==editId)throw Error('Select the original cut-out again.');current().svg=p.svg;current().outline=o.outline;current().outlineHoles=o.outlineHoles;current().outlineContours=draft;current().outlineSmooth=o.outlineSmooth;}else addObject(o);});if(ok!==false)dialog.close();else report.textContent=document.getElementById('status').textContent;}}catch(e){report.textContent=e.message;}finally{button.disabled=false;}};dialog.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey&&redo.length){undo.push(points);points=redo.pop();paint();}else $('drawUndo').click();}});$('draw').onclick=()=>open('outline');return{open,get points(){return structuredClone(points);}};}
