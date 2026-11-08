// SPDX-License-Identifier: MIT
import * as T from 'three';
const clamp=(value,fallback,max)=>Number.isFinite(value)?Math.max(0,Math.min(max,value)):fallback;
const tint=value=>/^#[0-9a-f]{6}$/i.test(value)?value:'#fff1d5';
function cueValues(value={}) {
  return {mix:clamp(value.mix,0,1),power:clamp(value.power,2,8),tint:tint(value.tint)};
}
export function normaliseRehearsal(value={}) {
  if (!value || typeof value!=='object') value={};
  const artwork=typeof value.artwork==='string' && value.artwork.length<=2_000_000 &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.artwork)?value.artwork:null;
  return {...cueValues(value),enabled:value.enabled===true,artwork,
    cues:(Array.isArray(value.cues)?value.cues:[]).slice(0,8).filter(cue=>cue&&typeof cue==='object')
      .map(cue=>({...cueValues(cue),name:String(cue.name||'Cue').slice(0,60)}))};
}

export function installRehearsal(api) {
  const $=id=>document.getElementById(id);
  const panel=document.createElement('details');
  panel.innerHTML=`<summary>Projector rehearsal &amp; cues</summary>
    <p class="hint">Rehearse on the 3D scene. The saved projector view supplies the lens position and aim. Orbit the working view to inspect shadows.</p>
    <button id="aimRehearsal" type="button">Set projector from working view</button>
    <label class="inline"><input id="rehearsalEnabled" type="checkbox"> Show rehearsal in viewport</label>
    <input id="rehearsalFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
    <button id="rehearsalArtwork">Choose projected artwork…</button>
    <div class="pair"><label>Artwork mix (%)<input id="rehearsalMix" type="number" min="0" max="100"></label>
    <label>Power<input id="rehearsalPower" type="number" min="0" max="8" step=".1"></label></div>
    <label>Light tint<input id="rehearsalTint" type="color"></label>
    <label>Cue name<input id="rehearsalName" maxlength="60"></label><button id="saveRehearsalCue">Save cue</button>
    <label>Saved cue<select id="rehearsalCue"></select></label>
    <label>Fade time (seconds)<input id="rehearsalFade" type="number" min="0" max="10" step=".1" value="1"></label>
    <div class="pair"><button id="playRehearsalCue">Fade to cue</button><button id="removeRehearsalCue">Remove cue</button></div>
    <p id="rehearsalStatus" class="hint" role="status"></p>`;
  $('out-project').prepend(panel);
  const hide=document.createElement('button');
  hide.type='button';hide.id='hideRehearsal';hide.textContent='Hide projector rehearsal';hide.hidden=true;
  hide.onclick=()=>api.commit(()=>api.getProject().rehearsal.enabled=false);
  $('viewport').append(hide);
  const light=new T.SpotLight('#ffffff',2,0,Math.PI/6,.05,0);
  light.visible=false;
  light.castShadow=true;
  light.shadow.mapSize.set(512,512);
  light.shadow.camera.near=.5;
  light.shadow.camera.far=4000;
  light.shadow.bias=-.0003;
  api.scene.add(light,light.target);
  const slide=document.createElement('canvas');
  slide.width=slide.height=512;
  const context=slide.getContext('2d');
  const grid=slide.cloneNode();
  const g=grid.getContext('2d');
  g.fillStyle='#081322';g.fillRect(0,0,512,512);
  g.strokeStyle='#d3eaff';g.fillStyle='#d3eaff';g.font='18px Segoe UI';
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    g.strokeRect(x*64+1,y*64+1,62,62);
    g.fillText((x+1)+':'+(y+1),x*64+10,y*64+37);
  }
  light.map=new T.CanvasTexture(slide);
  light.map.colorSpace=T.SRGBColorSpace;
  let textureKey=null, textureMix=-1, animation=0, request=0, preview=null;
  const message=text=>$('rehearsalStatus').textContent=text;
  function stop() {if(animation)cancelAnimationFrame(animation);animation=0;preview=null;}
  function sync() {
    const state=api.getProject().rehearsal, selector=$('rehearsalCue'), selected=selector.value;
    $('rehearsalEnabled').checked=state.enabled;
    $('rehearsalMix').value=Math.round(state.mix*100);
    $('rehearsalPower').value=state.power;
    $('rehearsalTint').value=state.tint;
    selector.replaceChildren(...state.cues.map((cue,index)=>new Option(cue.name,index)));
    if ([...selector.options].some(option=>option.value===selected))selector.value=selected;
    $('playRehearsalCue').disabled=$('removeRehearsalCue').disabled=!state.cues.length;
  }
  function update() {
    const project=api.getProject(), state=project.rehearsal, camera=project.projectorCamera;
    light.visible=state.enabled && !!camera;
    hide.hidden=!light.visible;
    if (!light.visible) return;
    const value=preview?.project===project ? preview : state;
    light.position.fromArray(camera.position);
    light.target.position.fromArray(camera.target);
    light.angle=Math.min(Math.PI/2-.01,(camera.fov||38)*Math.PI/360);
    light.intensity=value.power;
    light.color.set(value.tint);
    const image=api.textures.get(state.artwork)?.image;
    if(textureKey!==image||textureMix!==value.mix){
      textureKey=image;
      textureMix=value.mix;
      context.globalAlpha=1;
      context.drawImage(grid,0,0);
      context.globalAlpha=value.mix;
      if (image) {
        context.fillStyle='#000';context.fillRect(0,0,512,512);
        const ratio=Math.min(512/image.width,512/image.height);
        const width=image.width*ratio,height=image.height*ratio;
        context.drawImage(image,(512-width)/2,(512-height)/2,width,height);
      } else {context.fillStyle='#fff1d5';context.fillRect(0,0,512,512);}
      context.globalAlpha=1;
      light.map.needsUpdate=true;
    }
  }
  $('aimRehearsal').onclick=()=>{
    if(api.commit(()=>{
      const p=api.getProject();
      p.projectorCamera=api.getCameraState();
      p.rehearsal.enabled=true;
    })) api.refreshProjection();
  };
  for (const [id,key] of [['rehearsalEnabled','enabled'],['rehearsalMix','mix'],['rehearsalPower','power'],['rehearsalTint','tint']]) $(id).onchange=event=>{
    stop();
    const input=event.target;
    if(key==='enabled'&&input.checked&&!api.getProject().projectorCamera){
      input.checked=false;
      message('Set the projector from the working view first.');
      return;
    }
    const value=key==='enabled'?input.checked:key==='tint'?input.value:Number(input.value)/(key==='mix'?100:1);
    api.commit(()=>api.getProject().rehearsal[key]=value);
  };
  $('rehearsalArtwork').onclick=()=>$('rehearsalFile').click();
  $('rehearsalFile').onchange=async event=>{
    const file=event.target.files[0], project=api.getProject(), serial=++request;
    event.target.value='';
    if(!file)return;
    try {
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>1_450_000)throw Error('Choose a PNG, JPEG or WebP under 1.45 MB.');
      const data=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=reject;
        reader.readAsDataURL(file);
      });
      await api.decodeAssets({objects:[{texture:data}]});
      if(serial===request&&project===api.getProject())api.commit(()=>{project.rehearsal.artwork=data;project.rehearsal.mix=1;});
    }catch(error){message(error.message);}
  };
  $('saveRehearsalCue').onclick=()=>{
    const state=api.getProject().rehearsal;
    if(state.cues.length>=8){message('Save up to eight cues.');return;}
    api.commit(()=>state.cues.push({...cueValues(state),name:$('rehearsalName').value.trim()||'Cue '+(state.cues.length+1)}));
  };
  $('removeRehearsalCue').onclick=()=>api.commit(()=>api.getProject().rehearsal.cues.splice(+$('rehearsalCue').value,1));
  $('playRehearsalCue').onclick=()=>{
    stop();
    const project=api.getProject(), state=project.rehearsal, cue=state.cues[+$('rehearsalCue').value];
    if(!cue||!state.enabled||!project.projectorCamera){message('Enable rehearsal and choose a saved cue.');return;}
    const duration=clamp(+$('rehearsalFade').value,1,10)*1000;
    const start=performance.now(), from=new T.Color(state.tint), to=new T.Color(cue.tint), colour=new T.Color();
    function advance(now){
      if(api.getProject()!==project){stop();return;}
      const t=duration?Math.min(1,(now-start)/duration):1;
      if(t>=1){
        stop();api.commit(()=>Object.assign(state,cueValues(cue)));message('Cue applied.');
        return;
      }
      preview={project,mix:T.MathUtils.lerp(state.mix,cue.mix,t),power:T.MathUtils.lerp(state.power,cue.power,t),tint:'#'+colour.copy(from).lerp(to,t).getHexString()};
      api.render();
      animation=requestAnimationFrame(advance);
    }
    animation=requestAnimationFrame(advance);
  };
  function draw(render) {
    if (!light.visible) return render();
    const levels=api.lights.map(item=>item.intensity);
    const environment=api.scene.environmentIntensity;
    try {
      api.lights.forEach(item=>item.intensity*=.15);
      api.scene.environmentIntensity=environment*.18;
      return render();
    } finally {
      api.lights.forEach((item,index)=>item.intensity=levels[index]);
      api.scene.environmentIntensity=environment;
    }
  }
  return {light,update,sync,draw};
}
