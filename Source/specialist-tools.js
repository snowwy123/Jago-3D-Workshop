// SPDX-License-Identifier: MIT
import * as T from 'three';
import {zipSync,strToU8} from 'fflate';
import {paperKit,stackedLayers,layerPath} from './fabrication-lab.js';
import {drawShadow,shadowFrameSize} from './shadow-lab.js';

const svgType='image/svg+xml';
const svgPath=(path,width,height)=>'<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><path fill-rule="evenodd" d="'+path+'"/></svg>';
const png=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG encoding failed.')),'image/png'));
const bytes=async canvas=>new Uint8Array(await (await png(canvas)).arrayBuffer());

export function normaliseAlignment(value){
  const c=value?.camera;
  if(typeof value?.group!=='string'||!c||!['position','target'].every(key=>Array.isArray(c[key])&&c[key].length===3&&c[key].every(n=>Number.isFinite(n)&&Math.abs(n)<=10000)))return null;
  return {group:value.group.slice(0,80),camera:{name:'Alignment view',position:c.position,target:c.target,projection:'perspective',fov:38,zoom:1}};
}

export function alignedLetters(word,view,span,depth,{object,letteringRatio}) {
    const eye=new T.Vector3(...view.position),target=new T.Vector3(...view.target);
    const forward=target.clone().sub(eye).normalize();
    const right=forward.clone().cross(new T.Vector3(0,1,0)).normalize();
    if(right.lengthSq()<.0001)throw Error('Use an angled working view for lettering alignment.');
    const up=right.clone().cross(forward);
    const matrix=new T.Matrix4().makeBasis(right,up,forward.clone().negate());
    const rotation=new T.Euler().setFromRotationMatrix(matrix).toArray().slice(0,3).map(T.MathUtils.radToDeg);
    const ratios=[...word].map(letter=>letter===' '?.45:letteringRatio(letter));
    const capHeight=span/(ratios.reduce((sum,value)=>sum+value,0)+.18*(word.length-1));
    const distance=eye.distanceTo(target),group=crypto.randomUUID(),objects=[];
    let cursor=-span/2;
    for(const [index,letter] of [...word].entries()){
      const width=ratios[index]*capHeight, x=cursor+width/2;
      cursor+=width+capHeight*.18;
      if(letter===' ')continue;
      const factor=1+Math.min(depth,distance*.6)/distance*[0,1,.35,.7][index%4];
      const at=target.clone().addScaledVector(right,x).addScaledVector(up,-capHeight*.5);
      const position=eye.clone().lerp(at,factor);
      if(position.toArray().some(n=>Math.abs(n)>1500))throw Error('Move the working camera closer before generating lettering.');
      objects.push(object('text',{name:'Letter '+(index+1)+' · '+letter,text:letter,group,groupName:'Perspective lettering',
        x:position.x,y:position.y,z:position.z,rx:rotation[0],ry:rotation[1],rz:rotation[2],
        width:width*factor,height:capHeight*factor,depth:1.5,bevel:0,colour:index%2?'#9a4931':'#254d53'}));
    }
    return {objects,group,camera:view};
}

