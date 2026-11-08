// SPDX-License-Identifier: MIT
import * as T from 'three';
import {zipSync,strToU8} from 'fflate';
import {readGLB} from './glb-import.js';
import {captureLook,applyLook} from './presentation-model.js';
import {projectedCallouts} from './surface-artwork.js';
import {creaseSVG} from './creases.js';

export function installPresentation(api) {
  const $ = id => document.getElementById(id);
  const overlay = $('calloutOverlay');
  let placement = null;
  let decalImage = null;
  let adjustment = null;
  let busy = false;
  let revision = 0;
  const status = text => $('presentationStatus').textContent = text;
  function sync() {
    const p = api.getProject(), object = api.current();
    $('surfaceObjectName').textContent = object?.name || 'Select an object';
    const decals = $('decalSelect'), notes = $('calloutSelect'), looks = $('lookSelect');
    for (const [select,entries,label] of [[decals,object?.decals,'Artwork'],[notes,object?.callouts,'Callout'],[looks,p.variants,'Look']]) {
      const prior = select.value;
      select.replaceChildren(...(entries||[]).map((entry,index)=>new Option(entry.name||entry.text||label+' '+(index+1),index)));
      if ([...select.options].some(o=>o.value===prior)) select.value=prior;
      select.disabled = !select.options.length;
    }
    syncDecal();
    syncCompare();
    $('removeCallout').disabled = !notes.options.length || !!object?.locked;
    $('applyLook').disabled = $('deleteLook').disabled = !looks.options.length;
    $('compareLooks').disabled = looks.options.length<2;
  }
  function syncCompare() {
    const select = $('compareAgainst'), look = $('lookSelect').value, previous = select.value;
    select.replaceChildren(...api.getProject().variants.map((entry,index)=>new Option(entry.name,index)).filter(option=>option.value!==look));
    if ([...select.options].some(option=>option.value===previous)) select.value=previous;
    select.disabled=!select.options.length;
  }
  $('lookSelect').onchange=syncCompare;
  function syncDecal() {
    const object = api.current();
    const decal = $('decalSelect').value === '' ? null : object?.decals?.[+$('decalSelect').value];
    for (const [id,key] of [['decalSize','size'],['decalAngle','angle']]) {
      $(id).value = decal?.[key] ?? '';
      $(id).disabled = !decal || !!(object?.locked||object?.linkedSource);
    }
    $('adjustDecal').disabled = $('removeDecal').disabled = !decal || !!(object?.locked||object?.linkedSource);
  }
  function cancelPlacement() {
    placement = null;
    adjustment = null;
    decalImage = null;
    api.canvas.classList.remove('surfacePlacement');
    api.attach();
  }
  function begin(kind) {
    const object = api.current();
    if (!object || object.locked) throw Error('Select an unlocked object first.');
    if (kind==='decal'&&object.linkedSource) throw Error('Place shared artwork on the source object or detach this copy.');
    if (object.sheet?.wind || object.sheet?.bake && !object.sheet.crease) throw Error('Use a static sheet pose for surface placement.');
    if (kind==='decal' && object.decals.length>=6 || kind==='note' && object.callouts.length>=12) throw Error('This object has reached its placement limit.');
    api.pause();
    api.detach();
    placement = {kind, id:object.id, project:api.getProject(), text:$('calloutText').value.trim()};
    api.canvas.classList.add('surfacePlacement');
    status('Click the selected surface to place. Esc cancels.');
  }
  function place(hit) {
    if (!placement) return false;
    if (placement.project!==api.getProject()) {
      cancelPlacement();
      return false;
    }
    if (!hit || hit.object.userData.id!==placement.id || hit.object.userData.decoration) return true;
    const {kind,id,text} = placement, texture = decalImage;
    const target = hit.object;
    target.updateWorldMatrix(true,false);
    const group = api.groups.get(id);
    const sheet = api.current()?.sheet;
    const uv = sheet && hit.uv ? hit.uv.toArray() : null;
    const point = (kind==='note'?group:target).worldToLocal(hit.point.clone()).toArray();
    const normal = hit.face.normal.toArray();
    cancelPlacement();
    api.commit(() => {
      const object = api.getProject().objects.find(o=>o.id===id);
      if (kind==='note') object.callouts.push({text,point,uv});
      else object.decals.push({texture,point,normal,uv,size:Math.min(40,object.width*.4),angle:0});
    });
    status(kind==='note'?'Callout placed.':'Artwork placed. Select it to adjust size or rotation.');
    return true;
  }
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && (placement||adjustment)) { cancelPlacement(); status('Placement cancelled.'); }
  });
  $('adjustDecal').onclick=()=>{
    const object=api.current(), index=+$('decalSelect').value, decal=object?.decals?.[index];
    if (!decal || object.locked) return;
    cancelPlacement();
    api.pause();
    api.detach();
    adjustment={project:api.getProject(),object,index,size:decal.size,angle:decal.angle};
    api.canvas.classList.add('surfacePlacement');
    status('Drag horizontally for width and vertically for rotation. Release to apply, Esc to cancel.');
  };
  api.canvas.addEventListener('pointerdown',event=>{
    if(!adjustment || event.button!==0) return;
    if(adjustment.project!==api.getProject() || adjustment.object!==api.current()) {
      cancelPlacement();
      return;
    }
    event.preventDefault();event.stopImmediatePropagation();
    Object.assign(adjustment,{pointer:event.pointerId,x:event.clientX,y:event.clientY});
    api.canvas.setPointerCapture(event.pointerId);
  },true);
  function adjustValue(event) {
    return {
      size:Math.round(Math.max(1,Math.min(300,adjustment.size*Math.exp((event.clientX-adjustment.x)/180)))*10)/10,
      angle:Math.round(Math.max(-360,Math.min(360,adjustment.angle+event.clientY-adjustment.y)))
    };
  }
  api.canvas.addEventListener('pointermove',event=>{
    if(adjustment?.pointer!==event.pointerId) return;
    event.stopImmediatePropagation();
    const value=adjustValue(event);
    status(value.size+' mm wide · '+value.angle+'°');
  },true);
  api.canvas.addEventListener('pointerup',event=>{
    if(adjustment?.pointer!==event.pointerId) return;
    event.stopImmediatePropagation();
    const value=adjustValue(event), target=adjustment;
    cancelPlacement();
    if(target.project===api.getProject() && target.object===api.current()) {
      api.commit(()=>Object.assign(api.current().decals[target.index],value));
      status('Artwork adjusted.');
    }
  },true);
  api.canvas.addEventListener('lostpointercapture',()=>{if(adjustment?.pointer!==undefined)cancelPlacement();});
  $('decalSelect').onchange=syncDecal;
  for (const [id,key] of [['decalSize','size'],['decalAngle','angle']]) $(id).onchange=()=>{
    const index=+$('decalSelect').value, value=+$(id).value;
    api.commit(()=>api.current().decals[index][key]=value);
  };
  $('removeDecal').onclick=()=>api.commit(()=>api.current().decals.splice(+$('decalSelect').value,1));
  $('removeCallout').onclick=()=>api.commit(()=>api.current().callouts.splice(+$('calloutSelect').value,1));
  $('placeCallout').onclick=()=>{
    try {
      if (!$('calloutText').value.trim()) throw Error('Write the callout first.');
      begin('note');
    } catch(error) { status(error.message); }
  };
  $('placeDecal').onclick=()=>$('decalFile').click();
  $('decalFile').onchange=async event=>{
    const file=event.target.files[0], p=api.getProject(), object=api.current(), request=++revision;
    event.target.value='';
    if (!file) return;
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size>1_450_000) throw Error('Choose a PNG, JPEG or WebP under 1.45 MB.');
      const texture=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=reject;
        reader.readAsDataURL(file);
      });
      await api.decodeAssets({objects:[{texture}]});
      if(request!==revision||p!==api.getProject()||object!==api.current()) return;
      begin('decal');
      decalImage=texture;
    } catch(error) { status(error.message); }
  };
  $('importGLB').onclick=()=>$('glbFile').click();
  $('glbFile').onchange=async event=>{
    const file=event.target.files[0], p=api.getProject(), request=++revision;
    event.target.value='';
    if (!file) return;
    try {
      status('Reading model…');
      const objects=await readGLB(file,api.object);
      for (const object of objects) object.y+=p.surfaceHeight||0;
      const candidate=api.validate({...p,objects:[...p.objects,...objects]});
      await api.decodeAssets(candidate);
      if(request!==revision||p!==api.getProject()) return;
      if (api.commit(()=>api.getProject().objects.push(...objects))) {
        api.setSelection(objects.map(o=>o.id),objects[0].id);
        api.frameSelection();
        status('Imported '+objects.length+' parts. Ctrl-click to select individual parts.');
      }
    } catch(error) { status(error.message); }
  };
  $('centreImported').onclick=()=>api.placeSelection('centre');
  $('restImported').onclick=()=>api.placeSelection('rest');
  $('scaleImported').onclick=()=>api.placeSelection('scale',+$('targetSize').value);
  $('saveLook').onclick=()=>{
    const p=api.getProject();
    if (p.variants.length>=8) { status('Save up to eight looks per project.'); return; }
    api.commit(()=>p.variants.push(captureLook(p,$('lookName').value.trim()||'Look '+(p.variants.length+1))));
  };
  $('deleteLook').onclick=()=>api.commit(()=>api.getProject().variants.splice(+$('lookSelect').value,1));
  $('applyLook').onclick=async()=>{
    const p=api.getProject(), look=p.variants[+$('lookSelect').value], request=++revision;
    if (!look) return;
    try {
      const candidate=structuredClone(p);
      applyLook(candidate,look);
      await api.decodeAssets(candidate);
      if (request===revision && p===api.getProject()) api.commit(()=>applyLook(api.getProject(),look));
    } catch(error) {status(error.message);}
  };
  function draw(camera) {
    overlay.replaceChildren();
    if (!$('showCallouts').checked) return;
    const width=api.canvas.clientWidth, height=api.canvas.clientHeight;
    for (const note of projectedCallouts(api.getProject(),api.groups,camera,width,height,true)) {
      const label=document.createElement('span');
      label.textContent=note.text;
      label.style.left=Math.min(width-12,note.x)+'px';
      label.style.top=note.y+'px';
      overlay.append(label);
    }
  }
  $('showCallouts').onchange=api.render;
  function getViews() {
    const p=api.getProject(), names=['Working view','Front','Detail'];
    return Array.from({length:3},(_,index)=>p.cameras[index] || {name:names[index], fallback:index});
  }
  const snapshot = (name,canvas) => ({name,canvas});
  function contactSheet(frames, title, subtitle='') {
    const canvas=document.createElement('canvas');
    canvas.width=30+frames.length*650;
    canvas.height=620;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f2ebde';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#26383d';
    ctx.font='bold 34px Segoe UI';
    ctx.fillText(title,24,47,canvas.width-48);
    ctx.font='20px Segoe UI';
    ctx.fillText(subtitle,24,78,canvas.width-48);
    frames.forEach(({canvas,name},index)=>{
      const x=24+index*650;
      ctx.drawImage(canvas,x,100,630,472);
      ctx.fillText(name,x,602,630);
    });
    return canvas;
  }
  function flatView(object) {
    const canvas=document.createElement('canvas');
    canvas.width=640;canvas.height=480;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#faf4e7';ctx.fillRect(0,0,640,480);
    const factor=Math.min(548/object.width,330/object.height), w=object.width*factor, h=object.height*factor;
    const x=(640-w)/2,y=(430-h)/2;
    ctx.strokeStyle='#ab3030';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
    const {panels,angle}=object.sheet.crease;
    for(let i=1;i<panels;i++) {
      ctx.strokeStyle=((i%2===1)===(angle>=0))?'#0055cc':'#008844';
      ctx.beginPath();ctx.moveTo(x+w*i/panels,y);ctx.lineTo(x+w*i/panels,y+h);ctx.stroke();
    }
    ctx.fillStyle='#26383d';ctx.font='17px Segoe UI';
    ctx.fillText(object.width+' × '+object.height+' mm · blue mountain / green valley',24,448,592);
    return {name:'Flat cut and score pattern',canvas};
  }
  const pngBytes = async canvas => new Uint8Array(await (await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))).arrayBuffer());
  $('presentationExport').onclick=async()=>{
    if (busy) return;
    busy=true;
    try {
      const project=api.getProject(), fold=api.current(), frames=api.captureViews(getViews(),$('presentationCallouts').checked);
      const dimensions=$('presentationDimensions').checked && api.measure()?.map(n=>n.toFixed(1)).join(' × ');
      const subtitle=[$('presentationCaption').value.trim(),dimensions?'Selection bounds · '+dimensions+' mm':''].filter(Boolean).join('  |  ');
      const layout=fold?.sheet?.crease ? [...frames,flatView(fold)] : frames;
      const files={'presentation.png':await pngBytes(contactSheet(layout,project.name,subtitle))};
      for (const [index,frame] of frames.entries()) files['view-'+(index+1)+'.png']=await pngBytes(frame.canvas);
      if (fold?.sheet?.crease) files['flat-pattern.svg']=strToU8(creaseSVG(fold.width,fold.height,fold.sheet.crease));
      api.download(new Blob([zipSync(files,{level:0})],{type:'application/zip'}),api.filename()+'-presentation.zip');
      $('outputStatus').textContent='Presentation sheet and individual views saved.';
    } catch(error) { $('outputStatus').textContent=error.message; }
    finally {busy=false;}
  };
  $('compareLooks').onclick=async()=>{
    if(busy) return;
    busy=true;
    const original=api.getProject(), start=+$('lookSelect').value;
    try {
      const next=+$('compareAgainst').value;
      const frames=[];
      for(const index of [start,next]) {
        const look=original.variants[index], candidate=structuredClone(original);
        applyLook(candidate,look);
        await api.decodeAssets(candidate);
        if(api.getProject()!==original) return;
        frames.push(snapshot(look.name,api.captureLook(candidate)));
      }
      const dialog=$('compareLookDialog'), result=$('compareLookViews');
      result.replaceChildren();
      for(const {name,canvas} of frames) {
        const figure=document.createElement('figure'), caption=document.createElement('figcaption');
        caption.textContent=name;
        figure.append(canvas,caption);
        result.append(figure);
      }
      dialog.showModal();
    } catch(error) { status(error.message); }
    finally {busy=false;}
  };
  return {sync,place,draw};
}
