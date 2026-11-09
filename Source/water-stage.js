import * as T from 'three';
import './shared-environment.cjs';
const Env=globalThis.JagoEnvironment;
export function installWaterStage({scene,renderer,floor,grid,key,fill,getProject,commit}){
 const baseEnvironment=scene.environment,environmentCache=new WeakMap();
 const uniforms={jwNight:{value:0},jwMoonVisible:{value:0},jwSunDisk:{value:0},jwContourLight:{value:new T.Vector3()},jwMoon:{value:new T.Vector3()},jeUnits:{value:30},jeLevel:{value:-12}},values=Env.values(Env.defaults,0);for(const[k,v]of Object.entries(values))uniforms[k]={value:Array.isArray(v)?new T.Vector3(...v):v};
 const skyShader=`uniform float jwNight,jwMoonVisible,jwSunDisk;uniform vec3 jwMoon,jwContourLight;
 ${Env.glsl.replace('jeLight*(line*.55+grid*.12)','mix(jeLight,jwContourLight*.42,jwNight)*(line*.55+grid*.12)').replace('return max(c,vec3(0));',`
   vec2 starUV=vec2(atan(ray.z,ray.x),asin(clamp(ray.y,-1.,1.)))*180.;
   vec2 cell=floor(starUV), point=fract(starUV)-.5;
   float star=step(.988,jeHash(cell))*exp(-dot(point,point)*42.);
   float lunar=max(0.,dot(ray,jwMoon));
   float moon=smoothstep(.99925,.99945,lunar);
   c+=vec3(.66,.78,1.)*(jwNight*star*smoothstep(.02,.23,y)*1.1+jwMoonVisible*(moon*2.+pow(lunar,360.)*.2));
   c+=jeLight*jwSunDisk*smoothstep(.99955,.99972,a)*3.;
   return max(c,vec3(0));`)}`;
 const material=new T.ShaderMaterial({uniforms,side:T.DoubleSide,vertexShader:`${skyShader}uniform float jeUnits,jeLevel;varying vec3 waterPoint;void main(){vec3 p=position;p.y=jeLevel+jeField(p.xz/jeUnits).x*jeUnits;waterPoint=p/jeUnits;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`${skyShader}uniform float jeUnits;varying vec3 waterPoint;void main(){gl_FragColor=vec4(jeShade(waterPoint,cameraPosition/jeUnits),1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(';#include',';\n#include')});
 let extent=12000;const makeGeometry=()=>new T.PlaneGeometry(extent,extent,220,220).rotateX(-Math.PI/2),water=new T.Mesh(makeGeometry(),material);water.frustumCulled=false;water.name='Water stage · render only';scene.add(water);
 const skyMaterial=new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 skyDirection;void main(){vec4 world=modelMatrix*vec4(position,1.);skyDirection=world.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:`${skyShader}varying vec3 skyDirection;void main(){gl_FragColor=vec4(jeSkyAt(normalize(skyDirection)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});
 const sky=new T.Mesh(new T.SphereGeometry(8500,24,12),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-10;sky.name='Procedural sky · render only';scene.add(sky);
 const box=document.createElement('details');box.open=true;box.id='waterStagePanel';box.innerHTML='<summary>Water & atmosphere</summary><label class="inline"><input id="waterStageEnabled" type="checkbox"> Enable water stage</label><label>Look<select id="waterStagePreset"></select></label><div id="waterStageFields"><label class="inline"><input id="waterCullBack" type="checkbox"> Hide water from below</label><label>Sky lighting<select id="waterSkyMode"><option value="day">Scene colours</option><option value="night">Moon and stars</option><option value="cycle">Day → night loop</option></select></label></div><p class="hint">Waves, sky reflections and analytic foam follow the scene timeline. The stage occludes objects in the same 3D view. Wakes and object reflections are not simulated. Water is render-only and is excluded from model/print export.</p>';
 document.getElementById('scenePanel').prepend(box);const fields=[];
 for(const spec of Env.presets)document.getElementById('waterStagePreset').add(new Option(spec.name,spec.style));
 for(const[k,name,type,a,b,step]of [['level','Water level · mm','number',-300,300,1],['amplitude','Wave height','range',0,1,.01],['scale','Ripple scale','range',.2,5,.05],['choppy','Crest sharpness','range',0,1,.01],['wind','Wave direction','range',-180,180,1],['foam','Foam coverage','range',0,1,.01],['foamSize','Foam patch size','range',.4,3,.05],['foamTrail','Foam residue','range',0,1,.01],['moonElevation','Moon elevation','range',3,70,1],['moonAzimuth','Moon direction','range',-180,180,1],['sunElevation','Sun elevation','range',-12,70,1],['sunAzimuth','Sun direction','range',-180,180,1],['clouds','Clouds','range',0,1,.01],['haze','Haze','range',0,1,.01],['water','Water colour','color'],['horizon','Horizon colour','color'],['sky','Sky colour','color'],['light','Highlights','color']]){const row=document.createElement('label');row.textContent=name;const input=document.createElement('input');input.id='sea-'+k;input.type=type;if(a!==undefined){input.min=a;input.max=b;input.step=step;}input.onchange=()=>commit(()=>{const p=getProject();p.waterStage=Env.settings({...p.waterStage,[k]:['number','range'].includes(type)?+input.value:input.value});});row.append(input);document.getElementById('waterStageFields').append(row);fields.push([k,input]);}
 document.getElementById('waterCullBack').onchange=e=>commit(()=>{getProject().waterStage.hideUnderside=e.target.checked;});
 document.getElementById('waterSkyMode').onchange=e=>commit(()=>{getProject().waterStage.skyMode=e.target.value;});
 document.getElementById('waterStageEnabled').onchange=e=>commit(()=>{getProject().waterStage={...getProject().waterStage,enabled:e.target.checked};});
 document.getElementById('waterStagePreset').onchange=e=>commit(()=>{const p=getProject(),preset=Env.presets.find(s=>s.style===e.target.value);p.waterStage=Env.settings({...p.waterStage,...preset,enabled:true,units:30,extent:12000,amplitude:.45,scale:1.8});});
 function environmentFor(r){const s=Env.settings(getProject().waterStage);if(!s.enabled)return null;const signature=JSON.stringify([s.sky,s.horizon,s.light,s.sunElevation,s.sunAzimuth,s.clouds,s.haze,s.style,s.skyMode,s.moonElevation,s.moonAzimuth]);let cached=environmentCache.get(r);if(cached?.signature===signature)return cached.target.texture;if(cached)cached.target.dispose();const phase=uniforms.jePhase.value;uniforms.jePhase.value=0;const target=new T.WebGLCubeRenderTarget(64,{type:T.HalfFloatType}),cam=new T.CubeCamera(.1,10000,target),captureScene=new T.Scene(),m=skyMaterial.clone();m.uniforms=uniforms;m.toneMapped=false;const dome=new T.Mesh(sky.geometry,m);captureScene.add(dome);cam.update(r,captureScene);const pm=new T.PMREMGenerator(r),filtered=pm.fromCubemap(target.texture);pm.dispose();target.dispose();m.dispose();uniforms.jePhase.value=phase;environmentCache.set(r,{signature,target:filtered});return filtered.texture;}
 function update(t=0,transparent=false){const p=getProject(),s=Env.settings(p.waterStage);const side=s.hideUnderside===true?T.FrontSide:T.DoubleSide;if(material.side!==side){material.side=side;material.needsUpdate=true;}water.visible=s.enabled;sky.visible=s.enabled&&!transparent;if(!s.enabled){scene.environment=baseEnvironment;return;}if(s.extent!==extent){extent=s.extent;water.geometry.dispose();water.geometry=makeGeometry();}const cycle=s.skyMode==='cycle',turn=t/p.duration;
 const arc=(turn+.25)%1,moonArc=(arc+.5)%1;
 const altitude=phase=>Math.sin(phase*Math.PI*2);
 const radians=Math.PI/180;
 // The signed horizontal component takes the body to the opposite horizon after zenith.
 const travel=phase=>Math.cos(phase*Math.PI*2)<0?Math.PI:0;
 const elevation=cycle?Math.asin(altitude(arc)):s.sunElevation*radians;
 const azimuth=s.sunAzimuth*radians+(cycle?travel(arc):0);
 const moonHeight=cycle?Math.asin(altitude(moonArc)):(s.moonElevation??14)*radians;
 const moonAngle=(s.moonAzimuth??-20)*radians+(cycle?travel(moonArc):0);
 const day=cycle?T.MathUtils.smoothstep(altitude(arc),-.15,.22):s.skyMode==='night'?0:1;
 const night=1-day;
 uniforms.jwNight.value=night;
 uniforms.jwSunDisk.value=cycle?day:0;
 uniforms.jwMoonVisible.value=cycle?T.MathUtils.smoothstep(altitude(moonArc),-.05,.14):night;
 uniforms.jwMoon.value.set(Math.sin(moonAngle)*Math.cos(moonHeight),Math.sin(moonHeight),-Math.cos(moonAngle)*Math.cos(moonHeight));
 uniforms.jeUnits.value=s.units;uniforms.jeLevel.value=s.level;for(const[k,v]of Object.entries(Env.values({...s,period:p.duration},t))){if(Array.isArray(v))uniforms[k].value.set(...v);else uniforms[k].value=v;}const dusk=new T.Color('#15234a'),midnight=new T.Color('#030617');
 uniforms.jeHorizon.value.lerp(new T.Vector3(dusk.r,dusk.g,dusk.b),night);
 uniforms.jeSky.value.lerp(new T.Vector3(midnight.r,midnight.g,midnight.b),night);
 uniforms.jwContourLight.value.copy(uniforms.jeLight.value);
 uniforms.jeLight.value.multiplyScalar(1-night*.995);
 uniforms.jeSunElevation.value=elevation;uniforms.jeSunAzimuth.value=azimuth;
 key.position.set(Math.sin(azimuth)*Math.cos(elevation)*600,Math.max(10,Math.sin(elevation)*600),-Math.cos(azimuth)*Math.cos(elevation)*600);if(cycle)key.position.lerp(uniforms.jwMoon.value.clone().multiplyScalar(600),night);
 key.color.set(s.light).lerp(new T.Color('#607bce'),night);fill.color.set(s.horizon).lerp(dusk,night);scene.environment=environmentFor(renderer);scene.background=null;floor.visible=false;grid.visible=false;}
 function sync(){const p=getProject(),s=Env.settings(p.waterStage);document.getElementById('waterStageEnabled').checked=s.enabled;document.getElementById('waterStagePreset').value=s.style;document.getElementById('waterCullBack').checked=s.hideUnderside===true;document.getElementById('waterSkyMode').value=s.skyMode||'day';document.getElementById('waterStageFields').hidden=!s.enabled;for(const[k,input]of fields)if(document.activeElement!==input)input.value=s[k]??(k==='moonElevation'?14:-20);}
 return{update,sync,sky,water,environmentFor,disposeRenderer:r=>{environmentCache.get(r)?.target.dispose();environmentCache.delete(r);},heightAt:(x,z,t)=>{const p=getProject(),s=Env.settings(p.waterStage);return s.level+Env.height(x/s.units,z/s.units,t,{...s,period:p.duration})*s.units;}};
}
