// Original explicit-time sheet model. Artistic deformation, not a cloth solver.
const clamp=(v,d,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:d));
export function sheetSettings(s={}){
 const value={bend:clamp(s.bend,18,-80,80),drape:clamp(s.drape,12,0,80),fold:clamp(s.fold,5,0,30),curl:clamp(s.curl,8,-45,45),wind:clamp(s.wind,0,0,15),cycles:Math.round(clamp(s.cycles,1,1,6)),phase:clamp(s.phase,0,0,1),pins:['none','top','corners'].includes(s.pins)?s.pins:'top',finish:['imported','paper','foil','holo','cloth','leather'].includes(s.finish)?s.finish:'paper',roughness:clamp(s.roughness,.42,.04,1),metalness:clamp(s.metalness,0,0,1),relief:clamp(s.relief,.6,0,3),marks:[]};
 if(s.marks!==undefined&&!Array.isArray(s.marks))throw Error('Invalid sheet pose.');
 if(s.frozenWind)value.frozenWind={amount:clamp(s.frozenWind.amount,0,0,15),phase:clamp(s.frozenWind.phase,0,0,1)};
 value.marks=(s.marks||[]).slice(0,24).map(m=>({u:clamp(m.u,.5,0,1),v:clamp(m.v,.5,0,1),amount:clamp(m.amount,0,-50,50),radius:clamp(m.radius,.25,.04,.8)}));
 return value;
}
export function sheetPoint(u,v,width,height,s,time=0){
 const edge=s.pins==='top'?1-v:s.pins==='corners'?Math.min(1,Math.hypot(u<.5?u:1-u,1-v)*3):1;
 const phase=2*Math.PI*(time*s.cycles+s.phase),x=(u-.5)*width,y=v*height;
 let z=s.bend*Math.pow(2*u-1,2)+s.drape*Math.sin(Math.PI*u)*(1-v)+s.fold*Math.sin(u*Math.PI*6+v*2)*Math.sin(Math.PI*u)+s.curl*Math.pow(1-v,3);
 z+=s.wind*Math.sin(phase+u*Math.PI*2)*Math.sin(Math.PI*u);
 if(s.frozenWind)z+=s.frozenWind.amount*Math.sin(2*Math.PI*s.frozenWind.phase+u*Math.PI*2)*Math.sin(Math.PI*u);
 for(const m of s.marks){const d=((u-m.u)**2+(v-m.v)**2)/(m.radius*m.radius);z+=m.amount*Math.exp(-d*3);}
 return[x,y,z*edge];
}
export function surfacePackage(value){
 if(value?.format!=='jago-surface'||value.version!==1)throw Error('Choose a Material surface package.');
 if(JSON.stringify(value).length>18000000)throw Error('Use a surface package under 18 MB.');
 const maps={};for(const k of ['colour','normal','roughness','metallic']){const s=value.maps?.[k];if(typeof s!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s)||s.length>2000000)throw Error('Invalid '+k+' surface map.');maps[k]=s;}
 const source=value.source;if(source?.format!=='jagomaterial'||!Array.isArray(source.layers)||source.layers.length>24)throw Error('Missing Material source snapshot.');
 return {format:'jago-surface',version:1,name:String(value.name||'Material surface').slice(0,120),maps,source:structuredClone(source)};
}