export function installSpecialist(api) {
  const $=id=>document.getElementById(id);
  const project=()=>api.getProject();
  const main=$('specialistDialog'), shadow=$('shadowDialog');
  const shadowStatus=text=>$('shadowStatus').textContent=text;
  const labStatus=text=>$('specialistStatus').textContent=text;
  let shadowFrame=0,request=0,kitURL=null,initialFrame=null,tab='paper';
  const guard=(fn,report=labStatus)=>async()=>{
    try {await fn();} catch(error){report(error.message);}
  };
  const saveSVG=(source,suffix)=>api.download(new Blob([source],{type:svgType}),api.filename()+suffix+'.svg');
  const saveZIP=(files,suffix)=>api.download(new Blob([zipSync(files,{level:0})],{type:'application/zip'}),api.filename()+suffix+'.zip');

  function redrawShadow(){
    if(!shadow.open)return;
    const canvas=$('shadowCanvas'),state=project().shadowLab;
    try {
      const geometry=api.geometry(false);
      initialFrame ||= geometry.bounds;
      const frame=state.frame||initialFrame;
      drawShadow(canvas,geometry,{...state,frame});
      const behind=geometry.bounds.min[2]<frame.min[2]-state.receiverDepth*shadowFrameSize(frame);
      $('shadowBoundsHint').textContent=behind?'Some geometry is behind the screen. Fit screen depth to bring it back into the shadow.':'';
      const image=api.textures.get(state.target)?.image;
      if(image){
        const context=canvas.getContext('2d'),ratio=Math.min(canvas.width/image.width,canvas.height/image.height);
        const w=image.width*ratio,h=image.height*ratio;
        context.save();context.globalAlpha=state.opacity;
        context.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
        context.restore();
      }
    } catch(error) {
      canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
      shadowStatus(error.message);
    }
  }
  function scheduleShadow(){
    if(!shadow.open||shadowFrame)return;
    shadowFrame=requestAnimationFrame(()=>{shadowFrame=0;redrawShadow();});
  }
  function syncShadow(){
    const state=project().shadowLab;
    for(const [id,key]of [['shadowX','x'],['shadowY','y'],['shadowDistance','distance'],['shadowReceiverDepth','receiverDepth'],['shadowOpacity','opacity']])$(id).value=state[key];
    const select=$('shadowLights'),prior=select.value;
    select.replaceChildren(...state.lights.map((light,index)=>new Option(light.name,index)));
    if([...select.options].some(option=>option.value===prior))select.value=prior;
    $('applyShadowLight').disabled=$('deleteShadowLight').disabled=!state.lights.length;
    scheduleShadow();
  }
  $('openShadow').onclick=()=>{
    api.pause();
    if(!shadow.open){initialFrame=null;shadow.show();}
    syncShadow();
  };
  $('closeShadow').onclick=()=>shadow.close();
  $('shadowRefresh').onclick=scheduleShadow;
  $('fitShadowDepth').onclick=guard(()=>{
    const bounds=api.geometry(false).bounds;
    const frame=project().shadowLab.frame||initialFrame||bounds;
    const needed=(frame.min[2]-bounds.min[2])/shadowFrameSize(frame)+.1;
    api.commit(()=>Object.assign(project().shadowLab,{frame,receiverDepth:Math.min(5,Math.max(.15,needed))}));
    shadowStatus(needed>5?'Screen is at maximum depth. Refit the frame to include the whole set.':'Screen depth fitted. Screen framing is preserved.');
  },shadowStatus);
  $('fitShadow').onclick=guard(()=>{const bounds=api.geometry(false).bounds;api.commit(()=>project().shadowLab.frame=bounds);shadowStatus('Screen fitted and saved. Move objects without moving the frame.');},shadowStatus);
  for(const [id,key]of [['shadowX','x'],['shadowY','y'],['shadowDistance','distance'],['shadowReceiverDepth','receiverDepth'],['shadowOpacity','opacity']])$(id).onchange=event=>{
    const value=Number(event.target.value);
    api.commit(()=>project().shadowLab[key]=value);
  };
  $('shadowTarget').onclick=()=>$('shadowFile').click();
  $('clearShadowTarget').onclick=()=>api.commit(()=>project().shadowLab.target=null);
  $('shadowFile').onchange=async event=>{
    const file=event.target.files[0], owner=project(), serial=++request;
    event.target.value='';
    if(!file)return;
    try {
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>1_450_000)throw Error('Choose a PNG, JPEG or WebP under 1.45 MB.');
      const image=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);
      });
      await api.decodeAssets({objects:[{texture:image}]});
      if(serial===request&&owner===project())api.commit(()=>owner.shadowLab.target=image);
    }catch(error){shadowStatus(error.message);}
  };
  $('saveShadowLight').onclick=()=>{
    const {lights,x,y,distance}=project().shadowLab;
    if(lights.length>=8){shadowStatus('Save up to eight light positions.');return;}
    api.commit(()=>lights.push({x,y,distance,name:$('shadowLightName').value.trim()||'Light '+(lights.length+1)}));
  };
  $('applyShadowLight').onclick=()=>{
    const state=project().shadowLab, light=state.lights[+$('shadowLights').value];
    if(light)api.commit(()=>{state.x=light.x;state.y=light.y;state.distance=light.distance;});
  };
  $('deleteShadowLight').onclick=()=>api.commit(()=>project().shadowLab.lights.splice(+$('shadowLights').value,1));
  function shadowImage(transparent){
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;
    const state=project().shadowLab;
    drawShadow(canvas,api.geometry(false),{...state,frame:state.frame||initialFrame},transparent);
    return canvas;
  }
  $('shadowPNG').onclick=guard(async()=>api.download(await png(shadowImage($('shadowAlpha').checked)),api.filename()+'-shadow.png'),shadowStatus);
  $('shadowComparison').onclick=guard(async()=>{
    const mask=shadowImage(false);
    const view=api.captureViews([{name:'Working view',fallback:0}])[0].canvas;
    const page=document.createElement('canvas');page.width=1360;page.height=570;
    const ctx=page.getContext('2d');ctx.fillStyle='#f3eada';ctx.fillRect(0,0,1360,570);
    ctx.fillStyle='#202b32';ctx.font='bold 24px Segoe UI';ctx.fillText(project().name,20,35,1320);
    ctx.drawImage(view,20,55,640,480);ctx.drawImage(mask,700,55,640,480);
    ctx.font='16px Segoe UI';ctx.fillText('Scene',20,555);ctx.fillText('Cast silhouette',700,555);
    api.download(await png(page),api.filename()+'-shadow-study.png');
  },shadowStatus);

  function makeKit(){
    const object=project().objects.find(object=>object.id===api.getSelection()[0]);
    const data=object?.texture, image=api.textures.get(data)?.image;
    const artwork=$('kitArtwork').checked&&image?{data,aspect:image.width/image.height}:null;
    if($('kitArtwork').checked&&(!artwork||data.length>2_000_000))throw Error('Select a textured object with base artwork under 2 MB, or turn off face artwork.');
    return paperKit($('kitType').value,+$('kitWidth').value,+$('kitHeight').value,+$('kitDepth').value,artwork);
  }
  function previewKit(){
    const kit=makeKit();
    if(kitURL)URL.revokeObjectURL(kitURL);
    kitURL=URL.createObjectURL(new Blob([kit.svg],{type:svgType}));
    $('kitPreview').src=kitURL;
    $('kitDepth').disabled=kit.type!=='box';
    labStatus('One A4 sheet. Print at actual size and score before gluing.');
  }
  for(const id of ['kitWidth','kitHeight','kitDepth','kitArtwork'])$(id).onchange=guard(previewKit);
  $('kitType').onchange=guard(()=>{
    const type=$('kitType').value;
    if(type==='hexagon')$('kitWidth').value=Math.min(25,+$('kitWidth').value);
    if(type==='pyramid')$('kitHeight').value=Math.min(46,+$('kitHeight').value);
    previewKit();
  });
  $('kitDownload').onclick=guard(()=>saveSVG(makeKit().svg,'-paper-kit'));
  $('kitAssemble').onclick=guard(()=>{
    const kit=makeKit(),y=project().surfaceHeight||0;
    let next;
    if(kit.type==='pyramid'){
      const half=kit.width/2, mid=kit.height/2;
      next=api.object('mesh',{name:'Paper pyramid mockup',width:kit.width,height:kit.height,depth:kit.width,y:y+mid,
        vertices:[-half,-mid,-half,half,-mid,-half,half,-mid,half,-half,-mid,half,0,mid,0],
        triangles:[0,1,2,0,2,3,1,0,4,2,1,4,3,2,4,0,3,4]});
    }else if(kit.type==='prism'||kit.type==='hexagon'){
      const sides=kit.type==='prism'?3:6, width=kit.width*(sides===3?1:2), height=kit.width*Math.sqrt(3)*(sides===3?.5:1);
      const points=sides===3?[[0,0],[width,0],[width/2,height]]:
        Array.from({length:6},(_,i)=>[width/2+Math.cos(i*Math.PI/3)*width/2,height/2+Math.sin(i*Math.PI/3)*width/2]);
      const path='M'+points.map(p=>p.join(' ')).join('L')+'Z';
      next=api.object('svg',{name:sides===3?'Paper triangular prism mockup':'Paper hexagonal prism mockup',
        svg:svgPath(path,width,height),width,height,depth:kit.height,bevel:0,y});
    }else next=api.object('box',{name:'Paper box mockup',width:kit.width,height:kit.height,depth:kit.depth,y:y+kit.height/2});
    next.paperKit={type:kit.type,width:kit.width,height:kit.height,depth:kit.depth};
    if(api.commit(()=>project().objects.push(next))){api.setSelection([next.id],next.id);api.frameSelection();main.close();}
  });
  function makeStack(){
    api.pause();
    const geometry=api.geometry(true);
    return stackedLayers(geometry.triangles,geometry.bounds,+$('layerThickness').value,$('layerHoles').checked);
  }
  $('layerCheck').onclick=guard(()=>{
    const lastStack=makeStack();
    labStatus(lastStack.layers.length+' layers at '+lastStack.step+' mm. '+lastStack.holes.length+' registration holes fit through the whole stack.');
  });
  $('layerExport').onclick=guard(()=>{
    const stack=makeStack(), {min,max}=stack.bounds, w=max[0]-min[0], h=max[2]-min[2];
    const files={};
    for(const layer of stack.layers){
      const number=String(layer.index+1).padStart(2,'0');
      const path=layerPath(layer,stack.holes,[min[0],min[2]]);
      const page='<svg xmlns="http://www.w3.org/2000/svg" width="'+(w+20)+'mm" height="'+(h+25)+'mm" viewBox="0 0 '+(w+20)+' '+(h+25)+'">'+
        '<g id="cut" transform="translate(10 10)" fill="none" stroke="#252d32" stroke-width=".15"><path d="'+path+'"/></g>'+
        '<g id="labels" fill="#25383e" font-size="3.5"><text x="10" y="'+(h+17)+'">Layer '+number+' / '+stack.layers.length+' · '+stack.step+' mm</text></g></svg>';
      files['layer-'+number+'.svg']=strToU8(page);
    }
    files['assembly.txt']=strToU8('Stack in ascending layer order from bottom to top. Use '+stack.step+' mm material. Registration holes: '+stack.holes.length+'. Cut only the cut group. Outlines are taken at slice midpoints. The top layer may round the overall height up.');
    saveZIP(files,'-stacked-relief');
    labStatus('Saved '+stack.layers.length+' numbered cut patterns.');
  });
  $('layerAssemble').onclick=guard(()=>{
    const stack=makeStack(), group=crypto.randomUUID();
    const colours=['#cfa06b','#e4c087','#ae7554','#f0d7a7'];
    const objects=stack.layers.map(layer=>{
      const points=layer.loops.flat();
      const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
      const minZ=Math.min(...points.map(p=>p[1])),maxZ=Math.max(...points.map(p=>p[1]));
      const width=maxX-minX,height=maxZ-minZ;
      if(width>500||height>500)throw Error('Use a model under 500 mm across for an assembled preview.');
      return api.object('svg',{name:'Layer '+(layer.index+1),group,groupName:'Stacked relief',
        width,height,depth:stack.step,bevel:0,rx:-90,x:(minX+maxX)/2,y:layer.bottom+stack.step/2,z:maxZ,
        colour:colours[layer.index%colours.length],
        svg:svgPath(layerPath(layer,stack.holes,[minX,minZ]),width,height)});
    });
    const selected=api.getSelection();
    if(api.commit(()=>{
      for(const object of project().objects)if(selected.includes(object.id)&&!object.locked)object.visible=false;
      project().objects.push(...objects);
    })){api.setSelection(objects.map(o=>o.id),objects[0].id);api.frameSelection();main.close();}
  });
  $('alignmentBuild').onclick=guard(()=>{
    const word=$('alignmentText').value.trim().toUpperCase();
    if(!/^[A-Z0-9 ]{1,24}$/.test(word))throw Error('Enter 1–24 Latin letters, numbers or spaces.');
    const view={...api.getCameraState(),name:'Alignment view',projection:'perspective',fov:38,zoom:1};
    const span=Math.max(45,Math.min(400,+$('alignmentWidth').value||180));
    const depth=Math.max(0,Math.min(250,Number($('alignmentDepth').value)));
    const {objects,group,camera}=alignedLetters(word,view,span,depth,api);
    if(api.commit(()=>{project().objects.push(...objects);project().alignment={group,camera};})){
      api.setSelection(objects.map(o=>o.id),objects[0].id);
      api.viewCamera(view);main.close();
    }
  });
  $('alignmentView').onclick=guard(()=>{
    if(!project().alignment)throw Error('Make perspective lettering first.');
    api.viewCamera(project().alignment.camera);main.close();
  });
  $('alignmentUseOutput').onclick=guard(()=>{
    if(!project().alignment)throw Error('Make perspective lettering first.');
    api.commit(()=>{project().outputCamera=project().alignment.camera;project().cameraTravel=false;});
    labStatus('Alignment camera kept for still and motion renders.');
  });
  $('alignmentExport').onclick=guard(async()=>{
    const alignment=project().alignment;
    if(!alignment)throw Error('Make perspective lettering first.');
    const objects=project().objects.filter(o=>o.group===alignment.group);
    if(!objects.length)throw Error('The aligned lettering group is missing.');
    const view=api.captureViews([alignment.camera])[0].canvas;
    const table=['letter,x_mm,y_mm,z_mm,rx_deg,ry_deg,rz_deg,scale',
      ...objects.map(o=>[JSON.stringify(o.text),...[o.x,o.y,o.z,o.rx,o.ry,o.rz,o.scale].map(v=>v.toFixed(3))].join(','))].join('\n');
    saveZIP({'alignment.png':await bytes(view),'placement.csv':strToU8(table),
      'camera.json':strToU8(JSON.stringify(alignment.camera,null,2))},'-alignment-guide');
  });

  function kitPreset(){
    const object=project().objects.find(object=>object.id===api.getSelection()[0]);
    const kit=object?.paperKit;
    if(!kit||!['box','prism','hexagon','pyramid'].includes(kit.type))return false;
    $('kitType').value=kit.type;
    for(const [id,key]of [['kitWidth','width'],['kitHeight','height'],['kitDepth','depth']])if(Number.isFinite(kit[key]))$(id).value=kit[key];
    $('kitArtwork').checked=!!object.texture;
    return true;
  }
  function selectTab(name){
    tab=name;
    for(const node of main.querySelectorAll('[data-lab-panel]'))node.hidden=node.dataset.labPanel!==name;
    for(const button of main.querySelectorAll('[data-lab-tab]'))button.classList.toggle('active',button.dataset.labTab===name);
    labStatus('');
    if(name==='paper')guard(previewKit)();
  }
  for(const button of main.querySelectorAll('[data-lab-tab]'))button.onclick=()=>selectTab(button.dataset.labTab);
  $('openSpecialist').onclick=()=>{api.pause();main.showModal();selectTab(kitPreset()?'paper':tab);};
  $('closeSpecialist').onclick=()=>main.close();
  main.addEventListener('close',()=>{if(kitURL){URL.revokeObjectURL(kitURL);kitURL=null;}});
  return {sync(){if(shadow.open)syncShadow();}};
}
