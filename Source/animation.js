import {surfaceTime} from './moving-surfaces.js';
import {zipSync} from 'fflate';
export function motionPose(o,time,duration){const turns=time/Math.max(1,duration)*(o.motionCycles??1)+(o.motionPhase||0),phase=turns*Math.PI*2,a=o.motionAmount||0,wave=o.motionEase==='triangle'?1-4*Math.abs((turns%1+1)%1-.5):o.motionEase==='hold'?Math.round(Math.sin(phase)):Math.sin(phase);return {x:o.x+(o.motion==='orbit'?Math.cos(phase)*a:0),y:o.y+(o.motion==='float'?(wave+1)*a*.5:0),z:o.z+(o.motion==='orbit'?Math.sin(phase)*a:0),rx:o.rx+(o.motion==='spin'&&o.motionAxis==='x'?phase*180/Math.PI:0),ry:o.ry+(o.motion==='spin'&&(o.motionAxis||'y')==='y'?phase*180/Math.PI:0),rz:o.rz+(o.motion==='sway'?wave*a:o.motion==='spin'&&o.motionAxis==='z'?phase*180/Math.PI:0)};}
export function installAnimation({getProject,current,commit,pause,content,groups,render,cloneCamera,cleanRender,T,renderer,download,filename,setBusy,isBusy,mark,createOutputRenderer,disposeOutputRenderer,setTime=()=>{}}){const $=id=>document.getElementById(id),mode=document.createElement('select');mode.id='animationMode';mode.setAttribute('aria-label','Animation mode');for(const [v,t]of [['turntable','Turntable'],['objects','Object motions'],['combined','Turntable + objects']])mode.add(new Option(t,v));$('play').before(mode);mode.onchange=()=>commit(()=>getProject().animationMode=mode.value);$('play').textContent='▶ Play motion';const button=document.createElement('button');button.id='exactFrames';button.textContent='Export exact PNG frames…';$('record').after(button);const fps=document.createElement('label');fps.innerHTML='Frame sequence rate<select id="sequenceFps"><option value="12">12 fps</option><option value="24">24 fps</option><option value="30">30 fps</option></select>';button.before(fps);let cancelled=false;
function evaluate(time){setTime(time);const p=getProject();surfaceTime(content,time/p.duration);content.rotation.y=p.animationMode==='objects'?0:time/p.duration*Math.PI*2;for(const o of p.objects){const g=groups.get(o.id);if(!g)continue;const pose=p.animationMode==='turntable'?o:motionPose(o,time,p.duration);g.position.set(pose.x,pose.y,pose.z);g.rotation.set(...[pose.rx,pose.ry,pose.rz].map(T.MathUtils.degToRad));}}
function reset(){setTime(0);surfaceTime(content,0);const p=getProject();content.rotation.y=0;for(const o of p.objects){const g=groups.get(o.id);if(!g)continue;g.position.set(o.x,o.y,o.z);g.rotation.set(...[o.rx,o.ry,o.rz].map(T.MathUtils.degToRad));}}
function inspector(){const o=current(),body=$('objectPanel').querySelector(':scope > div');if(!o||!body)return;const wrap=document.createElement('details');wrap.innerHTML='<summary>Object motion · looping</summary><label>Movement<select id="obj-motion"><option value="none">Still</option><option value="float">Float</option><option value="spin">Spin</option><option value="orbit">Orbit</option><option value="sway">Sway</option></select></label><label>Amount · mm (degrees for sway)<input id="obj-motionAmount" type="number" min="0" max="180" step="1"></label><label>Phase offset · turns<input id="obj-motionPhase" type="number" min="0" max="1" step=".05"></label><p class="hint">Choose Object motions or Turntable + objects beside Play. Integer motion cycles repeat over the clip length. Fractional cycles create partial moves.</p>';body.append(wrap);for(const k of ['motion','motionAmount','motionPhase']){$('obj-'+k).value=o[k];$('obj-'+k).onchange=()=>commit(()=>current()[k]=k==='motion'?$('obj-'+k).value:+$('obj-'+k).value);}}
button.onclick=async()=>{if(isBusy())return;let r=null;try{const p=getProject(),w=+$('outputWidth').value,h=+$('outputHeight').value,rate=+$('sequenceFps').value,duration=+$('duration').value,count=Math.ceil(duration*rate);if(!Number.isInteger(w)||!Number.isInteger(h)||w<240||h<240||w>4096||h>4096)throw Error('Use image dimensions from 240 to 4096.');if(duration<1||duration>30||w*h*count>32000000)throw Error('This sequence exceeds the 32-million-pixel budget. Reduce image size, duration or frame rate.');pause();p.duration=duration;p.outputWidth=w;p.outputHeight=h;p.transparent=$('transparent').checked;mark();setBusy(true);cancelled=false;const cancel=$('cancelRecord');cancel.textContent='Cancel frame export';cancel.hidden=false;cancel.onclick=()=>cancelled=true;button.disabled=true;r=createOutputRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(w,h);r.shadowMap.enabled=true;r.toneMapping=renderer.toneMapping;r.toneMappingExposure=renderer.toneMappingExposure;const camera=cloneCamera(w,h),files={};for(let i=0;i<count;i++){if(cancelled||p!==getProject())throw Error('Frame export cancelled.');evaluate(i/rate);cleanRender(r,camera,p.transparent);const blob=await new Promise(resolve=>r.domElement.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed.');files[`frames/frame-${String(i).padStart(5,'0')}.png`]=new Uint8Array(await blob.arrayBuffer());$('outputStatus').textContent=`Rendering exact frame ${i+1} / ${count}`;if(i%3===0)await new Promise(resolve=>setTimeout(resolve,0));}if(cancelled)throw Error('Frame export cancelled.');files['sequence.json']=new TextEncoder().encode(JSON.stringify({fps:rate,frames:count,width:w,height:h,duration:count/rate,firstTime:0,timeStep:1/rate,alpha:p.transparent},null,2));download(new Blob([zipSync(files,{level:0})],{type:'application/zip'}),filename()+'-frames.zip');$('outputStatus').textContent=`Exported ${count} exact PNG frames at ${rate} fps.`;}catch(e){$('outputStatus').textContent=e.message;}finally{if(r)disposeOutputRenderer(r);setBusy(false);button.disabled=false;$('cancelRecord').hidden=true;$('cancelRecord').textContent='Stop recording';reset();render();}};
const pulseSheet=document.createElement('button');
pulseSheet.id='pulseSheet';
pulseSheet.textContent='Export Pulse sprite sheet…';
button.after(pulseSheet);
pulseSheet.onclick=async()=>{
  if(isBusy())return;
  let output=null;
  const project=getProject(), alpha=$('transparent').checked;
  const cancel=$('cancelRecord');
  const columns=6,rows=4,frames=24,fps=12;
  try {
    const width=+$('outputWidth').value,height=+$('outputHeight').value;
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<240||height<240||width>4096||height>4096)throw Error('Use image dimensions from 240 to 4096.');
    const ratio=Math.min(320/width,320/height);
    const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
    const atlas=document.createElement('canvas');
    atlas.width=w*columns;atlas.height=h*rows;
    const context=atlas.getContext('2d');
    pause();
    setBusy(true);
    cancelled=false;
    pulseSheet.disabled=true;
    cancel.hidden=false;
    cancel.textContent='Cancel sprite sheet';
    cancel.onclick=()=>cancelled=true;
    output=createOutputRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    output.setSize(w,h);
    output.shadowMap.enabled=true;
    output.toneMapping=renderer.toneMapping;
    output.toneMappingExposure=renderer.toneMappingExposure;
    const camera=cloneCamera(w,h);
    for(let index=0;index<frames;index++){
      if(cancelled||project!==getProject())throw Error('Sprite sheet export cancelled.');
      evaluate(index*project.duration/frames);
      cleanRender(output,camera,alpha);
      context.drawImage(output.domElement,index%columns*w,Math.floor(index/columns)*h,w,h);
      $('outputStatus').textContent='Rendering sprite '+(index+1)+' / '+frames;
      if(index%3===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
    const image=await new Promise(resolve=>atlas.toBlob(resolve,'image/png'));
    if(cancelled)throw Error('Sprite sheet export cancelled.');
    if(!image)throw Error('Could not encode the sprite sheet.');
    const encode=text=>new TextEncoder().encode(text);
    const files={
      ['workshop-sprites-'+columns+'x'+rows+'-'+frames+'f-'+fps+'fps.png']:new Uint8Array(await image.arrayBuffer()),
      'sprite-sheet.json':encode(JSON.stringify({columns,rows,frames,fps,width:w,height:h,alpha,sourceDuration:project.duration},null,2)),
      'USE-IN-PULSE.txt':encode('Extract the ZIP. In Pulse import the PNG and add it as an image part in Visual workshop. Pulse reads the frame settings from the filename. This retimes the Workshop clip to two seconds. Use another frame rate to change playback speed.')
    };
    download(new Blob([zipSync(files,{level:0})],{type:'application/zip'}),filename()+'-pulse-sprites.zip');
    $('outputStatus').textContent='Sprite sheet saved for Pulse. Import the PNG as artwork in Visual workshop.';
  }catch(error){$('outputStatus').textContent=error.message;}
  finally{
    if(output)disposeOutputRenderer(output);
    setBusy(false);pulseSheet.disabled=false;cancel.hidden=true;cancel.textContent='Stop recording';
    reset();render();
  }
};
return {evaluate,reset,inspector,sync(){mode.value=getProject().animationMode;}};}
