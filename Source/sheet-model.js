import {creaseSettings, creasePoint} from './creases.js';
// Original explicit-time sheet model. Artistic deformation, not a cloth solver.
const clamp=(v,d,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:d));
export function sheetSettings(s={}){
 const value={creaseDetail:clamp(s.creaseDetail,0,0,1),bend:clamp(s.bend,18,-80,80),drape:clamp(s.drape,12,0,80),fold:clamp(s.fold,5,0,30),curl:clamp(s.curl,8,-45,45),wind:clamp(s.wind,0,0,15),cycles:Math.round(clamp(s.cycles,1,1,6)),phase:clamp(s.phase,0,0,1),pins:['none','top','corners'].includes(s.pins)?s.pins:'top',finish:['imported','paper','foil','holo','cloth','leather'].includes(s.finish)?s.finish:'paper',roughness:clamp(s.roughness,.42,.04,1),metalness:clamp(s.metalness,s.finish==='foil'?.95:0,0,1),relief:clamp(s.relief,.6,0,3),marks:[],anchors:[],physics:{}};
 for(const [key,fallback,min,max]of [['sheen',s.finish==='cloth'?.6:0,0,1],['clearcoat',s.finish==='foil'||s.finish==='holo'?.65:0,0,1],['iridescence',s.finish==='holo'?1:0,0,1],['film',420,100,1000],['weave',0,0,1]])value[key]=clamp(s[key],fallback,min,max);
 if(s.marks!==undefined&&!Array.isArray(s.marks))throw Error('Invalid sheet pose.');
 if(s.frozenWind)value.frozenWind={amount:clamp(s.frozenWind.amount,0,0,15),phase:clamp(s.frozenWind.phase,0,0,1)};
 value.marks=(s.marks||[]).slice(0,24).map(m=>({u:clamp(m.u,.5,0,1),v:clamp(m.v,.5,0,1),amount:clamp(m.amount,0,-50,50),radius:clamp(m.radius,.25,.04,.8)}));
 value.anchors=(Array.isArray(s.anchors)?s.anchors:[]).slice(0,8).map(a=>({u:clamp(a.u,.5,0,1),v:clamp(a.v,1,0,1),x:clamp(a.x,0,-200,200),y:clamp(a.y,0,-200,200),z:clamp(a.z,0,-200,200)}));
 const p=s.physics||{};value.physics={gravity:clamp(p.gravity,180,0,600),wind:clamp(p.wind,35,0,200),stiffness:clamp(p.stiffness,.9,.3,1),bend:clamp(p.bend,.25,.02,1),damping:clamp(p.damping,.018,.002,.15),ground:p.ground!==false,floor:clamp(p.floor,0,-300,100),sphere:!!p.sphere,radius:clamp(p.radius,35,10,100),horizontal:!!p.horizontal};
 if(s.bake){const b=s.bake;if(b.cols!==24||b.rows!==20||b.fps!==24||!Array.isArray(b.frames)||b.frames.length<1||b.frames.length>289||b.frames.some(f=>!Array.isArray(f)||f.length!==1575||f.some(v=>!Number.isFinite(v)||Math.abs(v)>5000)))throw Error('Invalid baked cloth.');value.bake={cols:24,rows:20,fps:24,duration:clamp(b.duration,6,1,12),signature:String(b.signature||'').slice(0,10000),frames:b.frames};}
 if(s.crease) value.crease=creaseSettings(s.crease);
 return value;
}
export function sheetPoint(u,v,width,height,s,time=0){
 if(s.crease) return orientSheetPoint(creasePoint(u,v,width,height,s.crease),height,s);
 const edge=s.pins==='top'?1-v:s.pins==='corners'?Math.min(1,Math.hypot(u<.5?u:1-u,1-v)*3):1;
 const phase=2*Math.PI*(time*s.cycles+s.phase),x=(u-.5)*width,y=v*height;
 let z=s.bend*Math.pow(2*u-1,2)+s.drape*Math.sin(Math.PI*u)*(1-v)+s.fold*Math.sin(u*Math.PI*6+v*2)*Math.sin(Math.PI*u)+s.curl*Math.pow(1-v,3);
 z+=s.wind*Math.sin(phase+u*Math.PI*2)*Math.sin(Math.PI*u);
 if(s.frozenWind)z+=s.frozenWind.amount*Math.sin(2*Math.PI*s.frozenWind.phase+u*Math.PI*2)*Math.sin(Math.PI*u);
 if(s.creaseDetail>0){
   const ridge=(x)=>Math.exp(-Math.abs(x)*34);
   const taper=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
   z+=s.creaseDetail*taper*(9*ridge(u-.19-.48*v)-7*ridge(u-.86+.55*v)+5*ridge(v-.66-.24*u));
   z+=s.creaseDetail*taper*2.4*Math.sin(27*u+14*v)*Math.sin(15*v-8*u);
 }
 for(const m of s.marks){const d=((u-m.u)**2+(v-m.v)**2)/(m.radius*m.radius);z+=m.amount*Math.exp(-d*3);}
 let point=[x,y,z*edge];for(const a of s.anchors||[]){const distance=((u-a.u)**2+(v-a.v)**2),w=Math.exp(-distance*30);point[0]+=a.x*w;point[1]+=a.y*w;point[2]+=(a.z-point[2])*w;}return orientSheetPoint(point,height,s);
}
export function orientSheetPoint(p,height,s){return s.physics?.horizontal?[p[0],height*.45+s.physics.radius+25+p[2],p[1]-height/2]:p;}
export function sheetAnchorPoint(o,a){return orientSheetPoint([(a.u-.5)*o.width+a.x,a.v*o.height+a.y,a.z],o.height,o.sheet);}

export function surfacePackage(value){
 if(value?.format!=='jago-surface'||value.version!==1)throw Error('Choose a Material surface package.');
 if(JSON.stringify(value).length>18000000)throw Error('Use a surface package under 18 MB.');
 const maps={};for(const k of ['colour','normal','roughness','metallic']){const s=value.maps?.[k];if(typeof s!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s)||s.length>2000000)throw Error('Invalid '+k+' surface map.');maps[k]=s;}
 const source=value.source;if(source?.format!=='jagomaterial'||!Array.isArray(source.layers)||source.layers.length>24)throw Error('Missing Material source snapshot.');
 return {format:'jago-surface',version:1,name:String(value.name||'Material surface').slice(0,120),maps,source:structuredClone(source)};
}
