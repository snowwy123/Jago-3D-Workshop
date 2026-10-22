import * as T from 'three';
// Each material owns its uniforms; absolute time makes exported frames repeatable.
export function configureSurface(mat,o){
 if(mat.isMeshToonMaterial){o={...o,toonSteps:o.toonSteps||4,toonShadow:o.toonShadow??.16};const data=new Uint8Array(o.toonSteps*4);for(let i=0;i<o.toonSteps;i++){const value=Math.round(255*(o.toonShadow+(1-o.toonShadow)*i/(o.toonSteps-1)));data.set([value,value,value,255],i*4);}const gradient=new T.DataTexture(data,o.toonSteps,1);gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.needsUpdate=true;mat.gradientMap=gradient;mat.userData.ownedTextures=[gradient];}
 if(mat.emissive){mat.emissive.set(o.emissionColour);mat.emissiveIntensity=o.emission;}
 const clock={value:0};mat.userData.workshopClock=clock;
 const prior=mat.onBeforeCompile;
 mat.onBeforeCompile=(s,r)=>{prior?.(s,r);s.uniforms.workshopTime=clock;
 s.vertexShader='varying vec3 workshopLocal;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nworkshopLocal = position;');
 s.fragmentShader='varying vec3 workshopLocal;\nuniform float workshopTime;\n'+s.fragmentShader;
 const axis=o.flowAxis||'y',scale=(o.patternScale||20).toFixed(4),turns=(o.flowTurns||0).toFixed(4),colour=new T.Color(o.patternColour||'#183b3f');
 let pattern='';const coord=`(workshopLocal.${axis}/${scale} - workshopTime*${turns})`;
 if(o.pattern==='stripes')pattern=`step(.5,fract(${coord}))`;
 if(o.pattern==='rings')pattern=`step(.5,fract(length(workshopLocal)/${scale}-workshopTime*${turns}))`;
 if(o.pattern==='checker')pattern=`mod(floor(workshopLocal.x/${scale}-workshopTime*${turns})+floor(workshopLocal.y/${scale})+floor(workshopLocal.z/${scale}),2.)`;
 if(o.pattern==='grid')pattern=`1.-step(.08,fract(workshopLocal.x/${scale}-workshopTime*${turns}))*step(.08,fract(workshopLocal.y/${scale}-workshopTime*${turns}))`;
 if(o.renderStyle==='hatch')pattern=`step(.82,fract((workshopLocal.x+workshopLocal.y)/3.))`;
 if(pattern)s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat workshopPattern=${pattern};diffuseColor.rgb=mix(diffuseColor.rgb,vec3(${colour.r.toFixed(5)},${colour.g.toFixed(5)},${colour.b.toFixed(5)}),workshopPattern);`);
 if(o.texture)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('vMapUv );',`fract(vMapUv*${(o.imageRepeat||1).toFixed(4)}+vec2(workshopTime*${turns},0.)) );`));
 let pulse='1.';if(o.emissionMode==='breathe')pulse=`(.15+.85*(.5+.5*sin(workshopTime*6.2831853*${turns})))`;
 if(o.emissionMode==='travel')pulse=`(1.-smoothstep(${(o.pulseWidth*.4).toFixed(4)},${o.pulseWidth.toFixed(4)},abs(fract(${coord})-.5)))`;
 s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\ntotalEmissiveRadiance *= ${pulse};`);
 };mat.customProgramCacheKey=()=>JSON.stringify([o.renderStyle,o.finish,o.pattern,o.flowAxis,o.patternScale,o.patternColour,o.flowTurns,o.emissionMode,o.pulseWidth]);
}
export function surfaceTime(root,turns){const seen=new Set();root.traverse(v=>{for(const m of Array.isArray(v.material)?v.material:[v.material])if(m&&!seen.has(m)){seen.add(m);if(m.userData.workshopClock)m.userData.workshopClock.value=turns;}});}
export function configureLine(mat,o){
 const time={value:0};mat.userData.workshopClock=time;
 mat.onBeforeCompile=s=>{s.uniforms.workshopTime=time;s.vertexShader='varying vec3 workshopLine;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nworkshopLine=position;');s.fragmentShader='varying vec3 workshopLine;\nuniform float workshopTime;\n'+s.fragmentShader;const coord=`(workshopLine.${o.flowAxis||'y'}/${(o.patternScale||20).toFixed(4)}-workshopTime*${(o.flowTurns??1).toFixed(4)})`;let pulse='1.';if(o.emissionMode==='travel')pulse=`(.15+.85*(1.-smoothstep(0.,${(o.pulseWidth||.15).toFixed(4)},abs(fract(${coord})-.5))))`;if(o.emissionMode==='breathe')pulse=`(.15+.85*(.5+.5*sin(workshopTime*6.2831853*${(o.flowTurns??1).toFixed(4)})))`;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\ndiffuseColor.rgb *= ${Math.max(1,o.emission||0).toFixed(4)}*${pulse};`);};
 mat.customProgramCacheKey=()=>JSON.stringify([o.emission,o.emissionMode,o.flowAxis,o.flowTurns,o.patternScale,o.pulseWidth]);
}
